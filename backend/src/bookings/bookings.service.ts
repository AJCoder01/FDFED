import {
  BadRequestException,
  ConflictException,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { Database } from "../common/database";
import { Actor, found, own, roles, paginate } from "../common/policy";
import { bookingInclude, bookingView } from "../common/serializers";
import {
  Tx,
  audit,
  timeline,
  notify,
  parties,
  admins,
  lockProvider,
} from "../common/effects";
import { availableSlots, slotMinutes, validDate } from "./scheduling";
import { FinanceService, fees, minor } from "../finance/finance.service";
import { BookingDto, ProposalDto, ReviewDto } from "../common/dto";
export function appointment(date: string, slot: string) {
  const minutes = slotMinutes(slot);
  if (!validDate(date) || !Number.isFinite(minutes))
    throw new BadRequestException("Invalid appointment date or time.");
  return new Date(Date.parse(`${date}T00:00:00+05:30`) + minutes * 60000);
}
export const bookingScope = (a: Actor) =>
  a.role === "ADMIN"
    ? {}
    : a.role === "CUSTOMER"
      ? { customerId: a.id }
      : a.role === "PROVIDER"
        ? { providerId: a.id }
        : { disputes: { some: { arbitratorId: a.id } } };
@Injectable()
export class BookingsService {
  constructor(
    private db: Database,
    private finance: FinanceService,
  ) {}
  async list(a: Actor, q: any) {
    return paginate(
      (
        await this.db.booking.findMany({
          where: bookingScope(a),
          include: bookingInclude,
          orderBy: { createdAt: "desc" },
        })
      ).map(bookingView),
      q,
    );
  }
  async get(a: Actor, id: string) {
    return bookingView(
      found(
        await this.db.booking.findFirst({
          where: { id, ...bookingScope(a) },
          include: bookingInclude,
        }),
      ),
    );
  }
  async slots(tx: Tx, serviceId: string, date: string, excludeId?: string) {
    const s = await tx.serviceListing.findUnique({
      where: { id: serviceId },
      include: { provider: { include: { availability: true } } },
    });
    if (!s || s.deletedAt) return [];
    const jobs = await tx.booking.findMany({
      where: {
        providerId: s.providerId,
        scheduledDate: date,
        status: { not: "cancelled" },
      },
    });
    // A reschedule retains the duration agreed when the booking was created.
    const original = excludeId
      ? await tx.booking.findUnique({
          where: { id: excludeId },
          select: { durationMinutes: true },
        })
      : null;
    return availableSlots(
      {
        ...s,
        duration: `${original?.durationMinutes ?? s.durationMinutes} mins`,
      },
      { ...s.provider, weeklyAvailability: s.provider.availability },
      date,
      jobs.map((j) => ({ ...j, duration: `${j.durationMinutes} mins` })),
      [],
      excludeId,
    );
  }
  async availability(
    a: Actor | undefined,
    id: string,
    date: string,
    excludeId?: string,
  ) {
    if (excludeId) {
      if (!a) throw new ForbiddenException();
      await this.get(a, excludeId);
    }
    return this.slots(this.db, id, date, excludeId);
  }
  async locked<T>(id: string, fn: (tx: Tx, b: any) => Promise<T>): Promise<T> {
    return this.db.$transaction(
      async (tx) => {
        const basic = found(
          await tx.booking.findUnique({
            where: { id },
            select: { providerId: true },
          }),
        );
        await lockProvider(tx, basic.providerId);
        const b = await tx.booking.findUniqueOrThrow({
          where: { id },
          include: bookingInclude,
        });
        return fn(tx, b);
      },
      { timeout: 15000 },
    );
  }
  async create(a: Actor, d: BookingDto) {
    roles(a, "CUSTOMER");
    return this.db.$transaction(
      async (tx) => {
        const s = found(
          await tx.serviceListing.findUnique({
            where: { id: d.serviceId },
            include: { category: true, provider: { include: { user: true } } },
          }),
        );
        await lockProvider(tx, s.providerId);
        if (d.requestKey) {
          const previous = await tx.booking.findUnique({
            where: { requestKey: `${a.id}:${d.requestKey}` },
            include: bookingInclude,
          });
          if (previous) return bookingView(previous);
        }
        const current = await tx.serviceListing.findUniqueOrThrow({
          where: { id: d.serviceId },
          include: { category: true, provider: { include: { user: true } } },
        });
        if (
          !(await this.slots(tx, s.id, d.scheduledDate)).includes(
            d.scheduledSlot,
          )
        )
          throw new ConflictException(
            "This time is unavailable. Choose another slot.",
          );
        if (d.amount !== undefined && minor(d.amount) !== current.priceMinor)
          throw new ConflictException(
            "The service price changed. Review the listing before booking.",
          );
        const startsAt = appointment(d.scheduledDate, d.scheduledSlot);
        const b = await tx.booking.create({
          data: {
            customerId: a.id,
            customerName: a.name,
            customerPhone: a.phone,
            providerId: current.providerId,
            providerName: current.provider.businessName,
            providerPhone: current.provider.user.phone,
            serviceId: s.id,
            serviceTitle: current.title,
            categoryName: current.category.name,
            address: d.address,
            durationMinutes: current.durationMinutes,
            startsAt,
            endsAt: new Date(+startsAt + current.durationMinutes * 60000),
            scheduledDate: d.scheduledDate,
            scheduledSlot: d.scheduledSlot,
            notes: d.notes || "",
            requestKey: d.requestKey ? `${a.id}:${d.requestKey}` : null,
            payment: {
              create: {
                amountMinor: current.priceMinor,
                ...fees(current.priceMinor),
                method: d.paymentMethod,
                status:
                  d.paymentMethod === "Cash After Service" ? "Pending" : "Paid",
              },
            },
          },
        });
        await timeline(
          tx,
          b.id,
          "Booking Requested",
          "Simulated payment; no real money transferred.",
        );
        await notify(
          tx,
          [
            [b.providerId, `/provider/jobs/${b.id}`],
            ...(await admins(tx, "/admin/bookings")),
          ],
          "New Job Request",
          `${a.name} booked ${b.serviceTitle}.`,
        );
        await audit(tx, a, "BOOKING_CREATED", b.id);
        return bookingView(
          await tx.booking.findUniqueOrThrow({
            where: { id: b.id },
            include: bookingInclude,
          }),
        );
      },
      { timeout: 15000 },
    );
  }
  async action(a: Actor, id: string, action: string, note: string) {
    return this.locked(id, async (tx, b) => {
      if (action === "cancel") {
        roles(a, "CUSTOMER");
        own(a, b.customerId, false);
      } else {
        roles(a, "PROVIDER");
        own(a, b.providerId, false);
      }
      const valid = {
        accept: b.status === "active" && !b.acceptedAt,
        decline: b.status === "active" && !b.acceptedAt,
        start: b.status === "active" && !!b.acceptedAt,
        complete: b.status === "in_progress",
        cancel: ["active", "in_progress", "reschedule_proposed"].includes(
          b.status,
        ),
      };
      if (!(valid as any)[action])
        throw new ConflictException(
          "This booking has changed or the action is not allowed.",
        );
      if (action === "complete" && !note.trim())
        throw new BadRequestException("Enter completion notes.");
      const status = (
        {
          accept: "active",
          decline: "cancelled",
          start: "in_progress",
          complete: "completed",
          cancel: "cancelled",
        } as any
      )[action];
      await tx.booking.update({
        where: { id },
        data: {
          status,
          ...(action === "accept" ? { acceptedAt: new Date() } : {}),
          ...(action === "complete" ? { completionNotes: note } : {}),
        },
      });
      if (action === "complete" && b.payment.status === "Pending")
        await tx.paymentRecord.update({
          where: { bookingId: id },
          data: { status: "Paid" },
        });
      if (status === "cancelled") {
        await this.finance.refund(
          tx,
          id,
          b.payment.amountMinor,
          `cancel:${id}`,
        );
        await tx.paymentRecord.updateMany({
          where: { bookingId: id, status: "Pending" },
          data: { status: "Cancelled", feeMinor: 0, payoutMinor: 0 },
        });
        await tx.bookingTimeProposal.updateMany({
          where: { bookingId: id, status: "pending" },
          data: { status: "cancelled" },
        });
      }
      await timeline(tx, id, `Booking ${action}`, note || action);
      await notify(
        tx,
        parties(b),
        `Booking ${action}`,
        `${b.serviceTitle}: ${note || action}`,
      );
      await audit(tx, a, `BOOKING_${action.toUpperCase()}`, id);
      return bookingView(
        await tx.booking.findUniqueOrThrow({
          where: { id },
          include: bookingInclude,
        }),
      );
    });
  }
  async propose(a: Actor, id: string, d: ProposalDto) {
    roles(a, "PROVIDER");
    return this.locked(id, async (tx, b) => {
      own(a, b.providerId, false);
      if (
        b.status !== "active" ||
        (b.scheduledDate === d.date && b.scheduledSlot === d.slot)
      )
        throw new ConflictException(
          "Choose a different time for an active booking.",
        );
      if (!(await this.slots(tx, b.serviceId, d.date, id)).includes(d.slot))
        throw new ConflictException("Proposed time is unavailable.");
      await tx.bookingTimeProposal.create({ data: { bookingId: id, ...d } });
      await tx.booking.update({
        where: { id },
        data: { status: "reschedule_proposed" },
      });
      await timeline(
        tx,
        id,
        "Alternative Time Proposed",
        `${d.date} at ${d.slot}. Original time remains reserved.`,
      );
      await notify(tx, parties(b), "Time Proposal", `${d.date} at ${d.slot}`);
      await audit(tx, a, "TIME_PROPOSED", id);
      return bookingView(
        await tx.booking.findUniqueOrThrow({
          where: { id },
          include: bookingInclude,
        }),
      );
    });
  }
  async respond(a: Actor, id: string, accept: boolean) {
    roles(a, "CUSTOMER");
    return this.locked(id, async (tx, b) => {
      own(a, b.customerId, false);
      const proposal = b.proposals[0];
      if (b.status !== "reschedule_proposed" || !proposal)
        throw new ConflictException("No pending proposal.");
      let data: any = { status: "active" };
      if (accept) {
        if (
          !(await this.slots(tx, b.serviceId, proposal.date, id)).includes(
            proposal.slot,
          )
        )
          throw new ConflictException("Proposed time is no longer available.");
        const startsAt = appointment(proposal.date, proposal.slot);
        data = {
          ...data,
          scheduledDate: proposal.date,
          scheduledSlot: proposal.slot,
          startsAt,
          endsAt: new Date(+startsAt + b.durationMinutes * 60000),
          acceptedAt: new Date(),
        };
      }
      await tx.booking.update({ where: { id }, data });
      await tx.bookingTimeProposal.update({
        where: { id: proposal.id },
        data: { status: accept ? "accepted" : "declined" },
      });
      await timeline(
        tx,
        id,
        accept ? "Reschedule Confirmed" : "Time Proposal Declined",
        accept
          ? `${proposal.date} ${proposal.slot}`
          : "Original appointment retained.",
      );
      await notify(
        tx,
        parties(b),
        "Time Proposal Response",
        accept ? "Accepted" : "Declined",
      );
      await audit(tx, a, "TIME_PROPOSAL_RESPONSE", id);
      return bookingView(
        await tx.booking.findUniqueOrThrow({
          where: { id },
          include: bookingInclude,
        }),
      );
    });
  }
  async review(a: Actor, id: string, d: ReviewDto) {
    roles(a, "CUSTOMER");
    return this.locked(id, async (tx, b) => {
      own(a, b.customerId, false);
      if (b.status !== "completed" || b.review)
        throw new ConflictException(
          "Only completed, unreviewed bookings can be reviewed.",
        );
      if (!d.comment.trim()) throw new BadRequestException("Enter a review.");
      await tx.review.create({ data: { bookingId: id, ...d } });
      await notify(
        tx,
        [[b.providerId, "/provider/reviews"]],
        "New Customer Review",
        `${d.rating}/5: ${d.comment}`,
      );
      await audit(tx, a, "REVIEW_CREATED", id);
      return bookingView(
        await tx.booking.findUniqueOrThrow({
          where: { id },
          include: bookingInclude,
        }),
      );
    });
  }
  async reply(a: Actor, id: string, reply: string) {
    roles(a, "PROVIDER");
    return this.locked(id, async (tx, b) => {
      own(a, b.providerId, false);
      if (!b.review || !reply.trim())
        throw new BadRequestException("Enter a reply to an existing review.");
      await tx.review.update({ where: { bookingId: id }, data: { reply } });
      await notify(
        tx,
        [[b.customerId, `/customer/bookings/${id}`]],
        "Provider Review Reply",
        reply,
      );
      await audit(tx, a, "REVIEW_REPLY", id);
      return bookingView(
        await tx.booking.findUniqueOrThrow({
          where: { id },
          include: bookingInclude,
        }),
      );
    });
  }
}

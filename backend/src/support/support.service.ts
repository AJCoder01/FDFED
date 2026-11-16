import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { Database } from "../common/database";
import { Actor, found, own, roles, paginate } from "../common/policy";
import { disputeInclude, disputeView, ticketView } from "../common/serializers";
import {
  audit,
  timeline,
  notify,
  parties,
  admins,
  Tx,
} from "../common/effects";
import {
  BookingsService,
  bookingScope,
  appointment,
} from "../bookings/bookings.service";
import { FinanceService, minor } from "../finance/finance.service";
import {
  DisputeDto,
  TicketDto,
  ResponseDto,
  HearingDto,
  RulingDto,
} from "../common/dto";
const scope = (a: Actor) =>
  a.role === "ADMIN"
    ? {}
    : a.role === "ARBITRATOR"
      ? { arbitratorId: a.id }
      : { booking: bookingScope(a) };
@Injectable()
export class SupportService {
  constructor(
    private db: Database,
    private bookings: BookingsService,
    private finance: FinanceService,
  ) {}
  async tickets(a: Actor, q: any) {
    roles(a, "CUSTOMER", "PROVIDER", "ADMIN");
    return paginate(
      (
        await this.db.supportTicket.findMany({
          where: { booking: bookingScope(a) },
          include: { booking: true },
          orderBy: { createdAt: "desc" },
        })
      ).map(ticketView),
      q,
    );
  }
  async ticket(a: Actor, d: TicketDto) {
    roles(a, "CUSTOMER");
    return this.bookings.locked(d.bookingId, async (tx, b) => {
      own(a, b.customerId, false);
      const t = await tx.supportTicket.create({
        data: d,
        include: { booking: true },
      });
      await notify(
        tx,
        [
          [b.providerId, `/provider/jobs/${b.id}`],
          ...(await admins(tx, "/admin/tickets")),
        ],
        "Support Ticket Opened",
        d.description,
      );
      await audit(tx, a, "TICKET_CREATED", t.id);
      return ticketView(t);
    });
  }
  async attach(tx: Tx, a: Actor, disputeId: string, fileIds: string[]) {
    for (const fileId of fileIds) {
      const f = found(
        await tx.storedFile.findUnique({ where: { id: fileId } }),
      );
      own(a, f.ownerId, false);
      if (f.public)
        throw new BadRequestException("Evidence must be a private upload.");
      await tx.disputeEvidence.create({
        data: { disputeId, fileId, title: f.filename },
      });
    }
  }
  async open(tx: Tx, a: Actor, b: any, d: DisputeDto) {
    if (!["completed", "in_progress"].includes(b.status))
      throw new ConflictException(
        "Disputes require work in progress or completed.",
      );
    if (
      await tx.dispute.findFirst({
        where: { bookingId: b.id, status: { not: "ruled" } },
      })
    )
      throw new ConflictException("This booking already has an open dispute.");
    if (!d.customerStatement.trim())
      throw new BadRequestException("Enter a dispute statement.");
    const disp = await tx.dispute.create({
      data: {
        bookingId: b.id,
        claimMinor: minor(d.claimAmount),
        customerStatement: d.customerStatement,
      },
    });
    await this.attach(tx, a, disp.id, d.fileIds || []);
    await tx.booking.update({
      where: { id: b.id },
      data: { statusBeforeDispute: b.status, status: "disputed" },
    });
    await timeline(tx, b.id, "Dispute Filed", d.customerStatement);
    await notify(
      tx,
      [
        [b.providerId, `/provider/jobs/${b.id}`],
        ...(await admins(tx, "/admin/disputes")),
      ],
      "Dispute Filed",
      disp.id,
    );
    await audit(tx, a, "DISPUTE_FILED", disp.id);
    return disp;
  }
  async resolve(a: Actor, id: string, outcome: string) {
    roles(a, "ADMIN");
    const t = found(await this.db.supportTicket.findUnique({ where: { id } }));
    return this.bookings.locked(t.bookingId, async (tx, b) => {
      const ticket = await tx.supportTicket.findUniqueOrThrow({
        where: { id },
      });
      if (ticket.status === "resolved")
        throw new ConflictException("Ticket already resolved.");
      if (outcome === "Escalated to Arbitration")
        await this.open(tx, a, b, {
          bookingId: b.id,
          claimAmount: b.payment.amountMinor / 100,
          customerStatement: ticket.description,
          fileIds: [],
        });
      if (outcome === "Full Mock Refund Issued")
        await this.finance.refund(
          tx,
          b.id,
          b.payment.amountMinor,
          `ticket:${id}`,
        );
      if (outcome === "Partial Refund (50%)")
        await this.finance.refund(
          tx,
          b.id,
          Math.floor((b.payment.amountMinor + 1) / 2),
          `ticket:${id}`,
        );
      const updated = await tx.supportTicket.update({
        where: { id },
        data: { status: "resolved", resolutionOutcome: outcome },
        include: { booking: true },
      });
      await timeline(tx, b.id, "Support Ticket Resolved", outcome);
      await notify(tx, parties(b), "Support Ticket Resolved", outcome);
      await audit(tx, a, "TICKET_RESOLVED", `${id}: ${outcome}`);
      return ticketView(updated);
    });
  }
  async disputes(a: Actor, q: any) {
    return paginate(
      (
        await this.db.dispute.findMany({
          where: scope(a),
          include: disputeInclude,
          orderBy: { createdAt: "desc" },
        })
      ).map(disputeView),
      q,
    );
  }
  async get(a: Actor, id: string) {
    return disputeView(
      found(
        await this.db.dispute.findFirst({
          where: { id, ...scope(a) },
          include: disputeInclude,
        }),
      ),
    );
  }
  async file(a: Actor, d: DisputeDto) {
    roles(a, "CUSTOMER");
    return this.bookings.locked(d.bookingId, async (tx, b) => {
      own(a, b.customerId, false);
      const disp = await this.open(tx, a, b, d);
      return disputeView(
        await tx.dispute.findUniqueOrThrow({
          where: { id: disp.id },
          include: disputeInclude,
        }),
      );
    });
  }
  async act(
    a: Actor,
    id: string,
    fn: (tx: Tx, d: any, b: any) => Promise<void>,
  ) {
    const d = found(
      await this.db.dispute.findFirst({ where: { id, ...scope(a) } }),
    );
    return this.bookings.locked(d.bookingId, async (tx, b) => {
      const current = await tx.dispute.findUniqueOrThrow({
        where: { id },
        include: disputeInclude,
      });
      if (current.status === "ruled")
        throw new ConflictException("This case already has a ruling.");
      if (a.role === "ARBITRATOR") own(a, current.arbitratorId, false);
      await fn(tx, current, b);
      await audit(tx, a, "DISPUTE_UPDATED", id);
      return disputeView(
        await tx.dispute.findUniqueOrThrow({
          where: { id },
          include: disputeInclude,
        }),
      );
    });
  }
  async response(a: Actor, id: string, v: ResponseDto) {
    roles(a, "PROVIDER");
    return this.act(a, id, async (tx, d, b) => {
      own(a, b.providerId, false);
      await tx.dispute.update({
        where: { id },
        data: { providerStatement: v.statement },
      });
      await this.attach(tx, a, id, v.fileIds);
      await notify(
        tx,
        d.arbitratorId
          ? [[d.arbitratorId, `/arbitrator/cases/${id}`]]
          : await admins(tx, "/admin/disputes"),
        "Provider Dispute Response",
        id,
      );
    });
  }
  async assign(a: Actor, id: string, arbitratorId: string) {
    roles(a, "ADMIN");
    return this.act(a, id, async (tx, d, b) => {
      const u = found(
        await tx.user.findFirst({
          where: { id: arbitratorId, role: "ARBITRATOR", deletedAt: null },
        }),
      );
      await tx.dispute.update({
        where: { id },
        data: { arbitratorId, status: "assigned" },
      });
      await tx.hearing.deleteMany({ where: { disputeId: id } });
      await notify(
        tx,
        [...parties(b), [u.id, `/arbitrator/cases/${id}`]],
        "Arbitrator Assigned",
        u.name,
      );
    });
  }
  async hearing(a: Actor, id: string, v: HearingDto) {
    roles(a, "ARBITRATOR");
    return this.act(a, id, async (tx, d, b) => {
      own(a, d.arbitratorId, false);
      const startsAt = appointment(v.scheduledDate, v.scheduledTime);
      if (startsAt <= new Date())
        throw new BadRequestException("Choose a future hearing time.");
      const data = { ...v, startsAt };
      await tx.hearing.upsert({
        where: { disputeId: id },
        create: { disputeId: id, ...data },
        update: data,
      });
      await tx.dispute.update({
        where: { id },
        data: { status: "hearing_scheduled" },
      });
      await timeline(
        tx,
        b.id,
        "Dispute Hearing Scheduled",
        `${v.scheduledDate} ${v.scheduledTime}`,
      );
      await notify(
        tx,
        parties(b),
        "Dispute Hearing Scheduled",
        `${v.scheduledDate} ${v.scheduledTime}: ${v.meetUrl}`,
      );
    });
  }
  async ruling(a: Actor, id: string, v: RulingDto) {
    roles(a, "ARBITRATOR");
    return this.act(a, id, async (tx, d, b) => {
      own(a, d.arbitratorId, false);
      if (b.status !== "disputed")
        throw new ConflictException("Booking has no open dispute.");
      if (v.reason.trim().split(/\s+/).length < 20)
        throw new BadRequestException("Enter at least 20 words of rationale.");
      const awardMinor = minor(v.awardAmount);
      await tx.ruling.create({
        data: {
          disputeId: id,
          verdict: v.verdict,
          awardMinor,
          reason: v.reason,
        },
      });
      await tx.dispute.update({ where: { id }, data: { status: "ruled" } });
      if (!v.verdict.toLowerCase().includes("provider"))
        await this.finance.refund(tx, b.id, awardMinor, `ruling:${id}`);
      const p = await tx.paymentRecord.findUniqueOrThrow({
        where: { bookingId: b.id },
      });
      await tx.booking.update({
        where: { id: b.id },
        data: {
          status:
            p.status === "Refunded"
              ? "cancelled"
              : b.statusBeforeDispute || "completed",
        },
      });
      await timeline(
        tx,
        b.id,
        "Dispute Resolved",
        `${v.verdict}. Recorded award ₹${v.awardAmount}; refund limited to simulated collected funds.`,
      );
      await notify(
        tx,
        [...parties(b), ...(await admins(tx, "/admin/disputes"))],
        "Dispute Ruling Issued",
        `${id}: ${v.verdict}`,
      );
    });
  }
}

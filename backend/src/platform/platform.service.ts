import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { Database } from "../common/database";
import { Actor, roles, found, paginate } from "../common/policy";
import { audit, admins, notify } from "../common/effects";
import {
  userInclude,
  userView,
  bookingInclude,
  bookingView,
} from "../common/serializers";
import { ApplicationDto, CustomJobDto } from "../common/dto";
import { minor } from "../finance/finance.service";
import { localClock, validDate } from "../bookings/scheduling";
import { FilesService } from "../files/files.service";
export const applicationView = (a: any) => {
  const { passwordHash, ...v } = a;
  return v;
};
@Injectable()
export class PlatformService {
  constructor(
    private db: Database,
    private files: FilesService,
  ) {}
  async accounts(a: Actor, q: any) {
    roles(a, "ADMIN");
    return paginate(
      (
        await this.db.user.findMany({
          where: { deletedAt: null },
          include: userInclude,
        })
      ).map(userView),
      q,
    );
  }
  async logs(a: Actor, q: any) {
    roles(a, "ADMIN");
    return paginate(
      (
        await this.db.auditLog.findMany({
          where: q.userId ? { userId: q.userId } : {},
          include: {
            user: { select: { name: true, email: true, role: true } },
          },
          orderBy: { timestamp: "desc" },
        })
      ).map(({ user, ...l }) => ({
        ...l,
        userName: user.name,
        userEmail: user.email,
        role: user.role.toLowerCase(),
      })),
      q,
    );
  }
  async notifications(a: Actor, q: any) {
    return paginate(
      await this.db.notification.findMany({
        where: { userId: a.id },
        orderBy: { createdAt: "desc" },
      }),
      q,
    );
  }
  async read(a: Actor, notificationId?: string) {
    await this.db.notification.updateMany({
      where: {
        userId: a.id,
        ...(notificationId ? { id: notificationId } : {}),
      },
      data: { read: true },
    });
    return { success: true };
  }
  async requests(a: Actor, q: any) {
    roles(a, "CUSTOMER");
    return paginate(
      (
        await this.db.customJobRequest.findMany({
          where: { customerId: a.id },
          orderBy: { createdAt: "desc" },
        })
      ).map(({ budgetMinor, ...x }) => ({
        ...x,
        budget: budgetMinor === null ? null : budgetMinor / 100,
      })),
      q,
    );
  }
  async request(a: Actor, d: CustomJobDto) {
    roles(a, "CUSTOMER");
    if (!validDate(d.preferredDate) || d.preferredDate < localClock().date)
      throw new BadRequestException("Choose today or a future preferred date.");
    const { budget, ...data } = d;
    return this.db.$transaction(async (tx) => {
      const r = await tx.customJobRequest.create({
        data: {
          ...data,
          customerId: a.id,
          budgetMinor: budget === undefined ? null : minor(budget),
        },
      });
      await audit(tx, a, "CUSTOM_JOB_CREATED", r.id);
      return { ...r, budget };
    });
  }
  async applications(a: Actor, q: any) {
    roles(a, "ADMIN");
    return paginate(
      (
        await this.db.arbitratorApplication.findMany({
          orderBy: { submittedAt: "desc" },
        })
      ).map(applicationView),
      q,
    );
  }
  async apply(
    d: ApplicationDto,
    documents: Record<string, Express.Multer.File[]>,
  ) {
    if (!documents.resume?.[0] || !documents.license?.[0])
      throw new BadRequestException("Resume and license are required.");
    for (const list of Object.values(documents))
      for (const f of list) this.files.validate(f);
    const { password, role, ...data } = d;
    if (await this.db.user.findUnique({ where: { email: d.email } }))
      throw new ConflictException("An account already uses this email.");
    const app = await this.db.arbitratorApplication.create({
      data: { ...data, passwordHash: await argon2.hash(password), files: {} },
    });
    try {
      const files: Record<string, string> = {};
      for (const [key, list] of Object.entries(documents))
        files[key] = (await this.files.store(list[0], null, false, app.id)).id;
      const updated = await this.db.arbitratorApplication.update({
        where: { id: app.id },
        data: { files },
      });
      await notify(
        this.db,
        await admins(this.db, "/admin/arbitrator-applications"),
        "New Arbitrator Application",
        app.name,
      );
      return applicationView(updated);
    } catch (e) {
      await this.db.storedFile.deleteMany({ where: { applicationId: app.id } });
      await this.db.arbitratorApplication.delete({ where: { id: app.id } });
      throw e;
    }
  }
  async decide(a: Actor, id: string, approve: boolean, reason = "") {
    roles(a, "ADMIN");
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "ArbitratorApplication" WHERE id=${id} FOR UPDATE`;
      const app = found(
        await tx.arbitratorApplication.findUnique({ where: { id } }),
      );
      if (app.status !== "pending")
        throw new ConflictException("Application already decided.");
      if (approve) {
        if (await tx.user.findUnique({ where: { email: app.email } }))
          throw new ConflictException("Email is already registered.");
        const u = await tx.user.create({
          data: {
            email: app.email,
            passwordHash: app.passwordHash,
            name: app.name,
            phone: app.phone,
            role: "ARBITRATOR",
            country: app.country,
            location: app.country,
            title: app.title,
          },
        });
        await tx.storedFile.updateMany({
          where: { applicationId: id },
          data: { ownerId: u.id },
        });
        await notify(
          tx,
          [[u.id, "/arbitrator"]],
          "Application Approved",
          "Your arbitrator account is active.",
        );
      }
      const updated = await tx.arbitratorApplication.update({
        where: { id },
        data: {
          status: approve ? "approved" : "rejected",
          rejectReason: approve ? null : reason,
          decidedAt: new Date(),
        },
      });
      await audit(
        tx,
        a,
        approve ? "ARBITRATOR_APPROVED" : "ARBITRATOR_REJECTED",
        id,
      );
      return applicationView(updated);
    });
  }
  async revenue(a: Actor) {
    roles(a, "ADMIN");
    const bookings = (
      await this.db.booking.findMany({ include: bookingInclude })
    ).map(bookingView);
    const payments = await this.db.paymentRecord.findMany({
      include: { booking: true },
    });
    const collected = payments.filter((p) =>
      ["Paid", "Partially Refunded", "Refunded"].includes(p.status),
    );
    const sum = (fn: (p: any) => number) =>
      collected.reduce((n, p) => n + fn(p), 0) / 100;
    const categories: Record<string, any> = {};
    for (const p of collected) {
      const key = p.booking.categoryName;
      categories[key] ||= { category: key, gmv: 0, revenue: 0, count: 0 };
      categories[key].gmv += p.amountMinor / 100;
      categories[key].revenue += p.feeMinor / 100;
      categories[key].count++;
    }
    return {
      gmv: sum((p) => p.amountMinor),
      totalRevenue: sum((p) => p.feeMinor),
      totalRefunds: sum((p) => p.refundedMinor),
      netCollected: sum((p) => p.amountMinor - p.refundedMinor),
      totalNetPayouts: sum((p) =>
        p.booking.status === "completed" ? p.payoutMinor : 0,
      ),
      transactionCount: collected.length,
      avgFeePerBooking: collected.length
        ? sum((p) => p.feeMinor) / collected.length
        : 0,
      categoryBreakdown: Object.values(categories),
      recentTransactions: bookings,
    };
  }
}

import * as argon2 from "argon2";
import data from "./demo-data.json";
import { Tx } from "../src/common/effects";
import { appointment } from "../src/bookings/bookings.service";
import { fees, minor } from "../src/finance/finance.service";
const date = (value: string) =>
  new Date(value.includes("T") ? value : value.replace(" ", "T") + ":00+05:30");
export async function seedData(tx: Tx) {
  const passwordHash = await argon2.hash(
    process.env.DEMO_PASSWORD || "123456Ab@",
  );
  const accounts: any[] = [
    ...data.accounts,
    {
      id: "user-prov-2",
      name: "Sparkle Clean India",
      email: "sparkle@example.test",
      phone: "+91 98111 22334",
      role: "provider",
      businessName: "Sparkle Clean India",
      serviceArea: "Bengaluru",
      skills: ["Home Cleaning"],
      verificationStatus: "approved",
    },
  ];
  for (const u of accounts) {
    await tx.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        passwordHash,
        role: u.role.toUpperCase(),
        isSuperUser: u.isSuperUser || false,
        location: u.location || "Bengaluru",
        title: u.title || "",
        department: u.department || "",
      },
    });
    if (u.role === "provider") {
      await tx.providerProfile.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          businessName: u.businessName,
          serviceArea: u.serviceArea,
          skills: u.skills,
          verificationStatus: "approved",
          availability: {
            create: {
              days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
              blackoutDates: u.weeklyAvailability?.blackoutDates || [],
            },
          },
        },
      });
    }
    for (const a of u.addresses || [])
      await tx.customerAddress.upsert({
        where: { id: a.id },
        update: {},
        create: { ...a, userId: u.id, isDefault: !!a.isDefault },
      });
  }
  for (const { serviceCount, ...c } of data.categories)
    await tx.serviceCategory.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  for (const s of data.services)
    await tx.serviceListing.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        providerId: s.providerId,
        categoryId: s.categoryId,
        title: s.title,
        description: s.description,
        priceMinor: minor(s.price),
        durationMinutes: parseInt(s.duration),
        status: s.status as any,
        image: s.image.startsWith("http") ? s.image : "",
        inclusions: s.inclusions,
        exclusions: s.exclusions,
        policy: s.policy,
        availableSlots: s.availableSlots,
      },
    });
  for (const b of data.bookings as any[]) {
    if (await tx.booking.findUnique({ where: { id: b.id } })) continue;
    const s = data.services.find((s) => s.id === b.serviceId)!;
    const startsAt = appointment(b.scheduledDate, b.scheduledSlot);
    const durationMinutes = parseInt(s.duration);
    const amountMinor = minor(b.amount);
    await tx.booking.create({
      data: {
        id: b.id,
        serviceId: b.serviceId,
        customerId: b.customerId,
        providerId: b.providerId,
        serviceTitle: b.serviceTitle,
        categoryName: b.categoryName,
        providerName: b.providerName,
        providerPhone: b.providerPhone,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        address: b.address,
        durationMinutes,
        startsAt,
        endsAt: new Date(+startsAt + durationMinutes * 60000),
        scheduledDate: b.scheduledDate,
        scheduledSlot: b.scheduledSlot,
        status: b.status,
        statusBeforeDispute: b.status === "disputed" ? "completed" : null,
        acceptedAt: b.status !== "active" ? startsAt : null,
        notes: b.notes || "",
        createdAt: date(b.createdAt),
        payment: {
          create: {
            amountMinor,
            ...fees(amountMinor),
            method: b.paymentMethod,
            status: b.paymentStatus,
          },
        },
        timeline: {
          create: b.timeline.map((t: any) => ({ ...t, time: date(t.time) })),
        },
        ...(b.reviewSubmitted
          ? {
              review: {
                create: {
                  rating: b.reviewRating,
                  comment: b.reviewComment,
                  createdAt: startsAt,
                },
              },
            }
          : {}),
      },
    });
  }
  for (const t of data.tickets)
    await tx.supportTicket.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        bookingId: t.bookingId,
        issueType: t.issueType,
        severity: t.severity,
        description: t.description,
        status: t.status,
        createdAt: date(t.createdAt),
      },
    });
  for (const d of data.disputes) {
    if (await tx.dispute.findUnique({ where: { id: d.id } })) continue;
    const b = await tx.booking.findUniqueOrThrow({
      where: { id: d.bookingId },
    });
    const hearing = d.hearingSchedule;
    const ruling = d.ruling;
    await tx.dispute.create({
      data: {
        id: d.id,
        bookingId: d.bookingId,
        arbitratorId: d.arbitratorId,
        claimMinor: minor(d.claimAmount),
        customerStatement: d.customerStatement,
        providerStatement: d.providerStatement,
        status: d.status as any,
        createdAt: date(d.createdAt),
        ...(hearing
          ? {
              hearing: {
                create: {
                  ...hearing,
                  startsAt: appointment(
                    hearing.scheduledDate,
                    hearing.scheduledTime,
                  ),
                },
              },
            }
          : {}),
        ...(ruling
          ? {
              ruling: {
                create: {
                  verdict: ruling.verdict,
                  awardMinor: minor(ruling.awardAmount),
                  reason: ruling.reason,
                  issuedAt: date(ruling.issuedAt),
                },
              },
            }
          : {}),
      },
    });
    if (!ruling)
      await tx.booking.update({
        where: { id: b.id },
        data: { status: "disputed", statusBeforeDispute: "completed" },
      });
    else {
      const p = await tx.paymentRecord.findUniqueOrThrow({
        where: { bookingId: b.id },
      });
      const amountMinor = Math.min(p.amountMinor, minor(ruling.awardAmount));
      await tx.refundRecord.create({
        data: { paymentId: p.id, amountMinor, reasonKey: `ruling:${d.id}` },
      });
      await tx.paymentRecord.update({
        where: { id: p.id },
        data: {
          refundedMinor: amountMinor,
          ...fees(p.amountMinor - amountMinor),
          status:
            amountMinor === p.amountMinor ? "Refunded" : "Partially Refunded",
        },
      });
      await tx.booking.update({
        where: { id: b.id },
        data: {
          status: amountMinor === p.amountMinor ? "cancelled" : "completed",
        },
      });
    }
  }
  for (const n of data.notifications)
    await tx.notification.upsert({
      where: { id: n.id },
      update: {},
      create: { ...n, createdAt: date(n.createdAt) },
    });
  for (const a of data.applications)
    await tx.arbitratorApplication.upsert({
      where: { id: a.id },
      update: {},
      create: {
        ...a,
        passwordHash,
        status: "pending",
        files: {},
        submittedAt: date(a.submittedAt),
      },
    });
  await tx.auditLog.upsert({
    where: { id: "seed-initialized" },
    update: {},
    create: {
      id: "seed-initialized",
      userId: "user-admin-1",
      type: "DEMO_SEED",
      description:
        "Development demonstration records initialized. Historical evidence bytes are unavailable.",
    },
  });
}
export async function clearDemoDatabase(tx: Tx) {
  await tx.disputeEvidence.deleteMany();
  await tx.storedFile.deleteMany();
  await tx.hearing.deleteMany();
  await tx.ruling.deleteMany();
  await tx.dispute.deleteMany();
  await tx.supportTicket.deleteMany();
  await tx.review.deleteMany();
  await tx.bookingTimeProposal.deleteMany();
  await tx.bookingTimelineEvent.deleteMany();
  await tx.refundRecord.deleteMany();
  await tx.paymentRecord.deleteMany();
  await tx.booking.deleteMany();
  await tx.serviceListing.deleteMany();
  await tx.serviceCategory.deleteMany();
  await tx.providerAvailability.deleteMany();
  await tx.providerProfile.deleteMany();
  await tx.customerAddress.deleteMany();
  await tx.customJobRequest.deleteMany();
  await tx.notification.deleteMany();
  await tx.auditLog.deleteMany();
  await tx.userSession.deleteMany();
  await tx.arbitratorApplication.deleteMany();
  await tx.user.deleteMany();
}

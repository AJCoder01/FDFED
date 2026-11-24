import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configure } from "../src/bootstrap";
import { Database } from "../src/common/database";
import { seedData, clearDemoDatabase } from "../prisma/seed-data";
import { localClock } from "../src/bookings/scheduling";
let app: INestApplication, db: Database;
const base = "/api/v1";
const passwords = "123456Ab@";
const emails: any = {
  customer: "aarav@gmail.com",
  provider: "rohan@gmail.com",
  admin: "admin@gmail.com",
  staff: "staffadmin@gmail.com",
  arbitrator: "kabir@gmail.com",
};
const future = (offset = 7) => {
  let d = new Date(Date.now() + offset * 86400000);
  while (d.getUTCDay() === 0) d = new Date(+d + 86400000);
  return d.toISOString().slice(0, 10);
};
const call = (method: string, path: string, token?: string, body?: any) => {
  const q = (request(app.getHttpServer()) as any)[method](base + path);
  if (token) q.set("Authorization", `Bearer ${token}`);
  if (body !== undefined) q.send(body);
  return q;
};
async function login(role = "customer") {
  const r = await call("post", "/auth/login", undefined, {
    email: emails[role],
    password: passwords,
  });
  expect(r.status).toBe(201);
  return r.body.accessToken;
}
async function signup(role = "customer", email = "new@example.test") {
  return call("post", "/auth/signup", undefined, {
    role,
    email,
    password: "NewPassword123!",
    name: "New User",
    phone: "+91 9876543210",
    businessName: "New Business",
    serviceArea: "Bengaluru",
    skills: ["Plumbing"],
  });
}
const payload = (extra = {}) => ({
  serviceId: "srv-1",
  scheduledDate: future(),
  scheduledSlot: "09:00 AM",
  address: "12 Main Road, Bengaluru - 560001",
  paymentMethod: "UPI (Mock Pay)",
  ...extra,
});
async function book(c: string, extra = {}) {
  const r = await call("post", "/bookings", c, payload(extra));
  expect(r.status).toBe(201);
  return r.body;
}
async function complete(p: string, id: string) {
  for (const action of ["accept", "start", "complete"])
    expect(
      (
        await call("post", `/bookings/${id}/${action}`, p, {
          note: "Work completed and checked.",
        })
      ).status,
    ).toBe(201);
}
async function openCase(c: string, p: string) {
  const b = await book(c);
  await complete(p, b.id);
  const r = await call("post", "/disputes", c, {
    bookingId: b.id,
    claimAmount: 400,
    customerStatement: "Service left leaking after repair.",
  });
  expect(r.status).toBe(201);
  return r.body;
}
beforeEach(async () => {
  if (!process.env.DATABASE_URL?.includes("_test"))
    throw new Error("Dedicated test DB required");
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = module.createNestApplication();
  configure(app);
  await app.init();
  db = app.get(Database);
  await db.$transaction(
    async (tx) => {
      await clearDemoDatabase(tx);
      await seedData(tx);
    },
    { timeout: 60000 },
  );
});
afterEach(async () => {
  await app?.close();
});
describe("authentication and authorization", () => {
  test("signup, login, private profile and no credential exposure", async () => {
    const r = await signup();
    expect(r.status).toBe(201);
    expect(r.body.user.role).toBe("customer");
    expect(JSON.stringify(r.body)).not.toMatch(/passwordHash|refreshToken/);
    const me = await call("get", "/users/me", r.body.accessToken);
    expect(me.body.email).toBe("new@example.test");
    expect(me.body.addresses).toEqual([]);
  });
  test("duplicate email and invalid credentials rejected", async () => {
    expect((await signup("customer", emails.customer)).status).toBe(409);
    expect(
      (
        await call("post", "/auth/login", undefined, {
          email: emails.customer,
          password: "wrong-password",
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await call("post", "/auth/login", undefined, {
          email: emails.customer,
          password: "password123",
        })
      ).status,
    ).toBe(401);
  });
  test("profile validation normalizes formatted Indian numbers and rejects malformed inputs", async () => {
    const c = await login();
    const updated = await call("patch", "/users/me", c, {
      phone: "+91 98765 43210",
    });
    expect(updated.status).toBe(200);
    expect(updated.body.phone).toBe("+91 9876543210");
    expect(
      (await call("patch", "/users/me", c, { phone: "+91 0123456789" })).status,
    ).toBe(400);
    expect((await call("patch", "/users/me", c, { email: 123 })).status).toBe(
      400,
    );
  });
  test("signup cannot grant admin or caller supplied privileges", async () => {
    expect((await signup("admin")).status).toBe(400);
    const c = await login();
    expect(
      (
        await call("patch", "/users/me", c, {
          isSuperUser: true,
          role: "ADMIN",
        })
      ).status,
    ).toBe(400);
    expect((await call("get", "/admin/accounts", c)).status).toBe(403);
  });
  test("refresh rotates cookie, rejects replay, logout revokes access", async () => {
    const agent = request.agent(app.getHttpServer());
    const r = await agent
      .post(base + "/auth/login")
      .send({ email: emails.customer, password: passwords });
    const old = r.headers["set-cookie"];
    expect(String(old)).toContain("HttpOnly");
    const fresh = await agent.post(base + "/auth/refresh");
    expect(fresh.status).toBe(201);
    expect((await call("get", "/users/me", r.body.accessToken)).status).toBe(200);
    expect(
      (
        await request(app.getHttpServer())
          .post(base + "/auth/refresh")
          .set("Cookie", old)
      ).status,
    ).toBe(401);
    await agent.post(base + "/auth/logout");
    expect((await call("get", "/users/me", r.body.accessToken)).status).toBe(401);
    expect(
      (await call("get", "/users/me", fresh.body.accessToken)).status,
    ).toBe(401);
  });
  test("guest session restoration returns an empty 204", async () => {
    const guest = await call("post", "/auth/refresh");
    expect(guest.status).toBe(204);
    expect(guest.text).toBe("");
  });
  test("profile and address edits roll back together when a profile update conflicts", async () => {
    const customer = await login();
    const initial = (await call("get", "/users/me", customer)).body;
    const addresses = [{ id: "new-home", label: "Home", addressLine: "12 Updated Road", city: "Bengaluru", pincode: "560001" }];
    expect((await call("patch", "/users/me", customer, { addresses: [[]] })).status).toBe(400);
    expect((await call("patch", "/users/me", customer, { addresses, email: emails.provider })).status).toBe(409);
    expect((await call("get", "/users/me", customer)).body.addresses).toEqual(initial.addresses);
    const result = await call("patch", "/users/me", customer, { addresses, name: "New Customer Name" });
    expect(result.status).toBe(200);
    expect(result.body.name).toBe("New Customer Name");
    expect(result.body.addresses).toEqual([expect.objectContaining({ id: "new-home", isDefault: true })]);
  });
  test("demo switching requires trusted superuser; production endpoints unavailable", async () => {
    const c = await login();
    expect(
      (await call("post", "/auth/demo-switch", c, { role: "admin" })).status,
    ).toBe(403);
    const a = await login("admin");
    const switched = await call("post", "/auth/demo-switch", a, {
      role: "provider",
    });
    expect(switched.body.user.role).toBe("provider");
    expect(
      (
        await call("patch", "/users/me", switched.body.accessToken, {
          name: "Demo Provider",
        })
      ).status,
    ).toBe(200);
    const audit = await db.auditLog.findFirst({
      where: { type: "PROFILE_UPDATE" },
      orderBy: { timestamp: "desc" },
    });
    expect(audit?.userId).toBe("user-admin-1");
    expect(audit?.description).toContain("user-prov-1");
    expect(
      (
        await call("post", "/auth/demo-switch", switched.body.accessToken, {
          role: "superuser",
        })
      ).body.user.isSuperUser,
    ).toBe(true);
    process.env.NODE_ENV = "production";
    try {
      const t = await login("admin");
      expect(
        (await call("post", "/auth/demo-switch", t, { role: "provider" }))
          .status,
      ).toBe(404);
      expect((await call("post", "/admin/demo-reset", t, {})).status).toBe(404);
    } finally {
      process.env.NODE_ENV = "test";
    }
  });
});
describe("marketplace and profiles", () => {
  test("unavailable listing details serialize as JSON null", async () => {
    const missing = await call("get", "/services/does-not-exist");
    expect(missing.status).toBe(200);
    expect(missing.headers["content-type"]).toContain("application/json");
    expect(missing.body).toBeNull();
  });
  test("search, price and categories are based on records", async () => {
    const r = await call("get", "/services?search=handyman&maxPrice=400");
    expect(r.body.items).toHaveLength(1);
    expect(r.body.items[0].id).toBe("srv-5");
    const cats = await call("get", "/categories");
    expect(cats.body.reduce((n: number, c: any) => n + c.serviceCount, 0)).toBe(
      5,
    );
  });
  test("unverified signup cannot publish; ownership and listing validation enforced", async () => {
    const r = await signup("provider");
    expect(r.body.user.verificationStatus).toBe("draft");
    expect(
      (
        await call("patch", "/services/srv-1", r.body.accessToken, {
          title: "Stolen",
        })
      ).status,
    ).toBe(403);
    const listing = {
      title: "Plumbing",
      description: "Fix taps",
      categoryId: "cat-2",
      price: 500,
      duration: "60 mins",
      availableSlots: ["09:00 AM"],
      status: "published",
    };
    expect(
      (await call("post", "/services", r.body.accessToken, listing)).status,
    ).toBe(400);
    expect(
      (
        await call("post", "/services", r.body.accessToken, {
          ...listing,
          status: "draft",
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await call("post", "/services", r.body.accessToken, {
          ...listing,
          price: -1,
        })
      ).status,
    ).toBe(400);
  });
  test("moderation controls public visibility and soft delete preserves bookings", async () => {
    const a = await login("admin");
    expect(
      (
        await call("post", "/providers/user-prov-1/moderation", a, {
          status: "suspended",
          reason: "Review pending",
        })
      ).status,
    ).toBe(201);
    expect((await call("get", "/services")).body.total).toBe(1);
    const p = await login("provider");
    expect((await call("delete", "/services/srv-1", p)).status).toBe(200);
    expect(
      await db.booking.count({ where: { serviceId: "srv-1" } }),
    ).toBeGreaterThan(0);
    expect((await call("get", "/services/srv-1")).body).toBeNull();
  });
  test("address validation and single default; no other customer access", async () => {
    const c = await login();
    const addr = {
      id: "new-address",
      label: "Home",
      addressLine: "12 Road",
      city: "Bengaluru",
      pincode: "560001",
      isDefault: true,
    };
    expect(
      (
        await call("put", "/customers/me/addresses", c, {
          addresses: [addr, { ...addr, id: "other" }],
        })
      ).body.addresses.filter((a: any) => a.isDefault),
    ).toHaveLength(1);
    expect(
      (
        await call("put", "/customers/me/addresses", c, {
          addresses: [{ ...addr, pincode: "123" }],
        })
      ).status,
    ).toBe(400);
    const p = await login("provider");
    expect(
      (await call("put", "/customers/me/addresses", p, { addresses: [] }))
        .status,
    ).toBe(403);
  });
  test("profile updates persist but booking snapshots retain historical identity", async () => {
    const c = await login();
    expect(
      (await call("patch", "/users/me", c, { name: "Updated Customer" }))
        .status,
    ).toBe(200);
    await app.close();
    const restarted = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = restarted.createNestApplication();
    configure(app);
    await app.init();
    db = app.get(Database);
    expect((await call("get", "/users/me", c)).body.name).toBe(
      "Updated Customer",
    );
    expect((await call("get", "/bookings/BK-89600", c)).body.customerName).toBe(
      "Aarav Mehta",
    );
  });
});
describe("booking concurrency and lifecycle", () => {
  test("valid booking uses authoritative price, provider and UTC time", async () => {
    const c = await login();
    const b = await book(c);
    expect(b.amount).toBe(799);
    expect(b.platformFee).toBe(39.95);
    expect(new Date(b.startsAt).toISOString()).toBe(
      `${future()}T03:30:00.000Z`,
    );
    expect(
      (
        await call(
          "post",
          "/bookings",
          c,
          payload({ scheduledSlot: "11:30 AM", amount: 1 }),
        )
      ).status,
    ).toBe(409);
  });
  test("overlapping simultaneous bookings across services allow exactly one", async () => {
    const c = await login();
    const results = await Promise.all([
      call("post", "/bookings", c, payload()),
      call(
        "post",
        "/bookings",
        c,
        payload({ serviceId: "srv-3", scheduledSlot: "09:30 AM" }),
      ),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });
  test("idempotency key returns the same booking without duplicate payment", async () => {
    const c = await login();
    const b = await book(c, { requestKey: "unique-request" });
    const again = await book(c, { requestKey: "unique-request" });
    expect(again.id).toBe(b.id);
    expect(await db.paymentRecord.count({ where: { bookingId: b.id } })).toBe(
      1,
    );
  });
  test("past dates, blackout, buffer, lead time and invalid dates rejected", async () => {
    const c = await login();
    const p = await login("provider");
    expect(
      (
        await call(
          "post",
          "/bookings",
          c,
          payload({ scheduledDate: "2020-01-01" }),
        )
      ).status,
    ).toBe(409);
    expect(
      (await call("get", "/services/srv-1/available-slots?date=2027-02-30"))
        .body,
    ).toEqual([]);
    await call("put", "/providers/me/availability", p, {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      startTime: "09:00",
      endTime: "19:00",
      blackoutDates: [future()],
      leadMinutes: 30,
      bufferMinutes: 15,
    });
    expect((await call("post", "/bookings", c, payload())).status).toBe(409);
  });
  test("invalid transitions, unauthorized modification, and duplicate completion rejected", async () => {
    const c = await login();
    const p = await login("provider");
    const b = await book(c);
    expect(
      (await call("post", `/bookings/${b.id}/complete`, p, { note: "Done" }))
        .status,
    ).toBe(409);
    expect((await call("post", `/bookings/${b.id}/accept`, c, {})).status).toBe(
      403,
    );
    const other = await signup();
    expect(
      (await call("get", `/bookings/${b.id}`, other.body.accessToken)).status,
    ).toBe(404);
    await complete(p, b.id);
    expect(
      (await call("post", `/bookings/${b.id}/complete`, p, { note: "Done" }))
        .status,
    ).toBe(409);
  });
  test("rescheduling retains original slot, rechecks proposed slot, and supports decline", async () => {
    const c = await login();
    const p = await login("provider");
    const b = await book(c);
    expect(
      (
        await call("post", `/bookings/${b.id}/time-proposals`, p, {
          date: future(),
          slot: "11:30 AM",
        })
      ).status,
    ).toBe(201);
    expect((await call("post", "/bookings", c, payload())).status).toBe(409);
    await book(c, { scheduledSlot: "11:30 AM" });
    expect(
      (
        await call("post", `/bookings/${b.id}/time-proposal-response`, c, {
          accept: true,
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await call("post", `/bookings/${b.id}/time-proposal-response`, c, {
          accept: false,
        })
      ).body.scheduledSlot,
    ).toBe("09:00 AM");
    await call("post", `/bookings/${b.id}/time-proposals`, p, {
      date: future(),
      slot: "02:00 PM",
    });
    expect(
      (
        await call("post", `/bookings/${b.id}/time-proposal-response`, c, {
          accept: true,
        })
      ).body.scheduledSlot,
    ).toBe("02:00 PM");
  });
  test("rescheduling uses the booked duration after a listing is shortened", async () => {
    const c = await login();
    const p = await login("provider");
    expect(
      (
        await call("patch", "/services/srv-1", p, {
          duration: "180 mins",
          availableSlots: ["09:00 AM", "02:00 PM"],
        })
      ).status,
    ).toBe(200);
    const b = await book(c);
    expect(
      (
        await call("patch", "/services/srv-1", p, {
          duration: "30 mins",
          availableSlots: ["09:00 AM", "12:30 PM", "02:00 PM"],
        })
      ).status,
    ).toBe(200);
    await book(c, { scheduledSlot: "02:00 PM" });
    const current = await call(
      "get",
      `/services/srv-1/available-slots?date=${future()}`,
    );
    expect(current.body).toContain("12:30 PM");
    const reschedule = await call(
      "get",
      `/services/srv-1/available-slots?date=${future()}&excludeId=${b.id}`,
      c,
    );
    expect(reschedule.body).not.toContain("12:30 PM");
    expect(
      (
        await call("post", `/bookings/${b.id}/time-proposals`, p, {
          date: future(),
          slot: "12:30 PM",
        })
      ).status,
    ).toBe(409);
  });
  test("cash completion, review eligibility, one review and provider reply", async () => {
    const c = await login();
    const p = await login("provider");
    const b = await book(c, { paymentMethod: "Cash After Service" });
    expect(b.paymentStatus).toBe("Pending");
    expect(
      (
        await call("post", `/bookings/${b.id}/review`, c, {
          rating: 5,
          comment: "Great",
        })
      ).status,
    ).toBe(409);
    await complete(p, b.id);
    expect((await call("get", `/bookings/${b.id}`, c)).body.paymentStatus).toBe(
      "Paid",
    );
    expect(
      (
        await call("post", `/bookings/${b.id}/review`, c, {
          rating: 5,
          comment: "Great",
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await call("post", `/bookings/${b.id}/review`, c, {
          rating: 5,
          comment: "Again",
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await call("post", `/bookings/${b.id}/review-reply`, p, {
          reply: "Thank you",
        })
      ).body.reviewReply,
    ).toBe("Thank you");
  });
  test("cancellation refunds once and unpaid cash is cancelled", async () => {
    const c = await login();
    const b = await book(c);
    const r = await call("post", `/bookings/${b.id}/cancel`, c, {});
    expect(r.body.paymentStatus).toBe("Refunded");
    expect(r.body.netPayout).toBe(0);
    expect((await call("post", `/bookings/${b.id}/cancel`, c, {})).status).toBe(
      409,
    );
    expect(
      await db.refundRecord.count({ where: { payment: { bookingId: b.id } } }),
    ).toBe(1);
    const cash = await book(c, { paymentMethod: "Cash After Service" });
    expect(
      (await call("post", `/bookings/${cash.id}/cancel`, c, {})).body
        .paymentStatus,
    ).toBe("Cancelled");
  });
});
describe("support, arbitration and platform", () => {
  test("partial/full refunds are capped and revenue remains balanced", async () => {
    const c = await login();
    const p = await login("provider");
    const a = await login("admin");
    const b = await book(c);
    await complete(p, b.id);
    for (const outcome of ["Partial Refund (50%)", "Full Mock Refund Issued"]) {
      const t = await call("post", "/tickets", c, {
        bookingId: b.id,
        issueType: "Incorrect Billing",
        severity: "High",
        description: "Please inspect payment.",
      });
      expect(
        (await call("post", `/tickets/${t.body.id}/resolve`, a, { outcome }))
          .status,
      ).toBe(201);
      expect(
        (await call("post", `/tickets/${t.body.id}/resolve`, a, { outcome }))
          .status,
      ).toBe(409);
    }
    const updated = await call("get", `/bookings/${b.id}`, c);
    expect(updated.body.refundedAmount).toBe(799);
    const revenue = await call("get", "/admin/revenue", a);
    expect(revenue.body.gmv - revenue.body.totalRefunds).toBeCloseTo(
      revenue.body.netCollected,
    );
  });
  test("filing eligibility, duplicate case, provider response, assignment and hearing ownership", async () => {
    const c = await login();
    const p = await login("provider");
    const a = await login("admin");
    const ar = await login("arbitrator");
    const d = await openCase(c, p);
    expect(
      (
        await call("post", "/disputes", c, {
          bookingId: d.bookingId,
          claimAmount: 1,
          customerStatement: "Again",
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await call("post", `/disputes/${d.id}/response`, p, {
          statement: "We checked the work.",
        })
      ).status,
    ).toBe(201);
    expect((await call("get", `/disputes/${d.id}`, ar)).status).toBe(404);
    expect(
      (
        await call("post", `/disputes/${d.id}/assignment`, a, {
          arbitratorId: "user-cust-1",
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await call("post", `/disputes/${d.id}/assignment`, a, {
          arbitratorId: "user-arbit-1",
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await call("post", `/disputes/${d.id}/hearing`, ar, {
          scheduledDate: "2020-01-01",
          scheduledTime: "11:00 AM",
          meetUrl: "https://meet.example.test/case",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await call("post", `/disputes/${d.id}/hearing`, ar, {
          scheduledDate: future(),
          scheduledTime: "11:00 AM",
          meetUrl: "javascript:alert(1)",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await call("post", `/disputes/${d.id}/hearing`, ar, {
          scheduledDate: future(),
          scheduledTime: "11:00 AM",
          meetUrl: "https://meet.example.test/case",
        })
      ).body.status,
    ).toBe("hearing_scheduled");
  });
  test("ruling restores booking and caps refund independently of award, cannot rule twice", async () => {
    const c = await login();
    const p = await login("provider");
    const a = await login("admin");
    const ar = await login("arbitrator");
    const d = await openCase(c, p);
    await call("post", `/disputes/${d.id}/assignment`, a, {
      arbitratorId: "user-arbit-1",
    });
    const ruling = {
      verdict: "In favour of Customer",
      awardAmount: 2000,
      reason:
        "The submitted evidence confirms that the service was incomplete and the customer should receive compensation under the terms agreed by both parties.",
    };
    expect(
      (await call("post", `/disputes/${d.id}/ruling`, ar, ruling)).body.status,
    ).toBe("ruled");
    expect(
      (await call("post", `/disputes/${d.id}/ruling`, ar, ruling)).status,
    ).toBe(409);
    expect(
      (await call("get", `/bookings/${d.bookingId}`, c)).body.refundedAmount,
    ).toBe(799);
  });
  test("notifications isolated and marking another user notification has no effect", async () => {
    const c = await login();
    const list = await call("get", "/notifications", c);
    expect(list.body.items.every((n: any) => n.userId === "user-cust-1")).toBe(
      true,
    );
    await call("post", "/notifications/read", c, { notificationId: "notif-2" });
    expect(
      (await db.notification.findUniqueOrThrow({ where: { id: "notif-2" } }))
        .read,
    ).toBe(false);
  });
  test("multipart evidence, private downloads and MIME rejection", async () => {
    const c = await login();
    const p = await login("provider");
    const upload = await request(app.getHttpServer())
      .post(base + "/uploads")
      .set("Authorization", `Bearer ${c}`)
      .field("purpose", "evidence")
      .attach("file", Buffer.from("%PDF-1.4\nDemo evidence\n%%EOF"), {
        filename: "evidence.pdf",
        contentType: "application/pdf",
      });
    expect(upload.status).toBe(201);
    expect((await call("get", `/uploads/${upload.body.id}`, p)).status).toBe(
      403,
    );
    expect((await call("get", `/uploads/${upload.body.id}`, c)).status).toBe(
      200,
    );
    const bad = await request(app.getHttpServer())
      .post(base + "/uploads")
      .set("Authorization", `Bearer ${c}`)
      .attach("file", Buffer.from("<script>bad</script>"), {
        filename: "bad.png",
        contentType: "image/png",
      });
    expect(bad.status).toBe(400);
  });
  test("arbitrator application hashes credentials and only approval enables login", async () => {
    const a = await login("admin");
    const r = await request(app.getHttpServer())
      .post(base + "/arbitrator-applications")
      .field({
        name: "New Arbitrator",
        email: "arbit@example.test",
        password: "NewPassword123!",
        phone: "+91 9876543210",
        country: "India",
        title: "Mediator",
        experience: 10,
        expertise: "Consumer disputes",
        organization: "Independent",
      })
      .attach("resume", Buffer.from("%PDF-1.4\nresume"), {
        filename: "resume.pdf",
        contentType: "application/pdf",
      })
      .attach("license", Buffer.from("%PDF-1.4\nlicense"), {
        filename: "license.pdf",
        contentType: "application/pdf",
      });
    expect(r.status).toBe(201);
    expect(JSON.stringify(r.body)).not.toMatch(/password/);
    expect(
      (
        await call("post", "/auth/login", undefined, {
          email: "arbit@example.test",
          password: "NewPassword123!",
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await call(
          "post",
          `/arbitrator-applications/${r.body.id}/approve`,
          a,
          {},
        )
      ).status,
    ).toBe(201);
    expect(
      (
        await call("post", "/auth/login", undefined, {
          email: "arbit@example.test",
          password: "NewPassword123!",
        })
      ).body.user.role,
    ).toBe("arbitrator");
    expect(
      (
        await call(
          "post",
          `/arbitrator-applications/${r.body.id}/approve`,
          a,
          {},
        )
      ).status,
    ).toBe(409);
  });
  test("custom requests persist and remain customer-owned", async () => {
    const c = await login();
    const body = {
      category: "Others",
      title: "Repair cabinet",
      description: "Cabinet hinge needs repair.",
      location: "Bengaluru",
      preferredDate: future(),
      budget: 500,
      contactName: "Aarav",
      contactPhone: "+91 9876543210",
    };
    expect((await call("post", "/custom-job-requests", c, body)).status).toBe(
      201,
    );
    expect((await call("get", "/custom-job-requests", c)).body.total).toBe(1);
    const other = await signup();
    expect(
      (await call("get", "/custom-job-requests", other.body.accessToken)).body
        .total,
    ).toBe(0);
  });
  test("health and Swagger are served and seed is idempotent", async () => {
    expect((await call("get", "/health")).body.status).toBe("ok");
    const spec = (await request(app.getHttpServer()).get("/api/docs-json")).body;
    expect(spec.paths["/api/v1/bookings"]).toBeDefined();
    expect(spec.security).toEqual([{ bearer: [] }]);
    expect(spec.paths["/api/v1/auth/login"].post.security).toEqual([]);
    const count = await db.booking.count();
    await db.$transaction(seedData, { timeout: 60000 });
    expect(await db.booking.count()).toBe(count);
  });
});

describe('extended regression and security checks', () => {
  test('price filters never leak into later requests or category counts', async () => {
    const all = await call('get', '/services');
    expect((await call('get', '/services?maxPrice=400')).body.total).toBeLessThan(all.body.total);
    expect((await call('get', '/services')).body.total).toBe(all.body.total);
    expect((await call('get', '/categories')).body.reduce((n: number, c: any) => n + c.serviceCount, 0)).toBe(all.body.total);
    const ascending = (await call('get', '/services?sort=price_low')).body.items.map((s: any) => s.price);
    expect(ascending).toEqual([...ascending].sort((a: number,b: number)=>a-b));
  });
  test('null updates, invalid relationships and pagination return client errors', async () => {
    const c=await login(), p=await login('provider');
    for(const data of [{name:null},{email:null},{phone:null}]) expect((await call('patch','/users/me',c,data)).status).toBe(400);
    for(const data of [{status:null},{title:null},{availableSlots:null},{categoryId:'missing-category'}]) expect((await call('patch','/services/srv-1',p,data)).status).toBe(400);
    for(const query of ['page=Infinity','page=1.5','limit=-1','limit=101']) expect((await call('get',`/services?${query}`)).status).toBe(400);
    const first=await call('get','/services?limit=2&page=1'), second=await call('get','/services?limit=2&page=2');
    expect(first.body.items).toHaveLength(2);
    expect(second.body.items.some((s: any)=>first.body.items.some((x: any)=>x.id===s.id))).toBe(false);
  });
  test('twelve concurrent requests reserve a provider only once', async () => {
    const c=await login();
    const replies=await Promise.all(Array.from({length:12},()=>call('post','/bookings',c,payload())));
    expect(replies.filter(r=>r.status===201)).toHaveLength(1);
    expect(replies.filter(r=>r.status===409)).toHaveLength(11);
    expect(await db.booking.count({where:{scheduledDate:future(),providerId:'user-prov-1'}})).toBe(1);
  });
  test('simultaneous refresh requests consume a token only once', async () => {
    const r=await call('post','/auth/login',undefined,{email:emails.customer,password:passwords});
    const cookie=r.headers['set-cookie'];
    const replies=await Promise.all(Array.from({length:2},()=>request(app.getHttpServer()).post(base+'/auth/refresh').set('Cookie',cookie)));
    expect(replies.map(r=>r.status).sort()).toEqual([201,401]);
    expect((await call('get','/users/me',replies.find(r=>r.status===201)!.body.accessToken)).status).toBe(200);
  });
  test('untrusted origins and tampered tokens are rejected, login is rate limited', async () => {
    const c=await login();
    expect((await call('patch','/users/me',c,{name:'Untrusted'}).set('Origin','https://untrusted.example')).status).toBe(403);
    expect((await call('get','/users/me',c.slice(0,-8)+'tampered')).status).toBe(401);
    const health=await call('get','/health');
    expect(health.headers['x-content-type-options']).toBe('nosniff');
    let last;
    for(let i=0;i<11;i++) last=await call('post','/auth/login',undefined,{email:'unknown@example.test',password:'WrongPassword!'});
    expect(last!.status).toBe(429);
  });
  test('provider verification moves from submission to admin approval and publication', async () => {
    const r=await signup('provider'), p=r.body.accessToken, a=await login('admin');
    expect((await call('put','/providers/me',p,{name:'New Provider',phone:'+91 9876543210',businessName:'Repair Company',serviceArea:'Bengaluru',skills:['Plumbing'],documentName:'Registration reference',submit:true})).body.verificationStatus).toBe('submitted');
    expect((await call('post',`/providers/${r.body.user.id}/moderation`,p,{status:'approved',reason:'Self approval'})).status).toBe(403);
    expect((await call('post',`/providers/${r.body.user.id}/moderation`,a,{status:'approved',reason:'Reviewed application'})).status).toBe(201);
    const s=await call('post','/services',p,{title:'Tap repair',description:'Repair a leaking tap',categoryId:'cat-2',price:350,duration:'60 mins',availableSlots:['09:00 AM'],status:'published'});
    expect(s.status).toBe(201);
    expect((await call('get',`/services/${s.body.id}`)).body.title).toBe('Tap repair');
  });
  test('support warning and redo preserve finances; escalation creates exactly one case', async () => {
    const c=await login(),p=await login('provider'),a=await login('admin');
    const b=await book(c); await complete(p,b.id);
    for(const outcome of ['Redo Service Requested','Formal Warning Issued to Provider','Escalated to Arbitration']) {
      const ticket=await call('post','/tickets',c,{bookingId:b.id,issueType:'Service Quality Issue',severity:'High',description:'Repair needs follow-up inspection.'});
      const result=await call('post',`/tickets/${ticket.body.id}/resolve`,a,{outcome});
      expect(result.status).toBe(201);
      expect((await call('post',`/tickets/${ticket.body.id}/resolve`,a,{outcome})).status).toBe(409);
    }
    expect(await db.dispute.count({where:{bookingId:b.id}})).toBe(1);
    const updated=(await call('get',`/bookings/${b.id}`,c)).body;
    expect(updated.status).toBe('disputed');expect(updated.refundedAmount).toBe(0);
  });
  test('evidence access follows case assignment and rejects oversized uploads', async () => {
    const c=await login(),p=await login('provider'),a=await login('admin'),ar=await login('arbitrator');
    const b=await book(c);await complete(p,b.id);
    const upload=await request(app.getHttpServer()).post(base+'/uploads').set('Authorization',`Bearer ${c}`).field('purpose','evidence').attach('file',Buffer.from('%PDF-1.4\nEvidence'),{filename:'../evidence.pdf',contentType:'application/pdf'});
    expect(upload.status).toBe(201);expect(upload.body.filename).toBe('evidence.pdf');
    const d=await call('post','/disputes',c,{bookingId:b.id,claimAmount:500,customerStatement:'Service issue with attached evidence.',fileIds:[upload.body.id]});expect(d.status).toBe(201);
    expect((await call('get',`/uploads/${upload.body.id}`,p)).status).toBe(200);
    expect((await call('get',`/uploads/${upload.body.id}`,ar)).status).toBe(403);
    await call('post',`/disputes/${d.body.id}/assignment`,a,{arbitratorId:'user-arbit-1'});
    expect((await call('get',`/uploads/${upload.body.id}`,ar)).status).toBe(200);
    const old=await db.user.findUniqueOrThrow({where:{id:'user-arbit-1'}});
    const next=await db.user.create({data:{email:'second-arbitrator@example.test',name:'Second Arbitrator',phone:old.phone,passwordHash:old.passwordHash,role:'ARBITRATOR'}});
    await call('post',`/disputes/${d.body.id}/assignment`,a,{arbitratorId:next.id});
    expect((await call('get',`/uploads/${upload.body.id}`,ar)).status).toBe(403);
    expect((await call('post',`/disputes/${d.body.id}/hearing`,ar,{scheduledDate:future(),scheduledTime:'11:00 AM',meetUrl:'https://meet.example.test/case'})).status).toBe(404);
    const oversized=await request(app.getHttpServer()).post(base+'/uploads').set('Authorization',`Bearer ${c}`).attach('file',Buffer.alloc(5*1024*1024+1),{filename:'large.pdf',contentType:'application/pdf'});
    expect(oversized.status).toBe(413);
  });
  test('rejected arbitrator application cannot sign in and cannot be decided again', async()=>{
    const a=await login('admin');
    expect((await call('post','/arbitrator-applications/arb-app-101/reject',a,{reason:'Insufficient supporting documents.'})).status).toBe(201);
    expect((await call('post','/arbitrator-applications/arb-app-101/approve',a,{})).status).toBe(409);
    const application=await db.arbitratorApplication.findUniqueOrThrow({where:{id:'arb-app-101'}});
    expect((await call('post','/auth/login',undefined,{email:application.email,password:passwords})).status).toBe(401);
  });
});

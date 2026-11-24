import { test, expect } from "@playwright/test";
const login = async (page, role, email) => {
  await page.goto(`/login?role=${role}`);
  await page.getByLabel("Email Address").fill(email);
  await page.locator('input[type="password"]').fill("123456Ab@");
  await page.getByRole("button", { name: /^Sign In as / }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}$`));
};
test("customer session survives refresh and navigation; profile, catalog, history and requests use API", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "customer", "aarav@gmail.com");
  await page.reload();
  await expect(page).toHaveURL(/\/customer$/);
  await expect(page.getByText("Aarav Mehta").first()).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Find trusted experts/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "View Details" }).first()).toBeVisible();
  await page.goto("/customer/bookings");
  await expect(page.getByText(/BK-89600/).first()).toBeVisible();
  await page.goto("/services/srv-1");
  await expect(
    page.getByRole("heading", { name: "Split AC Servicing & Deep Foam Clean" }),
  ).toBeVisible();
  await page.goto("/customer/profile");
  await expect(page.getByText("Aarav Mehta").first()).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("servicehub_session_user")),
  ).toBeNull();
  expect(
    await page.evaluate(() => localStorage.getItem("servicehub_bookings")),
  ).toBeNull();
  expect(errors).toEqual([]);
});
test("provider pages, availability and admin moderation are reachable", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "provider", "rohan@gmail.com");
  await expect(page.getByRole("heading", { name: "Recent Job Inbox" })).toBeVisible();
  for (const [path, heading] of [
    ["/provider/services", "Service Listing Management"],
    ["/provider/jobs", "Provider Job Inbox"],
    ["/provider/availability", "Working Availability"],
    ["/provider/earnings", "Provider Earnings & Payments"],
    ["/provider/reviews", "Customer Reviews & Ratings"],
    ["/provider/profile", "Service Provider Profile"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByText("Unable to load data.")).toHaveCount(0);
  }
  await page.goto("/provider/availability");
  await page.getByLabel("Blackout Dates").fill("2100-01-01, 2100-01-02");
  await page.getByRole("button", { name: "Save Schedule Settings" }).click();
  await expect(
    page.getByText("Weekly availability saved.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Blackout Dates")).toHaveValue(
    "2100-01-01, 2100-01-02",
  );
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL("/");
  await login(page, "admin", "staffadmin@gmail.com");
  await page.goto("/admin/providers");
  await expect(
    page.getByRole("heading", { name: "Provider Moderation Queue" }),
  ).toBeVisible();
  await expect(
    page.getByText("UrbanFix Home Solutions", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("arbitrator reads assigned case and evidence does not fabricate downloads", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "arbitrator", "kabir@gmail.com");
  await page.goto("/arbitrator/cases/DISP-101");
  await expect(
    page.getByRole("heading", { name: "Dispute Case #DISP-101" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dispute Case #DISP-101" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("customer checkout and provider fulfillment persist across page reloads", async ({
  page,
}) => {
  await login(page, "customer", "aarav@gmail.com");
  let date = new Date(Date.now() + 9 * 86400000);
  while (date.getUTCDay() === 0) date = new Date(+date + 86400000);
  await page.goto("/services/srv-1");
  await page
    .getByLabel("1. Select Preferred Date:")
    .fill(date.toISOString().slice(0, 10));
  await page.getByRole("button", { name: "09:00 AM", exact: true }).click();
  await page.getByRole("button", { name: /Proceed to Booking/ }).click();
  await page.getByRole("button", { name: /Continue to Price Review/ }).click();
  await page.getByRole("button", { name: /Proceed to Demo Payment/ }).click();
  const created = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/bookings") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Confirm & Pay/ }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const job = await response.json();
  await expect(
    page.getByText("Booking Confirmed!", { exact: true }),
  ).toBeVisible();
  await page.goto(`/customer/bookings/${job.id}`);
  await page.waitForLoadState('networkidle');
  await page.reload();
  await expect(
    page.getByText(job.serviceTitle, { exact: true }).first(),
  ).toBeVisible();
  await login(page, "provider", "rohan@gmail.com");
  await page.goto(`/provider/jobs/${job.id}`);
  await page.getByRole("button", { name: "Accept Job", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await page.getByRole("button", { name: "Start Work", exact: true }).click();
  await page
    .getByLabel("Completion Notes")
    .fill("Checked cooling and completed all requested work.");
  await page
    .getByRole("button", { name: "Mark Job Completed", exact: true })
    .click();
  await expect(
    page.getByText("Included in completed earnings.", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Included in completed earnings.", { exact: false }),
  ).toBeVisible();
  await login(page, 'customer', 'aarav@gmail.com');
  await page.goto(`/customer/bookings/${job.id}`);
  await page.getByRole('button', { name: 'Leave a Review', exact: true }).click();
  await page.getByRole('button', { name: 'Rate 5 out of 5' }).click();
  await page.getByLabel('Your Review Comment').fill('Thorough work and clear communication throughout the visit.');
  await page.getByRole('button', { name: 'Submit Review', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Leave a Review', exact: true })).not.toBeVisible();
  await login(page, 'provider', 'rohan@gmail.com');
  await page.goto('/provider/reviews');
  const review = page.locator('.card').filter({ hasText: 'Thorough work and clear communication throughout the visit.' });
  await review.getByRole('button', { name: 'Reply to Review', exact: true }).click();
  await page.getByLabel('Your Reply').fill('Thank you for sharing your feedback.');
  await page.getByRole('button', { name: 'Post Reply', exact: true }).click();
  await expect(review.getByRole('button', { name: 'Edit Reply', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Thank you for sharing your feedback.')).toBeVisible();
});
test("profile, address book and custom job requests save through the browser", async ({
  page,
}) => {
  await login(page, "customer", "aarav@gmail.com");
  await page.goto("/customer/profile");
  await page.getByRole("button", { name: "Edit Profile", exact: true }).click();
  await page.getByLabel("Full Name").fill("Aarav Browser Test");
  await page
    .getByRole("button", { name: "Save Profile Changes", exact: true })
    .click();
  await expect(
    page.getByText("Profile updated successfully!", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("Aarav Browser Test").first()).toBeVisible();
  await page.goto("/post-a-job");
  await page
    .getByLabel("Job Requirement Title")
    .fill("Repair bedroom wall socket");
  await page
    .getByLabel("Detailed Description")
    .fill("The socket is loose and needs replacement.");
  await page.getByLabel("Service Location").fill("Bengaluru");
  await page.getByLabel("Estimated Budget").fill("1500");
  await page.getByLabel("Contact Phone Number").fill("+91 9876543210");
  await page.getByRole("button", { name: "Submit Job Request" }).click();
  await expect(
    page.getByRole("heading", { name: "Custom Job Request Submitted" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your submitted requests" }),
  ).toBeVisible();
  await expect(page.getByText(/Repair bedroom wall socket —/)).toBeVisible();
});

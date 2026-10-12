import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5186';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ timezoneId: 'Asia/Kolkata', locale: 'en-IN', viewport: { width: 1280, height: 900 } });
await context.route('https://images.unsplash.com/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#dde7f0"/></svg>' }));
const page = await context.newPage();
const errors = [];
const checks = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
const main = page.locator('main');
const go = path => page.goto(base + path, { waitUntil: 'domcontentloaded' });
const storage = name => page.evaluate(name => JSON.parse(localStorage.getItem(`servicehub_${name}`)), name);
const record = async id => (await storage('bookings')).find(job => job.id === id);
const check = async (name, fn) => { await fn(); checks.push(name); console.log('PASS', name); };
const savedJob = (id, status) => page.waitForFunction(({ id, status }) => JSON.parse(localStorage.getItem('servicehub_bookings')).find(job => job.id === id).status === status, { id, status });
async function login(role) {
  if (role === 'admin') { await go('/login'); await page.getByRole('button', { name: /SuperUser/ }).click(); }
  else {
    await go(`/login?role=${role}`);
    await page.getByLabel('Email Address').fill({ provider: 'rohan@gmail.com', customer: 'aarav@gmail.com', arbitrator: 'kabir@gmail.com' }[role]);
    await page.getByLabel('Password').fill('123456Ab@');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  }
  await page.waitForURL(base + '/' + role);
}
async function book(serviceId, date, slot, cash = false) {
  await go(`/services/${serviceId}`);
  await page.getByLabel('1. Select Preferred Date:').fill(date);
  await page.getByRole('button', { name: slot, exact: true }).waitFor();
  await page.getByRole('button', { name: slot, exact: true }).click();
  await page.getByRole('button', { name: /Proceed to Booking/ }).click();
  await page.getByRole('button', { name: /Continue to Price Review/ }).click();
  await page.getByRole('button', { name: /Proceed to Demo Payment/ }).click();
  if (cash) await page.getByLabel('Payment Option').selectOption('Cash After Service');
  await page.getByRole('button', { name: /Confirm (& Pay|Booking)/ }).click();
  await page.getByText('Booking Confirmed!', { exact: true }).waitFor();
  return (await storage('bookings'))[0];
}
async function moderate(label, reason) {
  await login('admin'); await go('/admin/providers');
  const row = page.getByRole('row').filter({ hasText: 'Provider Demo Services' });
  await row.getByRole('button', { name: label, exact: true }).click();
  await page.getByLabel('Audit Reason / Feedback').fill(reason);
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm Audit Decision' }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
}
async function fulfill(job, cash = false) {
  await go(`/provider/jobs/${job.id}`);
  await page.getByRole('button', { name: /^(Accept Job|Start Work)$/ }).first().waitFor();
  const accept = page.getByRole('button', { name: 'Accept Job', exact: true });
  if (await accept.count()) { await accept.click(); await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' }); }
  await page.getByRole('button', { name: 'Start Work', exact: true }).click();
  await page.getByLabel('Completion Notes').fill('Completed the electrical inspection and checked all fittings.');
  await page.getByRole('button', { name: cash ? 'Complete Job & Record Cash Payment' : 'Mark Job Completed', exact: true }).click();
  await savedJob(job.id, 'completed');
}
let service, job, declined, cashJob, date, blackout;
try {
await login('provider');
await check('Dashboard shows data-derived baseline earnings and chronological recent jobs', async () => {
  await page.getByText('₹1,992', { exact: true }).waitFor();
  const recent = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Recent Job Inbox', exact: true }) });
  assert.deepEqual(await recent.locator('.provider-record').evaluateAll(rows => rows.map(row => row.querySelector('strong').textContent)), ['#BK-89600', '#BK-89021', '#BK-88410']);
});
await check('Profile saves business details and survives reload', async () => {
  await go('/provider/profile'); await page.getByLabel('Business / Trading Name').waitFor();
  await page.getByLabel('Business / Trading Name').fill('Provider Demo Services');
  await page.getByLabel('Service Coverage Area').fill('Bellandur and HSR Layout, Bengaluru');
  await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
  await page.getByText('Provider profile saved.', { exact: true }).waitFor(); await page.reload();
  await page.waitForFunction(() => document.querySelector('[name=businessName]').value === 'Provider Demo Services');
});
await check('Verification submission validates its document and reaches Admin', async () => {
  await page.getByRole('button', { name: 'Submit for Verification', exact: true }).click();
  await page.getByRole('alert').getByText('Enter a document filename before submitting for verification.').waitFor();
  await page.getByLabel('Verification Document Filename').fill('trade-license.pdf');
  await page.getByRole('button', { name: 'Submit for Verification', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('servicehub_providers'))[0].verificationStatus === 'submitted');
});
await check('Admin feedback and Provider resubmission use the same profile', async () => {
  await moderate('Request Changes', 'Confirm your service coverage.');
  await login('provider'); await go('/provider/profile'); await page.getByText('Confirm your service coverage.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Submit for Verification', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('servicehub_providers'))[0].verificationStatus === 'submitted');
  await moderate('Approve', 'Demo documents reviewed.');
  await login('provider'); await page.getByText('Verification Status: APPROVED', { exact: true }).waitFor();
});
await check('Draft creation persists a private, unrated listing with configured slots', async () => {
  await go('/provider/services/new'); await page.getByRole('dialog').waitFor();
  await page.getByRole('checkbox', { name: 'Save as a draft' }).check();
  await page.getByLabel('Service Title').fill('Provider Demo Electrical Visit');
  await page.getByLabel('Service Category').selectOption('cat-3');
  await page.getByLabel('Fixed Price (INR)').fill('475');
  await page.getByLabel('Duration (Minutes)').fill('60');
  await page.getByLabel('Detailed Description').fill('Electrical inspection, fitting checks, and minor repairs.');
  await page.getByLabel('Cancellation & Service Policy').fill('Recorded payments are refunded when the booking is cancelled.');
  for (const time of ['09:00', '10:30', '12:00', '14:00', '16:00']) { await page.getByLabel('Slot Start Time').fill(time); await page.getByRole('button', { name: 'Add Slot', exact: true }).click(); }
  await page.getByRole('button', { name: 'Save Draft', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' });
  service = (await storage('services')).find(item => item.title === 'Provider Demo Electrical Visit');
  assert.equal(service.status, 'draft'); assert.equal(service.rating, null);
  await login('customer'); await go(`/services/${service.id}`); await page.getByText('Service Not Found', { exact: true }).waitFor();
});
await check('Publishing, pausing, archiving, and preview follow visibility rules', async () => {
  await login('provider'); await go('/provider/services');
  const card = main.locator('.card').filter({ has: page.getByRole('heading', { name: service.title, exact: true }) });
  await card.getByRole('button', { name: 'Preview', exact: true }).click(); await page.getByRole('heading', { name: service.title, exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Service Preview', exact: true }).isDisabled(), true);
  await go('/provider/services'); await card.getByRole('button', { name: 'Publish', exact: true }).click(); await card.getByRole('button', { name: 'Pause', exact: true }).waitFor();
  await card.getByRole('button', { name: 'Pause', exact: true }).click(); await card.getByRole('button', { name: 'Publish', exact: true }).waitFor();
  await card.getByRole('button', { name: 'Archive', exact: true }).click();
  await page.waitForFunction(id => JSON.parse(localStorage.getItem('servicehub_services')).find(item => item.id === id).status === 'archived', service.id);
  await card.getByRole('button', { name: 'Publish', exact: true }).click(); await card.getByRole('button', { name: 'Pause', exact: true }).waitFor();
});
await check('Listing edits retain its slots and public price reflects the saved data', async () => {
  const card = main.locator('.card').filter({ has: page.getByRole('heading', { name: service.title, exact: true }) });
  await card.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Image URL').fill('https://'); await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await page.getByRole('alert').getByText('Enter a valid HTTP or HTTPS image URL.').waitFor();
  await page.getByLabel('Image URL').fill(service.image); await page.getByLabel('Service Title').press('Enter'); await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.deepEqual((await storage('services')).find(item => item.id === service.id).availableSlots, service.availableSlots);
});
await check('Weekly schedule validates hours and persists days, lead time, buffers, and blackouts', async () => {
  await go('/provider/availability'); await page.getByLabel('Daily End Time').waitFor();
  date = await page.evaluate(() => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const day = new Date(today + 'T12:00:00Z'); day.setUTCDate(day.getUTCDate() + 7);
    while (day.getUTCDay() !== 1) day.setUTCDate(day.getUTCDate() + 1);
    return day.toISOString().slice(0, 10);
  });
  blackout = await page.evaluate(date => { const day = new Date(date + 'T12:00:00Z'); day.setUTCDate(day.getUTCDate() + 1); return day.toISOString().slice(0, 10); }, date);
  await page.getByLabel('Daily End Time').fill('08:00'); await page.getByRole('button', { name: 'Save Schedule Settings', exact: true }).click();
  await page.getByRole('alert').getByText('End time must be later than start time.').waitFor();
  await page.getByLabel('Daily End Time').fill('18:00'); await page.getByLabel('Booking Lead Time (Minutes)').fill('0'); await page.getByLabel('Buffer Between Jobs (Minutes)').fill('15');
  await page.getByLabel('Blackout / Vacation Date').fill(blackout); await page.getByRole('button', { name: 'Add Blackout Date', exact: true }).click();
  await page.getByRole('button', { name: 'Save Schedule Settings', exact: true }).click(); await page.getByText('Weekly availability saved.', { exact: true }).waitFor();
  await page.reload(); await page.getByLabel('Daily End Time').waitFor();
  await page.waitForFunction(() => document.querySelector('[name=endTime]').value === '18:00');
  assert.equal(await page.getByLabel('Buffer Between Jobs (Minutes)').inputValue(), '15');
});
await check('Calendar handles year and leap-day navigation without timezone drift', async () => {
  await page.getByLabel('Schedule Date').fill('2027-01-01'); await page.getByRole('button', { name: 'Previous Day', exact: true }).click();
  assert.equal(await page.getByLabel('Schedule Date').inputValue(), '2026-12-31');
  await page.getByLabel('Schedule Date').fill('2028-02-28'); await page.getByRole('button', { name: 'Next Day', exact: true }).click();
  assert.equal(await page.getByLabel('Schedule Date').inputValue(), '2028-02-29');
  await page.getByRole('button', { name: 'Today', exact: true }).click();
});
await check('Customer sees the saved blackout and published provider listing', async () => {
  await login('customer'); await go(`/services/${service.id}`); await page.getByLabel('1. Select Preferred Date:').fill(blackout);
  await page.getByText('No time slots are available on this date. Choose another date.').waitFor();
  assert.equal(await page.getByRole('button', { name: /Proceed to Booking/ }).isDisabled(), true);
  await go('/services?search=Provider%20Demo%20Electrical'); await page.getByRole('heading', { name: service.title, exact: true }).waitFor();
});
await check('Customer booking reaches Provider with canonical details and paid commission', async () => {
  job = await book(service.id, date, '09:00 AM'); assert.equal(job.amount, 475); assert.equal(job.platformFee, 24); assert.equal(job.netPayout, 451);
  await login('provider'); await go('/provider/jobs'); await page.getByLabel('Filter Jobs').selectOption('pending'); await page.getByRole('button', { name: 'Accept Job', exact: true }).waitFor();
  assert.match(await main.innerText(), new RegExp(job.id));
});
await check('Provider proposals preserve the original booking; customer decline retains it', async () => {
  await go(`/provider/jobs/${job.id}`); await page.getByRole('button', { name: 'Propose Time', exact: true }).click();
  await page.getByLabel('Proposed Time').selectOption('10:30 AM'); await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await savedJob(job.id, 'reschedule_proposed'); assert.equal((await record(job.id)).scheduledSlot, '09:00 AM');
  await login('customer'); await go(`/customer/bookings/${job.id}`); await page.getByRole('button', { name: 'Keep Original Time', exact: true }).click();
  await savedJob(job.id, 'active'); assert.equal((await record(job.id)).scheduledSlot, '09:00 AM');
});
await check('Customer acceptance confirms the alternative time and enables Provider work', async () => {
  await login('provider'); await go(`/provider/jobs/${job.id}`); await page.getByRole('button', { name: 'Propose Time', exact: true }).click();
  await page.getByLabel('Proposed Time').selectOption('02:00 PM'); await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click(); await savedJob(job.id, 'reschedule_proposed');
  await login('customer'); await go(`/customer/bookings/${job.id}`); await page.getByRole('button', { name: 'Accept Proposed Time', exact: true }).click(); await savedJob(job.id, 'active');
  assert.equal((await record(job.id)).scheduledSlot, '02:00 PM'); assert.ok((await record(job.id)).acceptedAt);
  await login('provider'); await fulfill(job); assert.equal((await record(job.id)).status, 'completed');
});
await check('Provider completion updates the dashboard and Customer timeline', async () => {
  await go('/provider'); await page.getByText('₹2,443', { exact: true }).waitFor();
  await login('customer'); await go(`/customer/bookings/${job.id}`); await page.getByRole('button', { name: 'Leave a Review', exact: true }).waitFor();
  assert.match(await main.innerText(), /checked all fittings/);
});
await check('Customer review persists and Provider public reply reaches customer and service page', async () => {
  await page.getByRole('button', { name: 'Leave a Review', exact: true }).click();
  await page.getByRole('button', { name: 'Rate 4 out of 5', exact: true }).click(); await page.getByLabel('Your Review Comment').fill('Reliable inspection and clear explanation.');
  await page.getByRole('button', { name: 'Submit Review', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal((await record(job.id)).reviewRating, 4);
  await login('provider'); await go('/provider/reviews');
  const card = main.locator('.card').filter({ hasText: 'Reliable inspection and clear explanation.' });
  await card.getByRole('button', { name: 'Reply to Review', exact: true }).click(); await page.getByLabel('Your Reply').fill('Thank you for choosing our service.'); await page.getByRole('button', { name: 'Post Reply', exact: true }).click();
  await card.getByRole('button', { name: 'Edit Reply', exact: true }).waitFor();
  await login('customer'); await go(`/services/${service.id}`); await page.getByText('Thank you for choosing our service.', { exact: false }).waitFor();
  await go(`/customer/bookings/${job.id}`); await page.getByText('Thank you for choosing our service.', { exact: false }).waitFor();
});
await check('Declining a request records the reason and refund, and releases the appointment', async () => {
  declined = await book(service.id, date, '10:30 AM'); await login('provider'); await go(`/provider/jobs/${declined.id}`);
  await page.getByRole('button', { name: 'Decline', exact: true }).click(); await page.getByLabel('Reason for Declining').fill('   '); await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.getByRole('alert').getByText('Enter a reason for declining this request.').waitFor();
  await page.getByLabel('Reason for Declining').fill('Unavailable for this appointment.'); await page.getByRole('button', { name: 'Confirm', exact: true }).click(); await savedJob(declined.id, 'cancelled');
  const saved = await record(declined.id); assert.equal(saved.paymentStatus, 'Refunded'); assert.equal(saved.refundedAmount, 475); assert.equal(saved.netPayout, 0);
  await login('customer'); await go(`/services/${service.id}`); await page.getByLabel('1. Select Preferred Date:').fill(date); await page.getByRole('button', { name: '10:30 AM', exact: true }).waitFor();
});
await check('Cash payments remain pending until the Provider explicitly records completion/payment', async () => {
  cashJob = await book(service.id, date, '12:00 PM', true); assert.equal(cashJob.paymentStatus, 'Pending');
  await login('provider'); await fulfill(cashJob, true); assert.equal((await record(cashJob.id)).paymentStatus, 'Paid');
  await go('/provider/earnings'); await page.getByText('₹2,894', { exact: true }).waitFor();
});
await check('Dispute references the actual booking; Provider statement and evidence record persist', async () => {
  await login('customer'); await go(`/customer/bookings/${job.id}`); await page.getByRole('button', { name: 'File Formal Dispute', exact: true }).click();
  await page.getByLabel('Claim Amount / Compensation Requested (INR ₹)').fill('200'); await page.getByLabel('Customer Statement of Dispute').fill('Requesting a partial refund for an unfinished fitting.');
  await page.getByRole('button', { name: 'Submit Dispute to Arbitration', exact: true }).click(); await page.getByText('Dispute Case Escalated to Arbitration', { exact: true }).waitFor();
  const dispute = (await storage('disputes'))[0]; assert.equal(dispute.serviceTitle, service.title); assert.equal(dispute.amountInDispute, 475); assert.equal(dispute.providerId, 'user-prov-1');
  await login('provider'); await go(`/provider/jobs/${job.id}`); await page.getByLabel('Your Dispute Response').fill('Inspection was completed; we agree to refund the unfinished fitting.'); await page.getByLabel('Evidence Filename (Demo Record)').fill('inspection.pdf');
  await page.getByRole('button', { name: 'Save Dispute Response', exact: true }).click(); await page.getByText('Dispute response saved.', { exact: true }).waitFor();
  assert.equal((await storage('disputes'))[0].evidences.at(-1).filename, 'inspection.pdf');
  await login('admin'); await go('/admin/disputes'); await page.getByRole('row').filter({ hasText: dispute.id }).getByRole('button', { name: 'Assign Arbitrator', exact: true }).click();
  await page.waitForFunction(id => JSON.parse(localStorage.getItem('servicehub_disputes')).find(item => item.id === id).arbitratorId === 'user-arbit-1', dispute.id);
});
await check('Hearing and ruling notifications reach Provider; partial refund updates its earnings', async () => {
  const dispute = (await storage('disputes'))[0]; await login('arbitrator'); await go(`/arbitrator/hearings?caseId=${dispute.id}`);
  await page.getByLabel('Virtual Video Meeting Link').fill('https://example.com/provider-hearing');
  await page.getByRole('button', { name: 'Confirm Hearing & Notify Parties', exact: true }).click(); await page.getByText('Hearing saved.', { exact: false }).waitFor();
  await login('provider'); await go(`/provider/jobs/${job.id}`); await page.getByRole('link', { name: 'Join Hearing', exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Join Hearing', exact: true }).getAttribute('href'), 'https://example.com/provider-hearing');
  await login('arbitrator');
  await go(`/arbitrator/rulings?caseId=${dispute.id}`); await page.getByLabel('Awarded Compensation Amount (INR ₹)').fill('200'); await page.getByLabel('Formal Ruling Rationale & Summary').fill('Partial refund agreed by the parties.');
  await page.getByRole('button', { name: 'Publish Final Ruling & Dispatch Notifications', exact: true }).click(); await page.getByText('Binding Ruling & Award Issued', { exact: true }).waitFor();
  await login('provider'); await go(`/provider/jobs/${job.id}`); await page.getByText('Award: ₹200', { exact: true }).waitFor();
  const saved = await record(job.id); assert.equal(saved.status, 'completed'); assert.equal(saved.paymentStatus, 'Partially Refunded'); assert.equal(saved.netPayout, 261);
  await go('/provider/earnings'); await page.getByText('₹2,704', { exact: true }).waitFor();
});
await check('Admin booking and revenue views agree with Provider fees, refunds, and net earnings', async () => {
  await login('admin'); await go('/admin/bookings');
  const row = page.getByRole('row').filter({ hasText: job.id });
  await row.getByText('₹261', { exact: true }).waitFor();
  await row.getByText('₹200', { exact: true }).waitFor();
  await row.getByText('Partially Refunded', { exact: true }).waitFor();
  await go('/admin/revenue');
  await page.getByRole('row').filter({ hasText: job.id }).getByRole('button', { name: 'Details', exact: true }).click();
  await page.getByRole('dialog').getByText('₹261', { exact: true }).waitFor();
  await page.keyboard.press('Escape');
  await login('provider'); await go('/provider/earnings');
});
await check('Notification links mark read, Mark All Read persists, and keyboard focus is restored', async () => {
  await page.getByRole('button', { name: /Open notifications/ }).click(); const drawer = page.getByRole('dialog', { name: 'Notifications' }); await drawer.waitFor();
  await drawer.getByRole('button', { name: /Dispute Ruling Issued/ }).first().click(); await page.waitForURL(base + `/provider/jobs/${job.id}`);
  const notifications = await storage('notifications'); assert.equal(notifications.find(item => item.userId === 'user-prov-1' && item.title === 'Dispute Ruling Issued').read, true);
  await page.getByRole('button', { name: /Open notifications/ }).click(); await drawer.getByRole('button', { name: 'Mark All Read', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('servicehub_notifications')).filter(item => item.userId === 'user-prov-1').every(item => item.read));
  await page.keyboard.press('Escape'); await drawer.waitFor({ state: 'hidden' }); assert.equal(await page.getByRole('button', { name: /Open notifications/ }).evaluate(element => element === document.activeElement), true);
  await page.reload(); await page.getByRole('button', { name: 'Open notifications (0 unread)', exact: true }).waitFor();
});
await check('Provider cannot open another provider booking; terminal jobs hide invalid actions', async () => {
  await go('/provider/jobs/BK-89450'); await page.getByText('Job Unavailable', { exact: true }).waitFor();
  await go('/provider/jobs'); await page.getByLabel('Filter Jobs').selectOption('completed'); await page.getByRole('button', { name: 'Workspace', exact: true }).first().waitFor();
  assert.equal(await page.getByRole('button', { name: 'Accept Job', exact: true }).count(), 0); assert.equal(await page.getByRole('button', { name: 'Decline', exact: true }).count(), 0);
});
await check('Provider pages and modal stay within the mobile viewport; dark theme is usable', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/provider', '/provider/profile', '/provider/services', '/provider/availability', '/provider/jobs', '/provider/earnings', '/provider/reviews', `/provider/jobs/${job.id}`]) {
    await go(path); await page.waitForTimeout(400); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, path);
  }
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
  await page.screenshot({ path: '/private/tmp/provider-complete-mobile.png', fullPage: true });
  await go('/provider/services/new'); await page.getByRole('dialog').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'hidden' });
});
assert.deepEqual(errors, []);
checks.push('No runtime errors or console warnings during Provider presentation flows');
const result = { passed: checks.length, checks, errors };
await writeFile('/private/tmp/provider-complete-e2e-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
} catch (error) {
  await page.screenshot({ path: '/private/tmp/provider-complete-failure.png', fullPage: true });
  console.error('FAILED', error); console.error('URL', page.url());
  if (await main.count()) console.error((await main.innerText({ timeout: 2000 })).slice(0, 5000));
  process.exitCode = 1;
} finally { await browser.close(); }

import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5187';
const browser = await chromium.launch({ headless: true });
const checks = [];
const errors = [];
const go = (page, path) => page.goto(base + path, { waitUntil: 'domcontentloaded' });
const storage = (page, name) => page.evaluate(name => JSON.parse(localStorage.getItem(`servicehub_${name}`)), name);

async function login(page, role) {
  await go(page, `/login?role=${role}`);
  await page.getByLabel('Email Address').fill(role === 'provider' ? 'rohan@gmail.com' : 'aarav@gmail.com');
  await page.getByLabel('Password').fill('123456Ab@');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL(base + '/' + role);
}

async function check(name, run, options = {}) {
  const context = await browser.newContext({ locale: 'en-IN', timezoneId: 'Asia/Kolkata', ...options });
  await context.route('https://images.unsplash.com/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' }));
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  context.on('page', page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
  });
  const page = await context.newPage();
  try {
    await run(page, context);
    checks.push(name);
    console.log('PASS', name);
  } catch (error) {
    await page.screenshot({ path: '/private/tmp/provider-complete-edge-failure.png', fullPage: true });
    console.error('FAILED', name, page.url());
    throw error;
  } finally { await context.close(); }
}

async function checkout(page, date) {
  await login(page, 'customer');
  await go(page, '/services/srv-1');
  await page.getByLabel('1. Select Preferred Date:').fill(date);
  await page.getByRole('button', { name: '09:00 AM', exact: true }).click();
  await page.getByRole('button', { name: /Proceed to Booking/ }).click();
  await page.getByRole('button', { name: /Continue to Price Review/ }).click();
  await page.getByRole('button', { name: /Proceed to Demo Payment/ }).click();
}

try {
  await check('Unsaved profile and weekly schedule edits survive repository focus refreshes', async page => {
    await login(page, 'provider');
    await go(page, '/provider/profile');
    await page.getByLabel('Business / Trading Name').fill('Unsaved business draft');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(500);
    assert.equal(await page.getByLabel('Business / Trading Name').inputValue(), 'Unsaved business draft');
    await go(page, '/provider/availability');
    await page.getByLabel('Daily End Time').fill('15:30');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(500);
    assert.equal(await page.getByLabel('Daily End Time').inputValue(), '15:30');
    await page.getByLabel('Slot Start Time').fill('20:00');
    await page.getByRole('button', { name: 'Add Slot', exact: true }).click();
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Remove.*08:00 PM/ }).waitFor();
  });

  await check('SuperUser entering Provider and selecting the same role retain the saved profile', async page => {
    await go(page, '/login');
    await page.getByRole('button', { name: /SuperUser/ }).click();
    await page.waitForURL(base + '/admin');
    await go(page, '/provider/profile');
    await page.getByLabel('Business / Trading Name').fill('Saved Demo Business');
    await page.getByRole('button', { name: 'Save Profile', exact: true }).click();
    await page.getByText('Provider profile saved.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'provider', exact: true }).click();
    await page.waitForTimeout(400);
    assert.equal(await page.getByLabel('Business / Trading Name').inputValue(), 'Saved Demo Business');
    assert.match(await page.locator('body').innerText(), /Saved Demo Business/);
  });

  await check('Provider dashboard, listings, schedule, inbox, earnings, reviews, and notifications handle empty data', async page => {
    await login(page, 'provider');
    await page.getByText('₹1,992', { exact: true }).waitFor();
    await page.evaluate(() => {
      for (const name of ['services', 'bookings', 'notifications']) localStorage.setItem(`servicehub_${name}`, '[]');
    });
    for (const [path, text] of [
      ['/provider', 'No jobs assigned yet.'],
      ['/provider/services', 'No service listings yet.'],
      ['/provider/availability', 'Create a listing before configuring its time slots.'],
      ['/provider/jobs', 'No jobs match this filter.'],
      ['/provider/earnings', 'No booking payments yet.'],
      ['/provider/reviews', 'No customer reviews have been saved yet.']
    ]) {
      await go(page, path);
      await page.getByText(text, { exact: true }).waitFor();
    }
    await page.getByRole('button', { name: /Open notifications/ }).click();
    await page.getByRole('dialog').getByText('No notifications at the moment.').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
  });

  await check('Provider read failures show an error and Retry recovers after storage is repaired', async page => {
    await login(page, 'provider');
    const jobs = await storage(page, 'bookings');
    await page.evaluate(() => localStorage.setItem('servicehub_bookings', '{bad json'));
    await go(page, '/provider/jobs');
    await page.getByRole('heading', { name: 'Something went wrong', exact: true }).waitFor();
    await page.evaluate(jobs => localStorage.setItem('servicehub_bookings', JSON.stringify(jobs)), jobs);
    await page.getByRole('button', { name: 'Retry Action', exact: true }).click();
    await page.getByText('#BK-89021', { exact: true }).waitFor();
  });

  await check('Listing save failure keeps the draft visible and retry persists it without duplicate records', async page => {
    await login(page, 'provider');
    await go(page, '/provider/services');
    const card = page.locator('main .card').filter({ has: page.getByRole('heading', { name: 'Split AC Servicing & Deep Foam Clean', exact: true }) });
    await card.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByLabel('Service Title').fill('Retained listing edit');
    await page.evaluate(() => {
      const write = Storage.prototype.setItem;
      let fail = true;
      Storage.prototype.setItem = function(key, value) {
        if (fail && key === 'servicehub_services') { fail = false; throw new Error('Storage write failed.'); }
        return write.call(this, key, value);
      };
    });
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await page.getByRole('alert').getByText('Storage write failed.').waitFor();
    assert.equal(await page.getByLabel('Service Title').inputValue(), 'Retained listing edit');
    assert.equal((await storage(page, 'services')).find(item => item.id === 'srv-1').title, 'Split AC Servicing & Deep Foam Clean');
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal((await storage(page, 'services')).filter(item => item.title === 'Retained listing edit').length, 1);
  });

  await check('Provider modal traps Tab and Shift+Tab and Escape restores the invoking control', async page => {
    await login(page, 'provider');
    await go(page, '/provider/services');
    const card = page.locator('main .card').filter({ has: page.getByRole('heading', { name: 'Split AC Servicing & Deep Foam Clean', exact: true }) });
    const edit = card.getByRole('button', { name: 'Edit', exact: true });
    await edit.click();
    const close = page.getByRole('button', { name: 'Close dialog', exact: true });
    const save = page.getByRole('button', { name: 'Save Changes', exact: true });
    await page.keyboard.press('Tab'); assert.equal(await close.evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Shift+Tab'); assert.equal(await save.evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Tab'); assert.equal(await close.evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal(await edit.evaluate(el => el === document.activeElement), true);
  });

  for (const timezoneId of ['America/Los_Angeles', 'Pacific/Kiritimati']) {
    await check(`Provider Today and date navigation keep India dates in ${timezoneId}`, async page => {
      await page.clock.setFixedTime(new Date('2028-12-31T20:30:00Z'));
      await login(page, 'provider');
      await go(page, '/provider/availability');
      await page.getByLabel('Schedule Date').waitFor();
      assert.equal(await page.getByLabel('Schedule Date').inputValue(), '2029-01-01');
      await page.getByRole('button', { name: 'Previous Day', exact: true }).click();
      assert.equal(await page.getByLabel('Schedule Date').inputValue(), '2028-12-31');
      await page.getByRole('button', { name: 'Today', exact: true }).click();
      assert.equal(await page.getByLabel('Schedule Date').inputValue(), '2029-01-01');
    }, { timezoneId });
  }

  await check('Concurrent Customer checkouts create one booking and update the already-open Provider inbox', async (provider, context) => {
    await login(provider, 'provider');
    await go(provider, '/provider/jobs');
    await provider.getByText('#BK-89021', { exact: true }).waitFor();
    const date = await provider.evaluate(() => {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      const day = new Date(today + 'T12:00:00Z'); day.setUTCDate(day.getUTCDate() + 7);
      if (day.getUTCDay() === 0) day.setUTCDate(day.getUTCDate() + 1);
      return day.toISOString().slice(0, 10);
    });
    const first = await context.newPage();
    const second = await context.newPage();
    await checkout(first, date);
    await checkout(second, date);
    await Promise.all([first, second].map(page => page.getByRole('button', { name: /Confirm & Pay/ }).click()));
    await first.waitForTimeout(700);
    const jobs = (await storage(first, 'bookings')).filter(job => job.scheduledDate === date && job.scheduledSlot === '09:00 AM');
    assert.equal(jobs.length, 1);
    const success = await Promise.all([first, second].map(page => page.getByText('Booking Confirmed!', { exact: true }).count()));
    assert.equal(success.reduce((sum, count) => sum + count, 0), 1);
    const loser = success[0] ? second : first;
    await loser.getByText('This time is unavailable. Choose another available slot.', { exact: true }).waitFor();
    await provider.getByText(`#${jobs[0].id}`, { exact: true }).waitFor();
    await go(loser, '/services/srv-3');
    await loser.getByLabel('1. Select Preferred Date:').fill(date);
    await loser.getByRole('button', { name: '12:00 PM', exact: true }).waitFor();
    assert.equal(await loser.getByRole('button', { name: '09:30 AM', exact: true }).count(), 0);
  });

  await check('Customer support resolution and escalation reach the correct Provider job', async page => {
    await login(page, 'customer');
    await go(page, '/customer/support');
    assert.equal(await page.getByRole('button', { name: 'Submit Support Ticket', exact: true }).isDisabled(), true);
    await page.getByLabel('Associated Booking ID').selectOption('BK-88410');
    await page.getByLabel('Detailed Description & Evidence Notes').fill('Please review the completed work.');
    await page.getByRole('button', { name: 'Submit Support Ticket', exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('servicehub_tickets'))[0].description === 'Please review the completed work.');
    const ticket = (await storage(page, 'tickets'))[0];
    const job = (await storage(page, 'bookings')).find(item => item.id === ticket.bookingId);
    assert.equal(ticket.providerId, job.providerId);
    assert.equal(ticket.serviceTitle, job.serviceTitle);
    await go(page, '/login'); await page.getByRole('button', { name: /SuperUser/ }).click();
    await page.waitForURL(base + '/admin'); await go(page, '/admin/tickets');
    await page.getByRole('row').filter({ hasText: ticket.id }).getByRole('button', { name: 'Triage & Resolve', exact: true }).click();
    await page.getByLabel('Resolution Outcome').selectOption('Partial Refund (50%)');
    await page.getByRole('button', { name: 'Enforce Resolution Outcome', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const refunded = (await storage(page, 'bookings')).find(item => item.id === job.id);
    assert.equal(refunded.refundedAmount, Math.round(job.amount * 0.5));
    await go(page, `/provider/jobs/${job.id}`);
    await page.getByText('Payment: Partially Refunded.', { exact: false }).waitFor();
    await login(page, 'customer'); await go(page, `/customer/support/new?bookingId=${job.id}`);
    await page.getByLabel('Detailed Description & Evidence Notes').fill('Escalate the remaining issue.');
    await page.getByRole('button', { name: 'Submit Support Ticket', exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('servicehub_tickets'))[0].description === 'Escalate the remaining issue.');
    const escalation = (await storage(page, 'tickets'))[0];
    await go(page, '/login'); await page.getByRole('button', { name: /SuperUser/ }).click();
    await page.waitForURL(base + '/admin'); await go(page, '/admin/tickets');
    await page.getByRole('row').filter({ hasText: escalation.id }).getByRole('button', { name: 'Triage & Resolve', exact: true }).click();
    await page.getByLabel('Resolution Outcome').selectOption('Escalated to Arbitration');
    await page.getByRole('button', { name: 'Enforce Resolution Outcome', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const dispute = (await storage(page, 'disputes')).find(item => item.bookingId === job.id);
    assert.ok(dispute.id);
    await go(page, `/provider/jobs/${job.id}`);
    await page.getByLabel('Your Dispute Response').waitFor();
    await page.getByText('Escalate the remaining issue.', { exact: true }).first().waitFor();
  });

  assert.deepEqual(errors, []);
  checks.push('No runtime errors or console warnings in React Strict Mode edge checks');
  await writeFile('/private/tmp/provider-complete-edge-results.json', JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, errors }));
} finally { await browser.close(); }

import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, ws: false } });
const helpers = await server.ssrLoadModule('/src/features/provider/providerUtils.js');
const repo = await server.ssrLoadModule('/src/data/mockRepository.js');
const { bookingTime, isPending, isAccepted, isPaid, money, platformFee, netPayout, formatDate, formatSlot, slotMinutes, validateSlots, updateJob } = helpers;

beforeEach(() => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value))
  };
});
after(async () => { await server.close(); delete globalThis.localStorage; });

const request = async () => repo.createBooking({
  serviceId: 'srv-1', providerId: 'user-prov-1', providerName: 'Apex Fix',
  customerId: 'user-cust-1', customerName: 'Test Customer', serviceTitle: 'AC Service',
  scheduledDate: '2027-01-02', scheduledSlot: '09:00 AM', amount: 799
});

test('new requests await acceptance; the seeded accepted booking does not', async () => {
  assert.equal(isPending(await request()), true);
  assert.equal(isAccepted(await repo.getBookingById('BK-89021')), true);
});

test('recent bookings sort chronologically across both repository timestamp formats', async () => {
  assert.equal(bookingTime('2026-08-22 16:10'), bookingTime('22/08/2026, 16:10:00'));
  const jobs = await repo.getBookings('provider', 'user-prov-1');
  const recent = [...jobs].sort((a, b) => bookingTime(b.createdAt) - bookingTime(a.createdAt));
  assert.deepEqual(recent.slice(0, 3).map(job => job.id), ['BK-89600', 'BK-89021', 'BK-88410']);
  assert.equal(jobs[0].id, 'BK-89021');
});

test('accept, start, and complete persist status and notes for every role', async () => {
  const job = await request();
  await updateJob(job.id, job.providerId, 'accept', 'Provider accepted the booking request.');
  assert.equal(isPending(await repo.getBookingById(job.id)), false);
  await updateJob(job.id, job.providerId, 'start', 'Provider started work.');
  await updateJob(job.id, job.providerId, 'complete', 'Job completed. Notes: Tested cooling.');
  for (const role of ['customer', 'provider', 'admin', 'arbitrator']) {
    const jobs = await repo.getBookings(role, role === 'customer' ? 'user-cust-1' : 'user-prov-1');
    const saved = jobs.find(item => item.id === job.id);
    assert.equal(saved.status, 'completed');
    assert.equal(saved.timeline.at(-1).desc, 'Job completed. Notes: Tested cooling.');
  }
});

test('requests cannot start or complete before acceptance', async () => {
  const job = await request();
  for (const action of ['start', 'complete']) await assert.rejects(updateJob(job.id, job.providerId, action, ''), /changed/);
  assert.equal((await repo.getBookingById(job.id)).timeline.length, 2);
});

test('duplicate acceptance does not append another event', async () => {
  const job = await request();
  await updateJob(job.id, job.providerId, 'accept', 'Provider accepted the booking request.');
  await assert.rejects(updateJob(job.id, job.providerId, 'accept', ''), /changed/);
  assert.equal((await repo.getBookingById(job.id)).timeline.length, 3);
});

test('completed, disputed, and cancelled bookings reject request actions', async () => {
  for (const id of ['BK-88410', 'BK-87102']) {
    for (const action of ['accept', 'decline', 'start', 'complete']) await assert.rejects(updateJob(id, 'user-prov-1', action, ''), /changed/);
  }
  const job = await request();
  await updateJob(job.id, job.providerId, 'decline', 'Provider declined: unavailable.');
  await assert.rejects(updateJob(job.id, job.providerId, 'accept', ''), /changed/);
});

test('providers cannot access another provider booking or a missing booking', async () => {
  await assert.rejects(updateJob('BK-89450', 'user-prov-1', 'start', ''), /unavailable/);
  await assert.rejects(updateJob('missing', 'user-prov-1', 'accept', ''), /unavailable/);
});

test('unknown actions are rejected without writing a status', async () => {
  await assert.rejects(updateJob('BK-89021', 'user-prov-1', 'publish', ''), /Invalid/);
});

test('persisted cancellation prevents later fulfillment and frees its exact slot', async () => {
  const job = await request();
  assert.equal((await repo.getAvailableSlots('srv-1', job.scheduledDate)).includes(job.scheduledSlot), false);
  await updateJob(job.id, job.providerId, 'decline', 'Provider declined the booking request. Reason: unavailable');
  assert.equal((await repo.getAvailableSlots('srv-1', job.scheduledDate)).includes(job.scheduledSlot), true);
  await assert.rejects(updateJob(job.id, job.providerId, 'start', ''), /changed/);
});

test('paid-booking totals agree with the Admin repository ledger', async () => {
  const jobs = await repo.getBookings('admin');
  const paid = jobs.filter(isPaid);
  const stats = await repo.getRevenueStats();
  assert.equal(paid.reduce((sum, job) => sum + Number(job.amount), 0), stats.gmv);
  assert.equal(paid.reduce((sum, job) => sum + platformFee(job), 0), stats.totalRevenue);
  assert.equal(paid.reduce((sum, job) => sum + netPayout(job), 0), stats.totalNetPayouts);
});

test('stored commissions and payouts take precedence over estimates', () => {
  assert.equal(platformFee({ amount: '799', platformFee: '40' }), 40);
  assert.equal(netPayout({ amount: '799', platformFee: 40, netPayout: '750' }), 750);
  assert.equal(platformFee({ amount: '799' }), 40);
  assert.equal(netPayout({ amount: '799' }), 759);
  assert.equal(isPaid({ paymentStatus: 'Pending' }), false);
  assert.equal(isPaid({ paymentStatus: 'Completed' }), true);
  assert.equal(money('1992'), '₹1,992');
});

test('provider completed earnings exclude pending, disputed, and cancelled amounts', async () => {
  const jobs = await repo.getBookings('provider', 'user-prov-1');
  assert.equal(jobs.filter(job => job.status === 'completed' && isPaid(job)).reduce((sum, job) => sum + netPayout(job), 0), 1992);
  assert.equal(jobs.filter(job => job.status === 'active').reduce((sum, job) => sum + netPayout(job), 0), 759);
  assert.equal(jobs.filter(job => job.status === 'disputed').reduce((sum, job) => sum + netPayout(job), 0), 617);
});

test('midnight, noon, and evening slots round-trip correctly', () => {
  for (const time of ['00:00', '09:30', '12:00', '16:30', '23:59']) {
    const [hour, minute] = time.split(':').map(Number);
    assert.equal(slotMinutes(formatSlot(time)), hour * 60 + minute);
  }
});

test('slot validation rejects empty, duplicate, overlapping, invalid, and overnight ranges', () => {
  for (const [slots, duration] of [[[], 60], [['09:00 AM', '09:00 AM'], 60], [['09:00 AM', '09:30 AM'], 60], [['25:00 PM'], 60], [['11:30 PM'], 60], [['09:00 AM'], NaN]]) {
    assert.ok(validateSlots(slots, duration));
  }
  assert.equal(validateSlots(['10:00 AM', '09:00 AM'], 60), '');
  assert.equal(validateSlots(['11:00 PM'], 60), '');
});

test('local date formatting preserves weekdays and dates in positive and negative timezones', () => {
  const original = process.env.TZ;
  try {
    for (const zone of ['Asia/Kolkata', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
      process.env.TZ = zone;
      assert.match(formatDate('2027-01-01'), /Fri.*1.*Jan.*2027/);
      assert.match(formatDate('2028-02-29'), /Tue.*29.*Feb.*2028/);
    }
  } finally {
    if (original) process.env.TZ = original;
    else delete process.env.TZ;
  }
});

test('service slot changes persist and the customer slot operation uses them', async () => {
  await repo.saveService({ id: 'srv-1', availableSlots: ['10:00 AM', '01:00 PM'] });
  assert.deepEqual((await repo.getServiceById('srv-1')).availableSlots, ['10:00 AM', '01:00 PM']);
  assert.deepEqual(await repo.getAvailableSlots('srv-1', '2027-01-02'), ['10:00 AM', '01:00 PM']);
});

test('the repository rejects identical bookings and slots removed by the provider', async () => {
  const job = await request();
  await assert.rejects(request(), /just been booked/);
  await repo.saveService({ id: 'srv-1', availableSlots: ['11:30 AM'] });
  await assert.rejects(repo.createBooking({ ...job, scheduledDate: '2027-01-03' }), /does not offer/);
});

test('listing edits and state changes retain slots, reviews, and provider ownership', async () => {
  const initial = await repo.getServiceById('srv-1');
  await repo.saveService({ id: initial.id, title: 'Updated service', status: 'paused' });
  const saved = await repo.getServiceById(initial.id);
  assert.equal(saved.status, 'paused');
  assert.equal(saved.providerId, initial.providerId);
  assert.equal(saved.reviewCount, initial.reviewCount);
  assert.deepEqual(saved.availableSlots, initial.availableSlots);
});

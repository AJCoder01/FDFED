import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, ws: false } });
const repo = await server.ssrLoadModule('/src/data/mockRepository.js');
const rules = await server.ssrLoadModule('/src/data/scheduling.js');
const helpers = await server.ssrLoadModule('/src/features/provider/providerUtils.js');
const { addDays } = await server.ssrLoadModule('/src/utils/date.js');
const providerId = 'user-prov-1';
const customerId = 'user-cust-1';
const actor = { role: 'provider', userId: providerId };
const tomorrow = offset => addDays(rules.localClock().date, offset);
const workday = () => {
  let date = tomorrow(7);
  while (new Date(`${date}T12:00:00Z`).getUTCDay() === 0) date = addDays(date, 1);
  return date;
};
const request = values => repo.createBooking({ serviceId: 'srv-1', customerId, customerName: 'Test Customer', address: 'Test address', scheduledDate: workday(), scheduledSlot: '09:00 AM', amount: 799, ...values });
const complete = async job => {
  await repo.updateBookingStatus(job.id, 'active', 'Provider accepted the booking request.', actor);
  await repo.updateBookingStatus(job.id, 'in_progress', 'Work started.', actor);
  return repo.updateBookingStatus(job.id, 'completed', 'Cooling checked and job completed.', actor);
};
beforeEach(() => {
  const storage = new Map();
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
});
after(async () => { await server.close(); delete globalThis.localStorage; });

test('profile saves and verification decisions persist in the canonical provider record', async () => {
  const profile = await repo.getProviderById(providerId);
  await repo.saveProvider(providerId, { ...profile, businessName: 'Updated Apex', documentName: 'trade.pdf' }, true);
  assert.equal((await repo.getProviderById(providerId)).verificationStatus, 'submitted');
  assert.equal((await repo.getServices()).some(service => service.providerId === providerId), false);
  await repo.moderateProvider(providerId, 'approved', 'Demo documents reviewed.');
  assert.equal((await repo.getProviders()).find(provider => provider.id === providerId).businessName, 'Updated Apex');
  assert.equal((await repo.getServiceById('srv-1')).providerName, 'Updated Apex');
  assert.ok((await repo.getNotifications(providerId)).some(notification => notification.title === 'Verification Updated'));
});
test('profile and schedule validation reject blank fields and reversed hours', async () => {
  await assert.rejects(repo.saveProvider(providerId, { businessName: ' ', serviceArea: 'Area', skills: ['AC'] }), /business name/);
  await assert.rejects(repo.saveAvailability(providerId, { ...rules.DEFAULT_SCHEDULE, startTime: '18:00', endTime: '09:00' }), /End time/);
  await assert.rejects(repo.saveAvailability(providerId, { ...rules.DEFAULT_SCHEDULE, days: [] }), /working day/);
  await assert.rejects(repo.saveAvailability(providerId, { ...rules.DEFAULT_SCHEDULE, bufferMinutes: -1 }), /between/);
});
test('saved days, hours, and blackout dates constrain customer availability', async () => {
  const date = workday();
  const day = rules.DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
  await repo.saveAvailability(providerId, { ...rules.DEFAULT_SCHEDULE, days: [day], startTime: '11:00', endTime: '16:00', blackoutDates: [] });
  assert.deepEqual(await repo.getAvailableSlots('srv-1', date), ['11:30 AM', '02:00 PM']);
  await repo.saveAvailability(providerId, { ...rules.DEFAULT_SCHEDULE, blackoutDates: [date] });
  assert.deepEqual(await repo.getAvailableSlots('srv-1', date), []);
  await assert.rejects(request(), /unavailable/);
});
test('past dates, invalid dates, Sundays, and times outside working hours are unavailable', async () => {
  assert.deepEqual(await repo.getAvailableSlots('srv-1', tomorrow(-1)), []);
  assert.deepEqual(await repo.getAvailableSlots('srv-1', '2027-02-30'), []);
  let sunday = workday();
  while (new Date(`${sunday}T12:00:00Z`).getUTCDay() !== 0) sunday = addDays(sunday, 1);
  assert.deepEqual(await repo.getAvailableSlots('srv-1', sunday), []);
});
test('same-day lead time is evaluated in the marketplace timezone', () => {
  const provider = { verificationStatus: 'approved', weeklyAvailability: { ...rules.DEFAULT_SCHEDULE, days: rules.DAYS, leadMinutes: 90 } };
  const service = { id: 'test', providerId, status: 'published', duration: '60 mins', availableSlots: ['10:00 AM', '11:30 AM', '02:00 PM'] };
  const now = new Date('2026-10-12T04:30:00Z');
  assert.deepEqual(rules.availableSlots(service, provider, '2026-10-12', [], [service], null, now), ['02:00 PM']);
});
test('overlapping bookings are blocked across every service owned by the provider', async () => {
  await request();
  assert.equal((await repo.getAvailableSlots('srv-3', workday())).includes('09:30 AM'), false);
  await assert.rejects(request({ serviceId: 'srv-3', scheduledSlot: '09:30 AM', amount: 499 }), /unavailable/);
});
test('buffers block otherwise adjacent appointments', async () => {
  await repo.saveService({ id: 'srv-3', availableSlots: ['10:00 AM', '12:00 PM'] });
  await request();
  assert.equal((await repo.getAvailableSlots('srv-3', workday())).includes('10:00 AM'), true);
  await repo.saveAvailability(providerId, { ...rules.DEFAULT_SCHEDULE, bufferMinutes: 15 });
  assert.equal((await repo.getAvailableSlots('srv-3', workday())).includes('10:00 AM'), false);
});
test('concurrent duplicate booking requests create only one booking', async () => {
  const results = await Promise.allSettled([request(), request()]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((await repo.getBookings('provider', providerId)).filter(job => job.scheduledDate === workday()).length, 1);
});
test('booking metadata comes from the service and stale prices cannot be charged', async () => {
  await assert.rejects(request({ amount: 1 }), /price changed/);
  const job = await request({ providerId: 'wrong', providerName: 'wrong', serviceTitle: 'wrong' });
  assert.equal(job.providerId, providerId);
  assert.equal(job.serviceTitle, 'Split AC Servicing & Deep Foam Clean');
  assert.equal(job.providerPhone, '+91 91234 56789');
});
test('acceptance, start, and completion persist across all role readers', async () => {
  const job = await request();
  assert.equal(helpers.isPending(job), true);
  const completed = await complete(job);
  assert.ok(completed.acceptedAt);
  for (const [role, userId] of [['provider', providerId], ['customer', customerId], ['admin'], ['arbitrator']]) {
    assert.equal((await repo.getBookings(role, userId)).find(item => item.id === job.id).status, 'completed');
  }
  await assert.rejects(repo.updateBookingStatus(job.id, 'active', '', actor), /not allowed/);
  await assert.rejects(repo.updateBookingStatus(job.id, 'completed', '', actor), /not allowed/);
});
test('jobs cannot start before acceptance, skip completion, or be changed by another provider', async () => {
  const job = await request();
  await assert.rejects(repo.updateBookingStatus(job.id, 'in_progress', '', actor), /not allowed/);
  await assert.rejects(repo.updateBookingStatus(job.id, 'completed', '', actor), /not allowed/);
  await assert.rejects(repo.updateBookingStatus(job.id, 'active', '', { role: 'provider', userId: 'wrong' }), /account/);
  await repo.updateBookingStatus(job.id, 'active', '', actor);
  await assert.rejects(repo.updateBookingStatus(job.id, 'active', '', actor), /not allowed/);
  await assert.rejects(repo.updateBookingStatus(job.id, 'cancelled', '', actor), /pending/);
});
test('rejection records a full refund, reverses commission, and frees the slot', async () => {
  const job = await request();
  const cancelled = await repo.updateBookingStatus(job.id, 'cancelled', 'Provider declined.', actor);
  assert.equal(cancelled.paymentStatus, 'Refunded');
  assert.equal(cancelled.refundedAmount, 799);
  assert.equal(cancelled.platformFee, 0);
  assert.equal(cancelled.netPayout, 0);
  assert.ok((await repo.getAvailableSlots('srv-1', workday())).includes('09:00 AM'));
  await assert.rejects(repo.updateBookingStatus(job.id, 'completed', 'Revive', actor), /not allowed/);
});
test('cash is pending until completion and cancellation does not invent a refund', async () => {
  const job = await request({ paymentMethod: 'Cash After Service' });
  assert.equal(job.paymentStatus, 'Pending');
  assert.equal((await complete(job)).paymentStatus, 'Paid');
  const unpaid = await request({ scheduledSlot: '11:30 AM', paymentMethod: 'Cash After Service' });
  const cancelled = await repo.updateBookingStatus(unpaid.id, 'cancelled', '', actor);
  assert.equal(cancelled.paymentStatus, 'Cancelled');
  assert.equal(cancelled.refundedAmount, 0);
});
test('proposals keep the original reservation and require explicit customer consent', async () => {
  const job = await request();
  const proposal = await repo.proposeBookingTime(job.id, job.scheduledDate, '11:30 AM', providerId);
  assert.equal(proposal.status, 'reschedule_proposed');
  assert.equal(proposal.scheduledSlot, '09:00 AM');
  assert.equal((await repo.getAvailableSlots('srv-1', job.scheduledDate)).includes('09:00 AM'), false);
  await assert.rejects(repo.updateBookingStatus(job.id, 'in_progress', '', actor), /not allowed/);
  const agreed = await repo.respondToTimeProposal(job.id, true, customerId);
  assert.equal(agreed.scheduledSlot, '11:30 AM');
  assert.ok(agreed.acceptedAt);
  assert.ok((await repo.getAvailableSlots('srv-1', job.scheduledDate)).includes('09:00 AM'));
  await assert.rejects(repo.respondToTimeProposal(job.id, true, customerId), /no longer/);
});
test('declined proposals retain the original schedule and wrong customers cannot respond', async () => {
  const job = await request();
  await repo.proposeBookingTime(job.id, job.scheduledDate, '11:30 AM', providerId);
  await assert.rejects(repo.respondToTimeProposal(job.id, true, 'wrong'), /account/);
  const declined = await repo.respondToTimeProposal(job.id, false, customerId);
  assert.equal(declined.scheduledSlot, '09:00 AM');
  assert.equal(declined.timeProposal, null);
  assert.equal(helpers.isPending(declined), true);
});
test('proposal acceptance rechecks conflicts rather than overwriting another booking', async () => {
  const job = await request();
  await repo.proposeBookingTime(job.id, job.scheduledDate, '11:30 AM', providerId);
  await request({ scheduledSlot: '11:30 AM' });
  await assert.rejects(repo.respondToTimeProposal(job.id, true, customerId), /booked elsewhere/);
  assert.equal((await repo.getBookingById(job.id)).scheduledSlot, '09:00 AM');
});
test('draft, paused, archived, and suspended services are unavailable to customers', async () => {
  for (const status of ['draft', 'paused', 'archived']) {
    await repo.saveService({ id: 'srv-1', status });
    assert.equal(await repo.getServiceById('srv-1'), null);
    assert.ok(await repo.getServiceById('srv-1', actor));
    assert.equal((await repo.getServices()).some(service => service.id === 'srv-1'), false);
    await assert.rejects(request(), /unavailable/);
  }
  await repo.saveService({ id: 'srv-1', status: 'published' });
  await repo.moderateProvider(providerId, 'suspended', 'Demo suspension');
  assert.equal(await repo.getServiceById('srv-1'), null);
});
test('new drafts remain private and have no fabricated rating', async () => {
  const { service } = await repo.saveService({ title: 'Test Draft', description: 'Description', categoryId: 'cat-5', categoryName: 'AC Maintenance', policy: 'Policy', providerId, price: 500, duration: '60 mins', status: 'draft', availableSlots: [] });
  assert.equal(service.status, 'draft');
  assert.equal(service.rating, null);
  assert.ok((await repo.getServices({ role: 'provider', userId: providerId })).some(item => item.id === service.id));
});
test('customer reviews and public provider replies persist and use one rating source', async () => {
  const job = await complete(await request());
  await repo.submitReview(job.id, 4, 'Professional service.', customerId);
  await repo.replyToReview(job.id, 'Thank you.', providerId);
  const review = (await repo.getServiceReviews('srv-1'))[0];
  assert.equal(review.rating, 4); assert.equal(review.reply, 'Thank you.');
  const service = await repo.getServiceById('srv-1');
  assert.equal(service.rating, 4); assert.equal(service.reviewCount, 1);
  await assert.rejects(repo.submitReview(job.id, 5, 'Duplicate', customerId), /unreviewed/);
});
test('reviews require completed bookings, valid ratings, nonblank text, and ownership', async () => {
  const job = await request();
  await assert.rejects(repo.submitReview(job.id, 5, 'Good', customerId), /completed/);
  await complete(job);
  await assert.rejects(repo.submitReview(job.id, 6, 'Good', customerId), /rating/);
  await assert.rejects(repo.submitReview(job.id, 5, ' ', customerId), /rating/);
  await assert.rejects(repo.submitReview(job.id, 5, 'Good', 'wrong'), /account/);
  await assert.rejects(repo.replyToReview('BK-88410', 'Reply', 'wrong'), /account/);
});
test('disputes derive correct booking metadata and persist their booking relationship', async () => {
  const job = await complete(await request());
  const dispute = await repo.createDispute({ bookingId: job.id, customerId, customerStatement: 'Cooling issue', claimAmount: 799, serviceTitle: 'Wrong', providerId: 'wrong', amountInDispute: 1 });
  assert.equal(dispute.serviceTitle, job.serviceTitle); assert.equal(dispute.providerId, providerId); assert.equal(dispute.amountInDispute, 799);
  const saved = await repo.getBookingById(job.id);
  assert.equal(saved.disputeId, dispute.id); assert.equal(saved.status, 'disputed');
  await assert.rejects(repo.createDispute({ bookingId: job.id, customerId, customerStatement: 'Again', claimAmount: 1 }), /dispute|progress/);
});
test('provider responses, assignment, hearings, and rulings persist and notify parties', async () => {
  const job = await complete(await request());
  const dispute = await repo.createDispute({ bookingId: job.id, customerId, customerStatement: 'Issue', claimAmount: 799 });
  await repo.saveDisputeResponse(dispute.id, providerId, 'Tested cooling after service.', 'inspection.pdf');
  await repo.assignDispute(dispute.id, { id: 'user-arbit-1', name: 'Kabir Malhotra' });
  await repo.scheduleHearing(dispute.id, { scheduledDate: workday(), scheduledTime: '11:00 AM', meetUrl: 'https://example.com/demo' });
  await repo.issueRuling(dispute.id, { verdict: 'In Favor of Customer', awardAmount: 799, reason: 'Refund agreed.' });
  const saved = await repo.getBookingById(job.id);
  assert.equal(saved.status, 'cancelled'); assert.equal(saved.paymentStatus, 'Refunded'); assert.equal(saved.hasDispute, false);
  assert.equal((await repo.getDisputeById(dispute.id)).evidences[0].filename, 'inspection.pdf');
  const notifications = await repo.getNotifications(providerId);
  assert.ok(notifications.some(item => item.title === 'Dispute Hearing Scheduled'));
  assert.ok(notifications.some(item => item.title === 'Dispute Ruling Issued'));
  await assert.rejects(repo.issueRuling(dispute.id, { verdict: 'In Favor of Provider', awardAmount: 0, reason: 'Again' }), /open case/);
});
test('rulings in favour of the provider restore completed earnings', async () => {
  const job = await complete(await request());
  const dispute = await repo.createDispute({ bookingId: job.id, customerId, customerStatement: 'Issue', claimAmount: 799 });
  await repo.assignDispute(dispute.id, { id: 'user-arbit-1', name: 'Kabir' });
  await repo.issueRuling(dispute.id, { verdict: 'In Favor of Provider', awardAmount: 0, reason: 'Work verified.' });
  assert.equal((await repo.getBookingById(job.id)).status, 'completed');
  assert.equal((await repo.getBookingById(job.id)).netPayout, 759);
});
test('ticket refund resolution updates the same Provider payment record', async () => {
  const job = await complete(await request());
  const ticket = await repo.createTicket({ bookingId: job.id, customerId, description: 'Quality issue', serviceTitle: 'Wrong' });
  assert.equal(ticket.serviceTitle, job.serviceTitle);
  await repo.resolveTicket(ticket.id, 'Partial Refund (50%)');
  const saved = await repo.getBookingById(job.id);
  assert.equal(saved.refundedAmount, 400); assert.equal(saved.paymentStatus, 'Partially Refunded');
  assert.equal(saved.platformFee, 20); assert.equal(saved.netPayout, 379);
});
test('notification read state persists and cannot mark another user notifications', async () => {
  await request();
  const notification = (await repo.getNotifications(providerId)).find(item => !item.read);
  await repo.markNotificationsRead(providerId, notification.id);
  assert.equal((await repo.getNotifications(providerId)).find(item => item.id === notification.id).read, true);
  const admin = (await repo.getNotifications('user-admin-1')).find(item => !item.read);
  await repo.markNotificationsRead(providerId, admin.id);
  assert.equal((await repo.getNotifications('user-admin-1')).find(item => item.id === admin.id).read, false);
});
test('support escalation creates a linked case that can finish the Provider dispute workflow', async () => {
  const job = await complete(await request());
  const ticket = await repo.createTicket({ bookingId: job.id, customerId, description: 'Escalate this service issue.' });
  await repo.resolveTicket(ticket.id, 'Escalated to Arbitration');
  const dispute = (await repo.getDisputes()).find(item => item.bookingId === job.id);
  assert.ok(dispute);
  assert.equal((await repo.getBookingById(job.id)).disputeId, dispute.id);
  await repo.saveDisputeResponse(dispute.id, providerId, 'The work was checked.');
  await repo.assignDispute(dispute.id, { id: 'user-arbit-1', name: 'Kabir' });
  await repo.issueRuling(dispute.id, { verdict: 'In Favor of Provider', awardAmount: 0, reason: 'Work verified.' });
  assert.equal((await repo.getBookingById(job.id)).status, 'completed');
});
test('a failed multi-record save restores bookings and notifications and can be retried', async () => {
  await repo.getBookings('provider', providerId);
  const before = localStorage.getItem('servicehub_bookings');
  const notifications = localStorage.getItem('servicehub_notifications');
  const write = localStorage.setItem;
  let fail = true;
  localStorage.setItem = (key, value) => {
    if (fail && key === 'servicehub_notifications') { fail = false; throw new Error('Storage is full.'); }
    write(key, value);
  };
  await assert.rejects(request(), /Storage is full/);
  assert.equal(localStorage.getItem('servicehub_bookings'), before);
  assert.equal(localStorage.getItem('servicehub_notifications'), notifications);
  assert.ok((await request()).id);
});
test('Admin totals agree with completed Provider earnings and exclude refunded fees', async () => {
  const job = await complete(await request());
  const cancelled = await request({ scheduledSlot: '11:30 AM' });
  await repo.updateBookingStatus(cancelled.id, 'cancelled', '', actor);
  const stats = await repo.getRevenueStats();
  const jobs = await repo.getBookings('admin');
  assert.equal(stats.totalNetPayouts, jobs.filter(item => item.status === 'completed' && helpers.isPaid(item)).reduce((sum, item) => sum + helpers.netPayout(item), 0));
  assert.equal(stats.totalRevenue, jobs.filter(helpers.isPaid).reduce((sum, item) => sum + helpers.platformFee(item), 0));
  assert.equal(stats.totalRefunds, 799); assert.equal(job.netPayout, 759);
});
test('slot validation and date formatting handle midnight, invalid ranges, leap days, and browser timezones', () => {
  for (const time of ['00:00', '09:30', '12:00', '16:30', '23:59']) {
    const [hour, minute] = time.split(':').map(Number);
    assert.equal(rules.slotMinutes(rules.formatSlot(time)), hour * 60 + minute);
  }
  assert.ok(rules.validateSlots(['09:00 AM', '09:30 AM'], 60));
  assert.ok(rules.validateSlots(['11:30 PM'], 60));
  assert.ok(rules.validateSlots([], 60));
  assert.equal(rules.validDate('2028-02-29'), true);
  assert.equal(rules.validDate('2027-02-29'), false);
  assert.equal(helpers.bookingTime('2026-08-22 16:10'), helpers.bookingTime('22/08/2026, 16:10:00'));
  assert.match(helpers.formatDate('2028-02-29'), /Tue.*29.*Feb.*2028/);
});

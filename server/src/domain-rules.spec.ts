import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  availableSlots,
  DAYS,
  DEFAULT_SCHEDULE,
  scheduledSlotStartDate,
  validateSchedule,
  validateSlots,
} from './modules/bookings/scheduling.util';
import {
  calculateCancellationRefund,
  calculateRefundLedgerUpdate,
  collectedAmount,
  computeNetPayout,
  computePlatformFee,
  isLocationCovered,
} from './modules/finance/booking-rules.util';

test('scheduling.util enforces working days, hours, lead time, buffers, and blackout dates', () => {
  assert.match(validateSchedule({ ...DEFAULT_SCHEDULE, days: [] }), /working day/);
  assert.match(validateSchedule({ ...DEFAULT_SCHEDULE, startTime: '18:00', endTime: '09:00' }), /End time/);
  assert.match(validateSlots(['09:00 AM', '09:30 AM'], 60), /unique and allow enough time/);

  const provider = {
    id: 'user-prov-1',
    verificationStatus: 'approved',
    weeklyAvailability: { ...DEFAULT_SCHEDULE, days: DAYS, leadMinutes: 90, bufferMinutes: 15 },
    blackoutDates: ['2026-10-13'],
  };
  const service = {
    id: 'srv-1',
    providerId: 'user-prov-1',
    status: 'published',
    duration: '60 mins',
    availableSlots: ['10:00 AM', '11:30 AM', '02:00 PM'],
  };
  const service2 = {
    id: 'srv-2',
    providerId: 'user-prov-1',
    status: 'published',
    duration: '60 mins',
    availableSlots: ['10:00 AM', '12:30 PM'],
  };

  // Same-day lead time check in Asia/Kolkata (04:30 UTC == 10:00 IST, +90m = 11:30 IST)
  const now = new Date('2026-10-12T04:30:00Z');
  assert.deepEqual(availableSlots(service, provider, '2026-10-12', [], [service], undefined, now), ['02:00 PM']);

  // Blackout date blocks all slots
  assert.deepEqual(availableSlots(service, provider, '2026-10-13', [], [service], undefined, now), []);

  // Buffer blocks adjacent booking (11:30 AM - 12:30 PM + 15m buffer blocks 12:30 PM)
  const bookings = [
    {
      id: 'BK-1',
      providerId: 'user-prov-1',
      serviceId: 'srv-1',
      scheduledDate: '2026-10-14',
      scheduledSlot: '11:30 AM',
      duration: '60 mins',
      status: 'active',
    },
  ];
  assert.deepEqual(
    availableSlots(service2, provider, '2026-10-14', bookings, [service, service2], undefined, now),
    ['10:00 AM'],
  );
});

test('booking-rules.util computes 5% platform fee, 95% net payout, and partial/full refund math', () => {
  assert.equal(computePlatformFee(1000), 50);
  assert.equal(computeNetPayout(1000), 950);
  assert.equal(collectedAmount(1000, 'Paid', 250), 750);

  const partial = calculateRefundLedgerUpdate(1000, 0, 'Paid', 500);
  assert.deepEqual(partial, {
    refundedAmountInr: 500,
    cancellationFeeInr: 0,
    paymentStatus: 'Partially Refunded',
    platformFeeInr: 25,
    providerNetPayoutInr: 475,
  });

  const full = calculateRefundLedgerUpdate(1000, 500, 'Partially Refunded', 500);
  assert.deepEqual(full, {
    refundedAmountInr: 1000,
    paymentStatus: 'Refunded',
    platformFeeInr: 0,
    providerNetPayoutInr: 0,
    cancellationFeeInr: 0,
  });
});

test('cancellation policy computes full refund within free window and fee deduction after deadline', () => {
  const deadline = new Date('2026-10-15T10:00:00Z');
  const insideWindow = calculateCancellationRefund(1000, deadline, 20, new Date('2026-10-15T09:00:00Z'));
  assert.equal(insideWindow.withinFreeWindow, true);
  assert.equal(insideWindow.cancellationChargeInr, 0);
  assert.equal(insideWindow.refundAmountInr, 1000);

  const lateCancel = calculateCancellationRefund(1000, deadline, 20, new Date('2026-10-15T10:30:00Z'));
  assert.equal(lateCancel.withinFreeWindow, false);
  assert.equal(lateCancel.feePercent, 20);
  assert.equal(lateCancel.cancellationChargeInr, 200);
  assert.equal(lateCancel.refundAmountInr, 800);
});

test('isLocationCovered validates operatingCity aliases, servedPincodes, servedAreas, and out-of-area rejection', () => {
  const provider = {
    operatingCity: 'Bengaluru',
    servedAreas: ['Indiranagar', 'Koramangala', 'Whitefield'],
    servedPincodes: ['560038', '560034'],
  };
  assert.equal(isLocationCovered(provider, { city: 'Bangalore' }), true);
  assert.equal(isLocationCovered(provider, { pincode: '560038' }), true);
  assert.equal(isLocationCovered(provider, { city: 'Indiranagar' }), true);
  assert.equal(isLocationCovered(provider, { address: '12th Main, Bengaluru 560038' }), true);
  assert.equal(isLocationCovered(provider, { city: 'Chennai', pincode: '600001', address: 'T Nagar, Chennai' }), false);
});

test('scheduledSlotStartDate parses Asia/Kolkata date and slot into UTC Date', () => {
  const start = scheduledSlotStartDate('2026-10-15', '10:00 AM');
  // 10:00 AM IST == 04:30 AM UTC
  assert.equal(start?.toISOString(), '2026-10-15T04:30:00.000Z');
  assert.equal(scheduledSlotStartDate('invalid-date', '10:00 AM'), null);
});

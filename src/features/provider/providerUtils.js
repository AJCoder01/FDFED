import { updateBookingStatus } from '../../data/mockRepository';
export { isPaid, isAccepted, isPending, platformFee, netPayout } from '../../data/bookingRules';
export { slotMinutes, formatSlot, validateSlots } from '../../data/scheduling';
export const money = value => `₹${Number(value).toLocaleString('en-IN')}`;

export function updateJob(id, providerId, action, note) {
  const status = { accept: 'active', decline: 'cancelled', start: 'in_progress', complete: 'completed' }[action];
  if (!status) return Promise.reject(new Error('Invalid job action.'));
  return updateBookingStatus(id, status, note, { role: 'provider', userId: providerId });
}
export { formatDate, formatTimestamp, bookingTime } from '../../utils/date';

import { store } from '../../store';
import { updateBookingStatusThunk } from '../../store/slices/bookingsSlice';
export { isPaid, isAccepted, isPending, platformFee, netPayout } from '../../data/bookingRules';
export { slotMinutes, formatSlot, validateSlots } from '../../data/scheduling';
export const money = value => `₹${Number(value).toLocaleString('en-IN')}`;

export function updateJob(id, providerId, action, note) {
  const status = { accept: 'active', decline: 'cancelled', start: 'in_progress', complete: 'completed' }[action];
  if (!status) return Promise.reject(new Error('Invalid job action.'));
  return store.dispatch(updateBookingStatusThunk({ id, status, note, options: { role: 'provider', userId: providerId } })).unwrap();
}
export { formatDate, formatTimestamp, bookingTime } from '../../utils/date';

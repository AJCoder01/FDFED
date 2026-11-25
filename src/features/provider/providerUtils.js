export { isPaid, isAccepted, isPending, platformFee, netPayout } from '../../data/bookingRules';
export { slotMinutes, formatSlot, validateSlots } from '../../data/scheduling';
export const money = value => `₹${Number(value).toLocaleString('en-IN')}`;
export const ACTION_TO_STATUS = {
  accept: 'active',
  decline: 'cancelled',
  start: 'in_progress',
  complete: 'completed',
};
export { formatDate, formatTimestamp, bookingTime } from '../../utils/date';

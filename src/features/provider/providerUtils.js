import { getBookingById, updateBookingStatus } from '../../data/mockRepository';

export const money = value => `₹${Number(value).toLocaleString('en-IN')}`;
export const isPaid = job => ['Paid', 'Completed'].includes(job.paymentStatus);
export const platformFee = job => Number(job.platformFee ?? Math.round(Number(job.amount) * 0.05));
export const netPayout = job => Number(job.netPayout ?? (Number(job.amount) - platformFee(job)));

// The repository uses "active" for both new requests and accepted jobs.
export const isAccepted = job => job.timeline?.some(event => /accepted the booking/i.test(event.desc));
export const isPending = job => job.status === 'active' && !isAccepted(job);

export async function updateJob(id, providerId, action, note) {
  const status = { accept: 'active', decline: 'cancelled', start: 'in_progress', complete: 'completed' }[action];
  if (!status) throw new Error('Invalid job action.');
  const job = await getBookingById(id);
  if (!job || job.providerId !== providerId) throw new Error('This job is unavailable.');
  const allowed = action === 'complete' ? job.status === 'in_progress'
    : action === 'start' ? job.status === 'active' && isAccepted(job)
    : isPending(job);
  if (!allowed) throw new Error('This job has changed. Refresh before taking another action.');
  const updated = await updateBookingStatus(id, status, note);
  if (!updated) throw new Error('The job could not be updated.');
  return updated;
}

export function slotMinutes(slot) {
  const match = /^(0[1-9]|1[0-2]):([0-5]\d) (AM|PM)$/.exec(slot);
  if (!match) return NaN;
  return (Number(match[1]) % 12 + (match[3] === 'PM' ? 12 : 0)) * 60 + Number(match[2]);
}

export function formatSlot(time) {
  const [hour, minute] = time.split(':').map(Number);
  return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export function validateSlots(slots, duration) {
  if (!Number.isInteger(duration) || duration <= 0) return 'The service needs a valid duration in minutes.';
  if (!slots.length) return 'Add at least one time slot.';
  const times = slots.map(slotMinutes).sort((a, b) => a - b);
  if (times.some(time => !Number.isFinite(time) || time + duration > 1440)) {
    return 'Every slot must be valid and finish by midnight.';
  }
  if (times.some((time, index) => index > 0 && time < times[index - 1] + duration)) {
    return 'Time slots must be unique and allow enough time for the service.';
  }
  return '';
}

export function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

export function bookingTime(value) {
  if (/^\d{4}-/.test(value)) return new Date(value.replace(' ', 'T')).getTime();
  const [date, time] = value.split(', ');
  const [day, month, year] = date.split('/');
  return new Date(`${year}-${month}-${day}T${time}`).getTime();
}

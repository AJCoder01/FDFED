import { localClock } from '../data/scheduling';

export function getTodayDateInputValue() {
  return localClock().date;
}

export function addDays(date, offset) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function formatDate(date) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}
export function bookingTime(value) {
  if (/^\d{4}-/.test(value)) {
    const date = value.replace(' ', 'T');
    return new Date(/Z|[+-]\d{2}:\d{2}$/.test(date) ? date : `${date}+05:30`).getTime();
  }
  const [date, time] = value.split(', ');
  const [day, month, year] = date.split('/');
  return new Date(`${year}-${month}-${day}T${time}+05:30`).getTime();
}
export function formatTimestamp(value) {
  return new Date(bookingTime(value)).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short'
  });
}

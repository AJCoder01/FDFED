export const TIME_ZONE = 'Asia/Kolkata';
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DEFAULT_SCHEDULE = {
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  startTime: '09:00',
  endTime: '19:00',
  blackoutDates: [] as string[],
  leadMinutes: 0,
  bufferMinutes: 0,
  timeZone: TIME_ZONE,
};

export function localClock(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function validDate(date: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(`${date}T12:00:00Z`)) &&
    new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date
  );
}

export const timeMinutes = (time: string) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

export function slotMinutes(slot: string) {
  const match = /^(0[1-9]|1[0-2]):([0-5]\d) (AM|PM)$/.exec(slot);
  return match ? ((Number(match[1]) % 12) + (match[3] === 'PM' ? 12 : 0)) * 60 + Number(match[2]) : NaN;
}

export function scheduledSlotStartDate(date: string, slot: string): Date | null {
  if (!validDate(date)) return null;
  const mins = slotMinutes(slot);
  if (!Number.isFinite(mins)) return null;
  const utcMidnightMs = Date.parse(`${date}T00:00:00Z`);
  const istOffsetMs = 330 * 60 * 1000;
  return new Date(utcMidnightMs + mins * 60_000 - istOffsetMs);
}

export function validateSlots(slots: string[], duration: number) {
  if (!Number.isInteger(duration) || duration <= 0) return 'Enter a valid service duration in minutes.';
  if (!slots.length) return 'Add at least one time slot.';
  const times = slots.map(slotMinutes).sort((a, b) => a - b);
  if (times.some((time) => !Number.isFinite(time) || time + duration > 1440))
    return 'Every slot must be valid and finish by midnight.';
  if (times.some((time, index) => index > 0 && time < times[index - 1] + duration))
    return 'Time slots must be unique and allow enough time for the service.';
  return '';
}

export function validateSchedule(schedule: any) {
  if (!schedule?.days?.length || schedule.days.some((day: string) => !DAYS.includes(day)))
    return 'Select at least one working day.';
  if (
    !Number.isFinite(timeMinutes(schedule.startTime)) ||
    !Number.isFinite(timeMinutes(schedule.endTime)) ||
    schedule.startTime >= schedule.endTime
  )
    return 'End time must be later than start time.';
  if ((schedule.blackoutDates || []).some((date: string) => !validDate(date))) return 'Enter valid blackout dates.';
  if (
    ![schedule.leadMinutes ?? 0, schedule.bufferMinutes ?? 0].every(
      (value) => Number.isInteger(value) && value >= 0 && value <= 1440,
    )
  )
    return 'Lead time and buffer must be between 0 and 1440 minutes.';
  return '';
}

export function availableSlots(
  service: any,
  provider: any,
  date: string,
  bookings: any[],
  services: any[],
  excludeId?: string,
  now = new Date(),
): string[] {
  const statusLower = String(service?.status || '').toLowerCase();
  if (!service || statusLower !== 'published' || provider?.verificationStatus !== 'approved' || !validDate(date)) {
    return [];
  }
  const schedule = {
    ...DEFAULT_SCHEDULE,
    ...(provider.weeklyAvailability || {}),
    blackoutDates: provider.blackoutDates?.length
      ? provider.blackoutDates
      : provider.weeklyAvailability?.blackoutDates || [],
    leadMinutes: provider.leadTimeMinutes ?? provider.weeklyAvailability?.leadMinutes ?? 0,
    bufferMinutes: provider.bufferMinutes ?? provider.weeklyAvailability?.bufferMinutes ?? 0,
  };
  const clock = localClock(now);
  const weekday = DAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
  if (date < clock.date || !schedule.days.includes(weekday) || schedule.blackoutDates.includes(date)) return [];
  const duration = Number.parseInt(service.duration ?? service.durationMinutes, 10);
  const earliest = Date.parse(`${clock.date}T00:00:00Z`) / 60000 + clock.minutes + schedule.leadMinutes;
  const slotsList: string[] = Array.isArray(service.availableSlots) ? service.availableSlots : [];

  return slotsList.filter((slot) => {
    const start = slotMinutes(slot);
    const end = start + duration;
    if (start < timeMinutes(schedule.startTime) || end > timeMinutes(schedule.endTime)) return false;
    if (Date.parse(`${date}T00:00:00Z`) / 60000 + start <= earliest) return false;
    return !bookings.some((job) => {
      if (job.id === excludeId || job.providerId !== service.providerId || job.scheduledDate !== date || job.status === 'cancelled')
        return false;
      const bookedService = services.find((item) => item.id === job.serviceId);
      const bookedStart = slotMinutes(job.scheduledSlot);
      const bookedEnd =
        bookedStart + Number.parseInt(job.duration || bookedService?.duration || bookedService?.durationMinutes || '60', 10);
      return start < bookedEnd + schedule.bufferMinutes && end + schedule.bufferMinutes > bookedStart;
    });
  });
}

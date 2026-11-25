export const isPaid = job => ['Paid', 'Completed', 'Partially Refunded'].includes(job.paymentStatus);
// Older saved bookings record acceptance only in their timeline.
export const isAccepted = job => Boolean(job.acceptedAt || job.timeline?.some(event => /accepted the booking/i.test(event.desc)));
export const isPending = job => job.status === 'active' && !isAccepted(job);
export const bookingStatusLabel = job => {
  if (!job) return '';
  if (job.status === 'active') return isAccepted(job) ? 'Accepted' : 'Awaiting Acceptance';
  return undefined;
};
export const platformFee = job => Number(job.platformFee ?? Math.round(Number(job.amount) * 0.05));
export const netPayout = job => Number(job.netPayout ?? (Number(job.amount) - platformFee(job)));
export const collectedAmount = job => isPaid(job) ? Number(job.amount) - Number(job.refundedAmount || 0) : 0;

export function calculateCancellationRefund(grossAmount, freeCancellationUntil, cancellationFeePercent = 20, now = new Date()) {
  const gross = Number(grossAmount || 0);
  const until = freeCancellationUntil ? new Date(freeCancellationUntil) : null;
  const withinFreeWindow = !until || Number.isNaN(until.getTime()) || now.getTime() <= until.getTime();
  const feePercent = withinFreeWindow ? 0 : Math.max(0, Math.min(100, Number(cancellationFeePercent ?? 20)));
  const cancellationCharge = Math.round((gross * feePercent) / 100);
  const refundAmount = Math.max(0, gross - cancellationCharge);
  const remainingMs = until && !Number.isNaN(until.getTime()) ? Math.max(0, until.getTime() - now.getTime()) : 0;
  return { withinFreeWindow, feePercent, cancellationCharge, refundAmount, remainingMs };
}

const CITY_ALIASES = {
  bangalore: 'bengaluru',
  bengaluru: 'bengaluru',
  'delhi ncr': 'delhi',
  'new delhi': 'delhi',
  delhi: 'delhi',
  bombay: 'mumbai',
  mumbai: 'mumbai',
};

function normalizePlace(value) {
  const lower = String(value || '').trim().toLowerCase();
  return CITY_ALIASES[lower] || lower;
}

export function isServiceAvailableForLocation(service, customerLocation = {}) {
  if (!service) return false;
  const custPin = String(customerLocation.pincode || customerLocation.pinCode || '').trim();
  const custCity = normalizePlace(customerLocation.city || customerLocation.location || '');
  const custAddr = String(customerLocation.address || '').toLowerCase();

  const servedPins = Array.isArray(service.providerServedPincodes)
    ? service.providerServedPincodes.map(p => String(p).trim()).filter(Boolean)
    : [];
  if (custPin && servedPins.includes(custPin)) return true;

  const operatingCity = normalizePlace(service.providerOperatingCity || '');
  if (custCity && operatingCity && custCity === operatingCity) return true;

  const servedAreas = Array.isArray(service.providerServedAreas)
    ? service.providerServedAreas.map(normalizePlace).filter(Boolean)
    : [];
  if (custCity && servedAreas.some(area => area === custCity || area.includes(custCity) || custCity.includes(area))) {
    return true;
  }

  const areaTokens = String(service.providerServiceArea || '')
    .toLowerCase()
    .split(/[,;/]+/)
    .map(normalizePlace)
    .filter(Boolean);
  if (custCity && areaTokens.some(tok => tok === custCity || tok.includes(custCity) || custCity.includes(tok))) {
    return true;
  }

  if (custAddr) {
    if (operatingCity && custAddr.includes(operatingCity)) return true;
    if (operatingCity === 'bengaluru' && custAddr.includes('bangalore')) return true;
    if (servedPins.some(pin => custAddr.includes(pin))) return true;
  }

  return false;
}

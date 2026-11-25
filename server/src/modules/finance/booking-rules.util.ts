export const isPaid = (paymentStatus: string) =>
  ['Paid', 'Completed', 'Partially Refunded'].includes(paymentStatus);

export const isAccepted = (job: any) =>
  Boolean(job.acceptedAt || (Array.isArray(job.timeline) && job.timeline.some((e: any) => /accepted the booking/i.test(e.desc))));

export const isPending = (job: any) => job.status === 'active' && !isAccepted(job);

export const computePlatformFee = (amount: number) => Math.round(Number(amount) * 0.05);

export const computeNetPayout = (amount: number) => Number(amount) - computePlatformFee(amount);

export const collectedAmount = (grossAmount: number, paymentStatus: string, refundedAmount = 0) =>
  isPaid(paymentStatus) ? Number(grossAmount) - Number(refundedAmount || 0) : 0;

export function calculateCancellationRefund(
  grossAmountInr: number,
  freeCancellationUntil: Date | string | null | undefined,
  cancellationFeePercent = 20,
  now = new Date(),
) {
  const gross = Number(grossAmountInr || 0);
  const until = freeCancellationUntil ? new Date(freeCancellationUntil) : null;
  const withinFreeWindow = !until || Number.isNaN(until.getTime()) || now.getTime() <= until.getTime();
  const feePercent = withinFreeWindow ? 0 : Math.max(0, Math.min(100, Number(cancellationFeePercent ?? 20)));
  const cancellationChargeInr = Math.round((gross * feePercent) / 100);
  const refundAmountInr = Math.max(0, gross - cancellationChargeInr);
  return {
    withinFreeWindow,
    feePercent,
    cancellationChargeInr,
    refundAmountInr,
  };
}

export function calculateRefundLedgerUpdate(
  grossAmountInr: number,
  currentRefundedInr: number,
  currentPaymentStatus: string,
  refundAmount: number,
  cancellationChargeInr = 0,
) {
  const paid = isPaid(currentPaymentStatus) || currentPaymentStatus === 'Refunded';
  if (!paid) return null;
  const refundedAmountInr = Math.min(Number(grossAmountInr), Number(currentRefundedInr || 0) + Number(refundAmount));
  const retained = Math.max(0, Number(grossAmountInr) - refundedAmountInr);
  const paymentStatus = refundedAmountInr === Number(grossAmountInr) ? 'Refunded' : 'Partially Refunded';
  const platformFeeInr = Math.round(retained * 0.05);
  const providerNetPayoutInr = retained - platformFeeInr;
  return {
    refundedAmountInr,
    cancellationFeeInr: Number(cancellationChargeInr || 0),
    paymentStatus,
    platformFeeInr,
    providerNetPayoutInr,
  };
}

const CITY_ALIASES: Record<string, string> = {
  bangalore: 'bengaluru',
  bengaluru: 'bengaluru',
  'delhi ncr': 'delhi',
  'new delhi': 'delhi',
  delhi: 'delhi',
  bombay: 'mumbai',
  mumbai: 'mumbai',
};

function normalizePlace(value: string): string {
  const lower = String(value || '').trim().toLowerCase();
  return CITY_ALIASES[lower] || lower;
}

export function isLocationCovered(
  provider: any,
  customerLocation: { city?: string; pincode?: string; pinCode?: string; address?: string },
): boolean {
  if (!provider) return false;
  const custPin = String(customerLocation.pincode || customerLocation.pinCode || '').trim();
  const custCity = normalizePlace(customerLocation.city || '');
  const custAddr = String(customerLocation.address || '').toLowerCase();

  const servedPins: string[] = Array.isArray(provider.servedPincodes)
    ? provider.servedPincodes.map((p: any) => String(p).trim()).filter(Boolean)
    : [];
  if (custPin && servedPins.includes(custPin)) return true;

  const operatingCity = normalizePlace(provider.operatingCity || '');
  if (custCity && operatingCity && custCity === operatingCity) return true;

  const servedAreas: string[] = Array.isArray(provider.servedAreas)
    ? provider.servedAreas.map((a: any) => normalizePlace(a)).filter(Boolean)
    : [];
  if (custCity && servedAreas.some((area) => area === custCity || area.includes(custCity) || custCity.includes(area))) {
    return true;
  }

  const rawServiceArea = String(provider.serviceArea || '').toLowerCase();
  const areaTokens = rawServiceArea
    .split(/[,;/]+/)
    .map((t) => normalizePlace(t))
    .filter(Boolean);
  if (custCity && areaTokens.some((tok) => tok === custCity || tok.includes(custCity) || custCity.includes(tok))) {
    return true;
  }
  if (custAddr) {
    if (operatingCity && custAddr.includes(operatingCity)) return true;
    if (operatingCity === 'bengaluru' && custAddr.includes('bangalore')) return true;
    if (servedPins.some((pin) => custAddr.includes(pin))) return true;
  }

  return false;
}

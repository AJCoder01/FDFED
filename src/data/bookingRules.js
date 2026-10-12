export const isPaid = job => ['Paid', 'Completed', 'Partially Refunded'].includes(job.paymentStatus);
// Older saved bookings record acceptance only in their timeline.
export const isAccepted = job => Boolean(job.acceptedAt || job.timeline?.some(event => /accepted the booking/i.test(event.desc)));
export const isPending = job => job.status === 'active' && !isAccepted(job);
export const platformFee = job => Number(job.platformFee ?? Math.round(Number(job.amount) * 0.05));
export const netPayout = job => Number(job.netPayout ?? (Number(job.amount) - platformFee(job)));
export const collectedAmount = job => isPaid(job) ? Number(job.amount) - Number(job.refundedAmount || 0) : 0;

export function refundPayment(job, amount) {
  const paid = isPaid(job) || job.paymentStatus === 'Refunded';
  if (!paid) return;
  job.refundedAmount = Math.min(Number(job.amount), Number(job.refundedAmount || 0) + amount);
  const retained = Number(job.amount) - job.refundedAmount;
  job.paymentStatus = retained === 0 ? 'Refunded' : 'Partially Refunded';
  job.platformFee = Math.round(retained * 0.05);
  job.netPayout = retained - job.platformFee;
}

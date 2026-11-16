import { BadRequestException, Injectable } from "@nestjs/common";
import { Tx } from "../common/effects";
export function minor(value: number | string) {
  const text = String(value);
  if (!/^\d+(\.\d{1,2})?$/.test(text))
    throw new BadRequestException(
      "Amount must be nonnegative INR with at most two decimal places.",
    );
  const [whole, fraction = ""] = text.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result) || result > 2_000_000_000)
    throw new BadRequestException("Amount exceeds supported limit.");
  return result;
}
export function fees(retained: number) {
  const feeMinor = Math.floor((retained * 5 + 50) / 100);
  return { feeMinor, payoutMinor: retained - feeMinor };
}
@Injectable()
export class FinanceService {
  async refund(
    tx: Tx,
    bookingId: string,
    requested: number,
    reasonKey: string,
  ) {
    const p = await tx.paymentRecord.findUniqueOrThrow({
      where: { bookingId },
    });
    if (await tx.refundRecord.findUnique({ where: { reasonKey } })) return;
    if (!["Paid", "Partially Refunded"].includes(p.status)) return;
    const amountMinor = Math.min(requested, p.amountMinor - p.refundedMinor);
    if (amountMinor <= 0) return;
    const refundedMinor = p.refundedMinor + amountMinor;
    const retained = p.amountMinor - refundedMinor;
    await tx.refundRecord.create({
      data: { paymentId: p.id, amountMinor, reasonKey },
    });
    await tx.paymentRecord.update({
      where: { id: p.id },
      data: {
        refundedMinor,
        status: retained ? "Partially Refunded" : "Refunded",
        ...fees(retained),
      },
    });
  }
}

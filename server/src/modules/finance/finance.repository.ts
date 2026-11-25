import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateRefundLedgerUpdate } from './booking-rules.util';

@Injectable()
export class FinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllBookingsWithLedgers(providerId?: string) {
    return this.prisma.booking.findMany({
      where: providerId ? { providerId } : undefined,
      include: { paymentLedger: true, review: true, dispute: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllLedgers(providerId?: string) {
    return this.prisma.paymentLedger.findMany({
      where: providerId ? { booking: { providerId } } : undefined,
      include: { booking: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findAllWalletTransactions(accountId?: string) {
    return this.prisma.walletTransaction.findMany({
      where: accountId ? { accountId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAccountWithWallet(accountId: string) {
    return this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        walletTransactions: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async topUpWalletTransaction(accountId: string, amountInr: number, method = 'UPI (Mock Top-Up)') {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.account.update({
        where: { id: accountId },
        data: { walletBalanceInr: { increment: amountInr } },
      });

      const txn = await tx.walletTransaction.create({
        data: {
          id: `wtxn-${crypto.randomUUID().slice(0, 8)}`,
          accountId,
          type: 'WALLET_TOPUP',
          direction: 'CREDIT',
          amountInr,
          grossAmountInr: amountInr,
          platformFeeInr: 0,
          netAmountInr: amountInr,
          status: 'Successful',
          description: `Added ₹${amountInr} to ServiceHub Wallet via ${method}`,
        },
      });

      return { walletBalance: updated.walletBalanceInr, transaction: txn };
    });
  }

  async withdrawWalletTransaction(accountId: string, amountInr: number, destination = 'Linked Bank Account') {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (!account) return { error: 'Account not found.' };
      if (account.walletBalanceInr < amountInr) {
        return { error: `Insufficient available wallet balance (₹${account.walletBalanceInr}).` };
      }

      const updated = await tx.account.update({
        where: { id: accountId },
        data: { walletBalanceInr: { decrement: amountInr } },
      });

      const txn = await tx.walletTransaction.create({
        data: {
          id: `wtxn-${crypto.randomUUID().slice(0, 8)}`,
          accountId,
          type: 'WITHDRAWAL',
          direction: 'DEBIT',
          amountInr,
          grossAmountInr: amountInr,
          platformFeeInr: 0,
          netAmountInr: amountInr,
          status: 'Successful',
          description: `Withdrew ₹${amountInr} to ${destination}`,
        },
      });

      return { walletBalance: updated.walletBalanceInr, transaction: txn };
    });
  }

  findLedgerById(id: string) {
    return this.prisma.paymentLedger.findUnique({ where: { id }, include: { booking: true } });
  }

  findLedgerByBookingId(bookingId: string) {
    return this.prisma.paymentLedger.findUnique({ where: { bookingId }, include: { booking: true } });
  }

  createLedger(data: {
    id: string;
    bookingId: string;
    grossAmountInr: number;
    platformFeeInr: number;
    providerNetPayoutInr: number;
    refundedAmountInr: number;
    paymentMethod: string;
    paymentStatus: string;
  }) {
    return this.prisma.paymentLedger.create({ data, include: { booking: true } });
  }

  updateLedger(id: string, data: any) {
    return this.prisma.paymentLedger.update({ where: { id }, data, include: { booking: true } });
  }

  async issueRefund(bookingId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      const ledger = await tx.paymentLedger.findUnique({ where: { bookingId }, include: { booking: true } });
      if (!ledger) return null;
      const update = calculateRefundLedgerUpdate(
        ledger.grossAmountInr,
        ledger.refundedAmountInr,
        ledger.paymentStatus,
        amount,
      );
      if (!update) return null;
      return tx.paymentLedger.update({
        where: { id: ledger.id },
        data: update,
        include: { booking: true },
      });
    });
  }

  deleteLedger(id: string) {
    return this.prisma.paymentLedger.delete({ where: { id } });
  }
}

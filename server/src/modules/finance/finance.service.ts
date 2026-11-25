import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FinanceRepository } from './finance.repository';
import { collectedAmount, computeNetPayout, computePlatformFee, isPaid } from './booking-rules.util';
import { serializeBooking, serializeWalletTransaction } from '../../common/utils/serializers';

@Injectable()
export class FinanceService {
  constructor(private readonly financeRepo: FinanceRepository) {}

  async getRevenueStats() {
    const [bookings, walletTransactions] = await Promise.all([
      this.financeRepo.findAllBookingsWithLedgers(),
      this.financeRepo.findAllWalletTransactions(),
    ]);
    const serialized = bookings.map(serializeBooking);

    const transactions = serialized.filter((job) => isPaid(job.paymentStatus) || job.paymentStatus === 'Refunded');
    const categoryMap: Record<string, { category: string; gmv: number; revenue: number; count: number }> = {};

    for (const job of transactions) {
      const category = job.categoryName || 'General';
      categoryMap[category] ||= { category, gmv: 0, revenue: 0, count: 0 };
      categoryMap[category].gmv += Number(job.amount);
      categoryMap[category].revenue += job.paymentStatus === 'Refunded' ? 0 : Number(job.platformFee);
      categoryMap[category].count += 1;
    }

    const gmv = transactions.reduce((sum, job) => sum + Number(job.amount), 0);
    const totalRevenue = serialized
      .filter((job) => isPaid(job.paymentStatus))
      .reduce((sum, job) => sum + Number(job.platformFee), 0);
    const totalRefunds = transactions.reduce((sum, job) => sum + Number(job.refundedAmount || 0), 0);
    const totalCancellationCharges = serialized.reduce((sum, job) => sum + Number(job.cancellationFee || 0), 0);
    const totalArbitratorFees = serialized.reduce((sum, job) => sum + Number(job.arbitratorFee || 0), 0);
    const netCollected = serialized.reduce(
      (sum, job) => sum + collectedAmount(job.amount, job.paymentStatus, job.refundedAmount),
      0,
    );
    const totalNetPayouts = serialized
      .filter((job) => job.status === 'completed' && isPaid(job.paymentStatus))
      .reduce((sum, job) => sum + Number(job.netPayout), 0);

    return {
      gmv,
      totalRevenue,
      totalRefunds,
      totalCancellationCharges,
      totalArbitratorFees,
      netCollected,
      totalNetPayouts,
      transactionCount: transactions.length,
      avgFeePerBooking: transactions.length ? Math.round(totalRevenue / transactions.length) : 0,
      categoryBreakdown: Object.values(categoryMap),
      recentTransactions: serialized,
      walletTransactions: walletTransactions.map(serializeWalletTransaction),
    };
  }

  async getWallet(accountId: string) {
    const account = await this.financeRepo.findAccountWithWallet(accountId);
    if (!account) throw new NotFoundException('Account not found.');
    const transactions = (account.walletTransactions || []).map(serializeWalletTransaction);

    const totalCredits = transactions
      .filter((t) => t.direction === 'CREDIT' && t.status !== 'Failed')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = transactions
      .filter((t) => t.direction === 'DEBIT' && t.status !== 'Failed')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalRefunds = transactions
      .filter((t) => t.type === 'REFUND' || t.type === 'DISPUTE_AWARD')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = transactions
      .filter((t) => t.type === 'WITHDRAWAL')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDisputeDeductions = transactions
      .filter((t) => t.type === 'DISPUTE_DEDUCTION' && t.direction === 'DEBIT')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPlatformFees = transactions
      .filter((t) => t.type === 'BOOKING_PAYMENT' || t.type === 'PROVIDER_PAYOUT')
      .reduce((sum, t) => sum + t.platformFee, 0);

    return {
      accountId: account.id,
      role: account.role.toLowerCase(),
      walletBalance: account.walletBalanceInr,
      totalCredits,
      totalDebits,
      totalRefunds,
      totalWithdrawals,
      totalDisputeDeductions,
      totalPlatformFees,
      transactions,
    };
  }

  async topUpWallet(accountId: string, amount: number, method?: string) {
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      throw new BadRequestException('Enter a valid top-up amount between ₹1 and ₹1,00,000.');
    }
    const result = await this.financeRepo.topUpWalletTransaction(accountId, Math.round(amount), method);
    return {
      walletBalance: result.walletBalance,
      transaction: serializeWalletTransaction(result.transaction),
    };
  }

  async withdrawWallet(accountId: string, amount: number, destination?: string) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Enter a valid positive withdrawal amount.');
    }
    const result = await this.financeRepo.withdrawWalletTransaction(accountId, Math.round(amount), destination);
    if ('error' in result) throw new BadRequestException(result.error);
    return {
      walletBalance: result.walletBalance,
      transaction: serializeWalletTransaction(result.transaction),
    };
  }

  async getLedgers(actor: any) {
    const providerId = actor.role === 'provider' ? actor.id : undefined;
    return this.financeRepo.findAllLedgers(providerId);
  }

  async getProviderEarnings(providerId: string) {
    const bookings = await this.financeRepo.findAllBookingsWithLedgers(providerId);
    const serialized = bookings.map(serializeBooking);
    const completedPaid = serialized.filter((b) => b.status === 'completed' && isPaid(b.paymentStatus));
    const totalEarnings = completedPaid.reduce((sum, b) => sum + Number(b.netPayout), 0);
    const pendingEscrow = serialized
      .filter((b) => ['active', 'in_progress', 'reschedule_proposed'].includes(b.status))
      .reduce((sum, b) => sum + Number(b.netPayout), 0);

    return {
      providerId,
      totalEarnings,
      pendingEscrow,
      completedCount: completedPaid.length,
      transactions: serialized,
    };
  }

  async issueRefund(bookingId: string, amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Enter a positive refund amount.');
    }
    const updated = await this.financeRepo.issueRefund(bookingId, amount);
    if (!updated) throw new NotFoundException('Refundable payment ledger not found for this booking.');
    return updated;
  }

  async createLedger(body: any) {
    const gross = Number(body.grossAmountInr);
    const fee = body.platformFeeInr !== undefined ? Number(body.platformFeeInr) : computePlatformFee(gross);
    const payout = body.providerNetPayoutInr !== undefined ? Number(body.providerNetPayoutInr) : computeNetPayout(gross);
    return this.financeRepo.createLedger({
      id: body.id || `pay-${crypto.randomUUID().slice(0, 8)}`,
      bookingId: body.bookingId,
      grossAmountInr: gross,
      platformFeeInr: fee,
      providerNetPayoutInr: payout,
      refundedAmountInr: Number(body.refundedAmountInr || 0),
      paymentMethod: body.paymentMethod || 'UPI (Mock Pay)',
      paymentStatus: body.paymentStatus || 'Paid',
    });
  }

  async updateLedger(id: string, body: any) {
    const existing = await this.financeRepo.findLedgerById(id);
    if (!existing) throw new NotFoundException('Ledger record not found.');
    return this.financeRepo.updateLedger(id, body);
  }

  async deleteLedger(id: string) {
    const existing = await this.financeRepo.findLedgerById(id);
    if (!existing) throw new NotFoundException('Ledger record not found.');
    await this.financeRepo.deleteLedger(id);
    return { success: true, id };
  }
}

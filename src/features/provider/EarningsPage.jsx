import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import {
  fetchBookings,
  selectBookings,
  selectBookingsError,
  selectBookingsLoading,
} from '../../store/slices/bookingsSlice';
import {
  fetchWallet,
  selectWallet,
  withdrawWallet,
} from '../../store/slices/financeSlice';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { formatTimestamp, isPaid, money, netPayout, platformFee } from './providerUtils';

export function EarningsPage() {
  const dispatch = useDispatch();
  const { currentUser, showToast } = useApp();

  const refresh = useCallback(() => {
    dispatch(fetchWallet());
    if (currentUser?.id) {
      dispatch(fetchBookings({ role: 'provider', userId: currentUser.id }));
    }
  }, [dispatch, currentUser?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const jobs = useSelector(selectBookings);
  const wallet = useSelector(selectWallet);
  const loading = useSelector(selectBookingsLoading);
  const error = useSelector(selectBookingsError);

  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [busy, setBusy] = useState(false);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await dispatch(withdrawWallet({ amount: Number(withdrawAmount), destination: 'Provider Bank Account' })).unwrap();
      showToast(`₹${Number(withdrawAmount).toLocaleString('en-IN')} withdrawn to your linked bank account.`, 'success');
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Withdrawal failed.', 'warning');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading && jobs.length === 0) return <Skeleton height="300px" borderRadius="12px" />;

  const paid = jobs.filter(isPaid);
  const payments = jobs.filter(job => isPaid(job) || job.paymentStatus === 'Refunded');
  const completed = jobs.filter(job => job.status === 'completed' && (isPaid(job) || job.paymentStatus === 'Refunded'));
  const pending = paid.filter(job => ['active', 'in_progress', 'reschedule_proposed'].includes(job.status));
  const sumPayout = list => list.reduce((sum, job) => sum + netPayout(job), 0);
  const totalWithdrawals = wallet?.totalWithdrawals ?? 0;
  const totalDisputeDeductions = Number(
    wallet?.totalDisputeDeductions ??
      (wallet?.transactions || [])
        .filter(t => t.type === 'DISPUTE_DEDUCTION' && t.direction === 'DEBIT')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
  );
  const netCompletedEarnings = sumPayout(completed) - totalDisputeDeductions;

  const stats = [
    ['AVAILABLE WALLET BALANCE', wallet?.walletBalance ?? 0],
    ['TOTAL NET EARNINGS (95%)', netCompletedEarnings],
    ['PENDING PAYMENTS (ESCROW)', sumPayout(pending)],
    ['DISPUTE DEDUCTIONS', totalDisputeDeductions],
    ['TOTAL WITHDRAWALS', totalWithdrawals],
    ['GROSS BOOKING VALUE', payments.reduce((sum, job) => sum + Number(job.amount), 0)],
    ['PLATFORM FEES DEDUCTED (5%)', paid.reduce((sum, job) => sum + platformFee(job), 0)]
  ];

  const columns = [
    { header: 'Job ID', accessor: 'id', render: row => <strong>#{row.id}</strong> },
    { header: 'Service', accessor: 'serviceTitle' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Date', accessor: 'scheduledDate' },
    { header: 'Total Booking', render: row => money(row.amount) },
    { header: 'Platform Commission (5%)', render: row => money(platformFee(row)) },
    { header: 'Net Earnings (95%)', render: row => <strong style={{ color: 'var(--color-success)' }}>{money(netPayout(row))}</strong> },
    { header: 'Job Status', render: row => <StatusBadge status={row.status} /> },
    { header: 'Refunded', render: row => money(row.refundedAmount || 0) },
    { header: 'Payment Status', accessor: 'paymentStatus' }
  ];

  const txnColumns = [
    { header: 'Time', render: (row) => <span style={{ fontSize: '12px' }}>{formatTimestamp(row.createdAt)}</span> },
    { header: 'Type', render: (row) => <strong style={{ fontSize: '12px' }}>{row.type.replaceAll('_', ' ')}</strong> },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Amount',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: row.direction === 'CREDIT' ? 'var(--color-success)' : 'var(--color-ink)' }}>
          {row.direction === 'CREDIT' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
          {row.direction === 'CREDIT' ? '+' : '-'}₹{row.amount}
        </span>
      ),
    },
    { header: 'Status', render: (row) => <StatusBadge status={row.status === 'Successful' ? 'approved' : 'info'} label={row.status} /> },
  ];

  return (
    <div className="provider-page">
      <div className="page-header">
        <h1 className="page-title">Provider Wallet & Earnings ({currentUser?.providerType === 'individual' ? 'Individual Freelancer' : 'Registered Company'})</h1>
        <p className="page-subtitle">Available wallet balance, 95% net earnings after 5% platform commission, withdrawals, and transaction history.</p>
      </div>

      <div className="provider-stats">
        {stats.map(([label, value]) => <div className="card" key={label}><span className="provider-hint">{label}</span><div className="provider-stat-value">{money(value)}</div></div>)}
      </div>

      <form onSubmit={handleWithdraw} className="card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
          <Wallet size={22} color="var(--color-primary)" />
          <div>
            <strong style={{ display: 'block', fontSize: '15px' }}>Withdraw Earnings to Bank</strong>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Completed bookings: {completed.length} · Available balance: {money(wallet?.walletBalance ?? 0)}</span>
          </div>
        </div>
        <div style={{ width: '180px' }}>
          <TextField label="Amount (INR ₹)" type="number" min="1" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required disabled={busy} />
        </div>
        <Button type="submit" disabled={busy || (wallet?.walletBalance ?? 0) <= 0}>
          {busy ? 'Processing…' : 'Withdraw Funds'}
        </Button>
      </form>

      <div className="card provider-stack">
        <h2>Booking-Wise Earnings Breakdown (100% / 5% / 95%)</h2>
        <p className="provider-hint">Completed paid jobs credit 95% net earnings directly to your wallet. Refunds and late cancellation fees are itemized automatically.</p>
        <DataTable columns={columns} data={jobs} keyField="id" emptyMessage="No booking payments yet." />
      </div>

      <div className="card provider-stack">
        <h2>Wallet Transaction History</h2>
        <DataTable columns={txnColumns} data={wallet?.transactions || []} keyField="id" emptyMessage="No wallet transactions yet." />
      </div>
    </div>
  );
}

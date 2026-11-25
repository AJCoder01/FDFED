import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import {
  fetchWallet,
  selectFinanceError,
  selectFinanceLoading,
  selectWallet,
  topUpWallet,
} from '../../store/slices/financeSlice';
import {
  fetchBookings,
  selectBookings,
} from '../../store/slices/bookingsSlice';
import { platformFee, netPayout } from '../../data/bookingRules';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { formatTimestamp } from '../../utils/date';

export function CustomerWalletPage() {
  const dispatch = useDispatch();
  const { currentUser, showToast } = useApp();

  const refresh = useCallback(() => {
    dispatch(fetchWallet());
    if (currentUser?.id) {
      dispatch(fetchBookings({ role: 'customer', userId: currentUser.id }));
    }
  }, [dispatch, currentUser?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const wallet = useSelector(selectWallet);
  const bookings = useSelector(selectBookings);
  const loading = useSelector(selectFinanceLoading);
  const error = useSelector(selectFinanceError);

  const [topUpAmount, setTopUpAmount] = useState('1000');
  const [topUpMethod, setTopUpMethod] = useState('UPI (Mock Top-Up)');
  const [busy, setBusy] = useState(false);

  const handleTopUp = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await dispatch(topUpWallet({ amount: Number(topUpAmount), method: topUpMethod })).unwrap();
      showToast(`₹${Number(topUpAmount).toLocaleString('en-IN')} added to your ServiceHub Wallet.`, 'success');
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Unable to add funds.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error && !wallet) return <ErrorState description={error} onRetry={refresh} />;
  if (loading && !wallet) return <Skeleton height="360px" borderRadius="12px" />;

  const transactions = wallet?.transactions || [];
  const totalSpent = bookings
    .filter((b) => ['Paid', 'Completed', 'Partially Refunded'].includes(b.paymentStatus))
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalRefunds = bookings.reduce((sum, b) => sum + Number(b.refundedAmount || 0), 0);
  const totalPlatformFees = bookings
    .filter((b) => ['Paid', 'Completed', 'Partially Refunded'].includes(b.paymentStatus))
    .reduce((sum, b) => sum + platformFee(b), 0);

  const bookingColumns = [
    { header: 'Booking ID', accessor: 'id', render: (row) => <strong>#{row.id}</strong> },
    { header: 'Service', accessor: 'serviceTitle' },
    { header: 'Total Paid', render: (row) => <strong>₹{row.amount}</strong> },
    { header: 'Provider Share (95%)', render: (row) => <span style={{ color: 'var(--color-success)' }}>₹{netPayout(row)}</span> },
    { header: 'Platform Fee (5%)', render: (row) => <span>₹{platformFee(row)}</span> },
    { header: 'Refunded', render: (row) => <span>₹{row.refundedAmount || 0}</span> },
    {
      header: 'Payment Status',
      render: (row) => (
        <StatusBadge
          status={row.paymentStatus === 'Paid' ? 'approved' : row.paymentStatus === 'Refunded' ? 'cancelled' : 'pending'}
          label={row.paymentStatus === 'Paid' ? 'Successful' : row.paymentStatus}
        />
      ),
    },
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
    { header: 'Status', render: (row) => <StatusBadge status={row.status === 'Successful' ? 'approved' : row.status === 'Refunded' ? 'info' : 'pending'} label={row.status} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Customer Wallet & Payment Breakdown</h1>
        <p className="page-subtitle">Manage wallet balance, inspect 95% provider / 5% platform fee distribution, and track refunds</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid-cols-4">
        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>CURRENT WALLET BALANCE</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-primary)', marginTop: '4px' }}>
            ₹{(wallet?.walletBalance ?? 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Available for instant booking pay</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>TOTAL AMOUNT SPENT</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-ink)', marginTop: '4px' }}>
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Across {bookings.length} bookings</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>REFUNDS RECEIVED</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-success)', marginTop: '4px' }}>
            ₹{totalRefunds.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Credited to your wallet</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>PLATFORM FEES CHARGED (5%)</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-ink)', marginTop: '4px' }}>
            ₹{totalPlatformFees.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>95% paid to service providers</span>
        </div>
      </div>

      {/* Add Wallet Funds */}
      <form onSubmit={handleTopUp} className="card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
          <Wallet size={22} color="var(--color-primary)" />
          <div>
            <strong style={{ display: 'block', fontSize: '15px' }}>Add Money to ServiceHub Wallet</strong>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Use wallet funds at checkout or receive instant cancellation refunds here</span>
          </div>
        </div>
        <div style={{ width: '160px' }}>
          <TextField label="Amount (INR ₹)" type="number" min="1" max="100000" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} required disabled={busy} />
        </div>
        <div style={{ width: '200px' }}>
          <Select
            label="Method"
            value={topUpMethod}
            onChange={(e) => setTopUpMethod(e.target.value)}
            options={[
              { value: 'UPI (Mock Top-Up)', label: 'UPI Instant Top-Up' },
              { value: 'Debit Card (Mock)', label: 'Debit / Credit Card' },
            ]}
          />
        </div>
        <Button type="submit" icon={Plus} disabled={busy}>{busy ? 'Adding…' : 'Add Funds'}</Button>
      </form>

      {/* Booking-Wise Financial Breakdown */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--color-primary)" />
          <h2 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>Booking-Wise Payment Distribution (95% Provider / 5% Platform)</h2>
        </div>
        <DataTable columns={bookingColumns} data={bookings} keyField="id" emptyMessage="No booking payments recorded yet." />
      </div>

      {/* Wallet Transaction History */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>Wallet Transaction History</h2>
        <DataTable columns={txnColumns} data={transactions} keyField="id" emptyMessage="No wallet transactions yet." />
      </div>
    </div>
  );
}

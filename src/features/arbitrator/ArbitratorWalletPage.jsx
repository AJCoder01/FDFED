import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Wallet, ArrowDownLeft, ArrowUpRight, Award } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import {
  fetchWallet,
  selectFinanceError,
  selectFinanceLoading,
  selectWallet,
  withdrawWallet,
} from '../../store/slices/financeSlice';
import {
  fetchDisputes,
  selectDisputes,
} from '../../store/slices/governanceSlice';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { formatTimestamp } from '../../utils/date';

export function ArbitratorWalletPage() {
  const dispatch = useDispatch();
  const { currentUser, showToast } = useApp();

  const refresh = useCallback(() => {
    dispatch(fetchWallet());
    dispatch(fetchDisputes());
  }, [dispatch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const wallet = useSelector(selectWallet);
  const disputes = useSelector(selectDisputes);
  const loading = useSelector(selectFinanceLoading);
  const error = useSelector(selectFinanceError);

  const [withdrawAmount, setWithdrawAmount] = useState('250');
  const [busy, setBusy] = useState(false);

  const myRuledCases = disputes.filter(
    (d) => (d.arbitratorId === currentUser?.id || d.arbitratorId === 'user-arbit-1') && d.status === 'ruled',
  );

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await dispatch(withdrawWallet({ amount: Number(withdrawAmount), destination: 'Arbitrator Bank Account' })).unwrap();
      showToast(`₹${Number(withdrawAmount).toLocaleString('en-IN')} withdrawn successfully.`, 'success');
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Unable to process withdrawal.', 'warning');
    } finally {
      setBusy(false);
    }
  };

  if (error && !wallet) return <ErrorState description={error} onRetry={refresh} />;
  if (loading && !wallet) return <Skeleton height="340px" borderRadius="12px" />;

  const transactions = wallet?.transactions || [];
  const totalEarned = transactions
    .filter((t) => t.type === 'ARBITRATOR_FEE' && t.direction === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalAwardedToParties = myRuledCases.reduce((sum, d) => sum + Number(d.ruling?.awardAmount || 0), 0);

  const txnColumns = [
    { header: 'Time', render: (row) => <span style={{ fontSize: '12px' }}>{formatTimestamp(row.createdAt)}</span> },
    { header: 'Type', render: (row) => <strong style={{ fontSize: '12px' }}>{row.type.replaceAll('_', ' ')}</strong> },
    { header: 'Dispute / Ref', render: (row) => row.disputeId ? `#${row.disputeId}` : (row.bookingId ? `#${row.bookingId}` : 'Wallet') },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Arbitrator Wallet & Adjudication Earnings</h1>
        <p className="page-subtitle">Track dispute adjudication honorariums, withdrawals, and ruled case awards</p>
      </div>

      <div className="grid-cols-4">
        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>AVAILABLE WALLET BALANCE</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-primary)', marginTop: '4px' }}>
            ₹{(wallet?.walletBalance ?? 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Ready for payout</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>TOTAL ARBITRATION EARNINGS</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-success)', marginTop: '4px' }}>
            ₹{totalEarned.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>₹250 per ruled case</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>CASES ADJUDICATED</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-ink)', marginTop: '4px' }}>
            {myRuledCases.length}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Formal rulings issued</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>TOTAL AWARDS ISSUED</span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-conflict)', marginTop: '4px' }}>
            ₹{totalAwardedToParties.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Across settled disputes</span>
        </div>
      </div>

      <form onSubmit={handleWithdraw} className="card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
          <Wallet size={22} color="var(--color-primary)" />
          <div>
            <strong style={{ display: 'block', fontSize: '15px' }}>Withdraw Arbitration Earnings</strong>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Transfer available adjudication fees to your linked bank account (demo)</span>
          </div>
        </div>
        <div style={{ width: '180px' }}>
          <TextField label="Withdrawal Amount (₹)" type="number" min="1" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required disabled={busy} />
        </div>
        <Button type="submit" icon={Award} disabled={busy || (wallet?.walletBalance ?? 0) <= 0}>
          {busy ? 'Processing…' : 'Withdraw Funds'}
        </Button>
      </form>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>Arbitrator Transaction History</h2>
        <DataTable columns={txnColumns} data={transactions} keyField="id" emptyMessage="No arbitrator transactions recorded yet." />
      </div>
    </div>
  );
}

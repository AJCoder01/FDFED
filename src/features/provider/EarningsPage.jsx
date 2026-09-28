import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, ArrowUpRight, TrendingUp, ShieldCheck } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { getBookings } from '../../data/mockRepository';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';

export function EarningsPage() {
  const { currentUser } = useApp();
  const [completedJobs, setCompletedJobs] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (currentUser) {
        const list = await getBookings('provider', currentUser.id);
        setCompletedJobs(list.filter(j => j.status === 'completed' || j.paymentStatus === 'Paid'));
      }
    }
    loadData();
  }, [currentUser]);

  const grossEarnings = completedJobs.reduce((sum, j) => sum + (j.amount || 0), 0);
  const totalPlatformFees = completedJobs.reduce((sum, j) => {
    const fee = j.platformFee !== undefined ? j.platformFee : Math.round((j.amount || 0) * 0.05);
    return sum + fee;
  }, 0);
  const netEarnings = grossEarnings - totalPlatformFees;

  const columns = [
    { header: 'Job ID', accessor: 'id', render: (row) => <strong>#{row.id}</strong> },
    { header: 'Service Title', accessor: 'serviceTitle' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Date', accessor: 'scheduledDate' },
    { header: 'Gross Price', accessor: 'amount', render: (row) => <span>₹{row.amount}</span> },
    { 
      header: '5% ServiceHub Fee', 
      accessor: 'platformFee', 
      render: (row) => {
        const fee = row.platformFee !== undefined ? row.platformFee : Math.round(row.amount * 0.05);
        return <span style={{ color: '#DC2626', fontSize: '12px', fontWeight: '600' }}>-₹{fee}</span>;
      }
    },
    { 
      header: 'Net Credited Payout', 
      accessor: 'netPayout', 
      render: (row) => {
        const fee = row.platformFee !== undefined ? row.platformFee : Math.round(row.amount * 0.05);
        const payout = row.netPayout !== undefined ? row.netPayout : (row.amount - fee);
        return <strong style={{ color: 'var(--color-success)', fontSize: '14px' }}>₹{payout}</strong>;
      }
    },
    { header: 'Payout Status', accessor: 'paymentStatus', render: () => <StatusBadge status="completed" label="Released to Wallet" /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Provider Earnings & Wallet Payouts</h1>
        <p className="page-subtitle">Itemized revenue ledger for completed service bookings after 5% platform fee deduction</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>NET CREDITED EARNINGS</span>
          <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--color-success)', marginTop: '4px' }}>₹{netEarnings.toLocaleString()}</div>
          <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: '600' }}>95% payout credited to wallet</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #2563EB' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>GROSS SERVICE REVENUE</span>
          <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--color-ink)', marginTop: '4px' }}>₹{grossEarnings.toLocaleString()}</div>
          <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: '600' }}>Total customer payments</span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #EF4444' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>5% PLATFORM COMMISSIONS</span>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#DC2626', marginTop: '4px' }}>-₹{totalPlatformFees.toLocaleString()}</div>
          <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: '600' }}>Platform marketplace fee</span>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '16px' }}>Completed Payout History</h2>
        <DataTable columns={columns} data={completedJobs} keyField="id" emptyMessage="No completed payouts yet." />
      </div>
    </div>
  );
}

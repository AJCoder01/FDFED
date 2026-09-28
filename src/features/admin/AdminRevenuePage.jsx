import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Users, PieChart, Search, Filter, ShieldCheck, ArrowUpRight, Download, Info, CheckCircle2, Eye, X } from 'lucide-react';
import { getRevenueStats, getBookings } from '../../data/mockRepository';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Modal } from '../../design-system/primitives/Modal';

export function AdminRevenuePage() {
  const [stats, setStats] = useState({
    gmv: 0,
    totalRevenue: 0,
    totalNetPayouts: 0,
    transactionCount: 0,
    avgFeePerBooking: 0,
    categoryBreakdown: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTxn, setSelectedTxn] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const data = await getRevenueStats();
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter transactions
  const filteredTransactions = stats.recentTransactions.filter(txn => {
    const matchesSearch = 
      txn.id.toLowerCase().includes(search.toLowerCase()) ||
      txn.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      txn.providerName?.toLowerCase().includes(search.toLowerCase()) ||
      txn.serviceTitle?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'Paid' && (txn.paymentStatus === 'Paid' || txn.status === 'completed' || txn.status === 'active')) ||
      (statusFilter === 'Disputed' && txn.status === 'disputed');

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Transaction ID',
      accessor: 'id',
      render: (row) => (
        <div>
          <strong style={{ color: 'var(--color-primary)' }}>#{row.id}</strong>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{row.createdAt}</div>
        </div>
      )
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600', color: 'var(--color-ink)' }}>{row.customerName}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{row.customerPhone}</div>
        </div>
      )
    },
    {
      header: 'Service & Provider',
      accessor: 'serviceTitle',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600', color: 'var(--color-ink)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.serviceTitle}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{row.providerName}</div>
        </div>
      )
    },
    {
      header: 'Gross Amount',
      accessor: 'amount',
      render: (row) => <span style={{ fontWeight: '700', color: 'var(--color-ink)' }}>₹{row.amount}</span>
    },
    {
      header: '5% Platform Fee',
      accessor: 'platformFee',
      render: (row) => {
        const fee = row.platformFee !== undefined ? row.platformFee : Math.round(row.amount * 0.05);
        return (
          <span style={{ fontWeight: '800', color: '#059669', backgroundColor: '#ECFDF5', padding: '4px 8px', borderRadius: '6px' }}>
            +₹{fee}
          </span>
        );
      }
    },
    {
      header: 'Net Provider Payout',
      accessor: 'netPayout',
      render: (row) => {
        const fee = row.platformFee !== undefined ? row.platformFee : Math.round(row.amount * 0.05);
        const payout = row.netPayout !== undefined ? row.netPayout : (row.amount - fee);
        return <span style={{ fontWeight: '600', color: 'var(--color-ink-secondary)' }}>₹{payout}</span>;
      }
    },
    {
      header: 'Payment Method',
      accessor: 'paymentMethod',
      render: (row) => <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{row.paymentMethod || 'UPI'}</span>
    },
    {
      header: 'Status',
      accessor: 'paymentStatus',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Action',
      accessor: 'actions',
      render: (row) => (
        <Button variant="outline" size="sm" icon={Eye} onClick={() => setSelectedTxn(row)}>
          Details
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">Revenue & Financial Ledger</h1>
            <span style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> 5% Commission Model
            </span>
          </div>
          <p className="page-subtitle">Platform revenue accounting, booking fees, gross marketplace value (GMV), and provider payout disbursements</p>
        </div>
      </div>

      {/* Revenue Rule Banner */}
      <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', padding: '16px 20px', borderRadius: 'var(--radius-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#0284C7', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0369A1' }}>ServiceHub Platform Fee Structure</div>
            <div style={{ fontSize: '12px', color: '#075985', marginTop: '2px' }}>
              ServiceHub automatically retains a <strong>5% platform booking fee</strong> on all customer paid bookings. The remaining <strong>95% net amount</strong> is directly credited to provider wallets upon job completion.
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid-cols-4">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #10B981' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>TOTAL PLATFORM REVENUE (5%)</span>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
              ₹{stats.totalRevenue.toLocaleString()}
            </div>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>Earned from booking fees</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #2563EB' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>GROSS BOOKING VALUE (GMV)</span>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-ink)', marginTop: '2px' }}>
              ₹{stats.gmv.toLocaleString()}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Total transaction volume</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F5F3FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>NET PROVIDER PAYOUTS (95%)</span>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-ink)', marginTop: '2px' }}>
              ₹{stats.totalNetPayouts.toLocaleString()}
            </div>
            <span style={{ fontSize: '11px', color: '#6D28D9', fontWeight: '600' }}>Released to service providers</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieChart size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>AVG FEE PER BOOKING</span>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-ink)', marginTop: '2px' }}>
              ₹{stats.avgFeePerBooking}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Across {stats.transactionCount} bookings</span>
          </div>
        </div>
      </div>

      {/* Category Revenue Breakdown */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '16px' }}>Revenue Breakdown by Category</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {stats.categoryBreakdown.map((cat, idx) => (
            <div key={idx} style={{ padding: '16px', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>{cat.category}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-muted)' }}>GMV Volume:</span>
                <strong style={{ color: 'var(--color-ink)' }}>₹{cat.gmv}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-muted)' }}>Platform Fee (5%):</span>
                <strong style={{ color: '#059669' }}>+₹{cat.revenue}</strong>
              </div>
              <div style={{ marginTop: '8px', backgroundColor: '#E2E8F0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${stats.gmv > 0 ? (cat.gmv / stats.gmv) * 100 : 0}%`, height: '100%', backgroundColor: 'var(--color-primary)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)' }}>Transactions & Platform Revenue Ledger</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>All processed customer bookings with 5% platform fee itemization</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ minWidth: '220px' }}>
              <TextField
                placeholder="Search Booking ID, Provider, Customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'Paid', label: 'Paid / Completed' },
                { value: 'Disputed', label: 'Disputed' }
              ]}
            />
          </div>
        </div>

        <DataTable columns={columns} data={filteredTransactions} keyField="id" emptyMessage="No transactions matching filters." />
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <Modal isOpen={Boolean(selectedTxn)} onClose={() => setSelectedTxn(null)} title={`Transaction Audit Details #${selectedTxn.id}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted)' }}>Service Booked:</span>
                <strong>{selectedTxn.serviceTitle}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted)' }}>Customer:</span>
                <span>{selectedTxn.customerName} ({selectedTxn.customerPhone})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted)' }}>Provider:</span>
                <span>{selectedTxn.providerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted)' }}>Date & Slot:</span>
                <span>{selectedTxn.scheduledDate} ({selectedTxn.scheduledSlot})</span>
              </div>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '4px' }}>Financial Itemization</h4>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Gross Booking Price Paid by Customer:</span>
                <strong style={{ fontSize: '15px' }}>₹{selectedTxn.amount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: '700' }}>
                <span>Less: ServiceHub Platform Booking Fee (5%):</span>
                <span>-₹{selectedTxn.platformFee !== undefined ? selectedTxn.platformFee : Math.round(selectedTxn.amount * 0.05)}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed var(--color-border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)', fontWeight: '800', fontSize: '16px' }}>
                <span>Net Credited to Provider Wallet (95%):</span>
                <span>₹{selectedTxn.netPayout !== undefined ? selectedTxn.netPayout : (selectedTxn.amount - Math.round(selectedTxn.amount * 0.05))}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-muted)' }}>
              <span>Payment Gateway Mode: {selectedTxn.paymentMethod || 'UPI Instant Pay'}</span>
              <span>Status: <strong style={{ textTransform: 'capitalize' }}>{selectedTxn.status}</strong></span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => setSelectedTxn(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

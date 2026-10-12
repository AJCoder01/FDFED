import { useCallback } from 'react';
import { useApp } from '../../app/context/AppContext';
import { getBookings } from '../../data/mockRepository';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { isPaid, money, netPayout, platformFee } from './providerUtils';

export function EarningsPage() {
  const { currentUser } = useApp();
  const load = useCallback(() => getBookings('provider', currentUser.id), [currentUser.id]);
  const { data: jobs, loading, error, refresh } = useRepositoryQuery(load);

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="300px" borderRadius="12px" />;
  const paid = jobs.filter(isPaid);
  const payments = jobs.filter(job => isPaid(job) || job.paymentStatus === 'Refunded');
  const completed = paid.filter(job => job.status === 'completed');
  const pending = paid.filter(job => ['active', 'in_progress', 'reschedule_proposed'].includes(job.status));
  const held = paid.filter(job => !['completed', 'active', 'in_progress', 'reschedule_proposed'].includes(job.status));
  const sumPayout = list => list.reduce((sum, job) => sum + netPayout(job), 0);
  const stats = [
    ['COMPLETED NET EARNINGS', sumPayout(completed)],
    ['PENDING NET EARNINGS', sumPayout(pending)],
    ['DISPUTED / HELD PAYMENTS', sumPayout(held)],
    ['GROSS CUSTOMER PAYMENTS', payments.reduce((sum, job) => sum + Number(job.amount), 0)],
    ['REFUNDED CUSTOMER PAYMENTS', jobs.reduce((sum, job) => sum + Number(job.refundedAmount || 0), 0)],
    ['PLATFORM FEES ON PAID BOOKINGS', paid.reduce((sum, job) => sum + platformFee(job), 0)]
  ];
  const columns = [
    { header: 'Job ID', accessor: 'id', render: row => <strong>#{row.id}</strong> },
    { header: 'Service', accessor: 'serviceTitle' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Date', accessor: 'scheduledDate' },
    { header: 'Gross Price', render: row => money(row.amount) },
    { header: 'Platform Fee (5%)', render: row => money(platformFee(row)) },
    { header: 'Net Amount', render: row => money(netPayout(row)) },
    { header: 'Job Status', render: row => <StatusBadge status={row.status} /> },
    { header: 'Refunded', render: row => money(row.refundedAmount || 0) },
    { header: 'Payment Status', accessor: 'paymentStatus' }
  ];

  return (
    <div className="provider-page">
      <div className="page-header">
        <h1 className="page-title">Provider Earnings & Payments</h1>
        <p className="page-subtitle">Booking amounts after the 5% platform fee. Refunds and cash payments are recorded in the demo ledger.</p>
      </div>
      <div className="provider-stats">
        {stats.map(([label, value]) => <div className="card" key={label}><span className="provider-hint">{label}</span><div className="provider-stat-value">{money(value)}</div></div>)}
      </div>
      <div className="card provider-stack">
        <h2>Booking Payment History</h2>
        <p className="provider-hint">Completed paid jobs count as earned. Active jobs are pending; disputed and cancelled payments are shown separately. Refunds reduce the retained payment and platform fee.</p>
        <DataTable columns={columns} data={jobs} keyField="id" emptyMessage="No booking payments yet." />
      </div>
    </div>
  );
}

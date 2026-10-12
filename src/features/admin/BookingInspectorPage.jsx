import { useCallback } from 'react';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { getBookings } from '../../data/mockRepository';
import { netPayout, platformFee } from '../../data/bookingRules';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';

export function BookingInspectorPage() {
  const load = useCallback(() => getBookings('admin'), []);
  const { data: bookings, loading, error, refresh } = useRepositoryQuery(load);
  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="300px" />;

  const columns = [
    { header: 'Booking ID', accessor: 'id', render: (row) => <strong>#{row.id}</strong> },
    { header: 'Service Title', accessor: 'serviceTitle' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Provider', accessor: 'providerName' },
    { header: 'Scheduled Date', accessor: 'scheduledDate' },
    { header: 'Gross Amount', accessor: 'amount', render: (row) => <strong>₹{row.amount}</strong> },
    { 
      header: '5% Platform Fee', 
      accessor: 'platformFee', 
      render: (row) => {
        return <span style={{ color: '#059669', fontWeight: '700' }}>+₹{platformFee(row)}</span>;
      }
    },
    { 
      header: 'Provider Payout', 
      accessor: 'netPayout', 
      render: (row) => {
        return <span style={{ color: 'var(--color-muted)' }}>₹{netPayout(row)}</span>;
      }
    },
    { header: 'Refunded', render: row => `₹${row.refundedAmount || 0}` },
    { header: 'Payment', accessor: 'paymentStatus' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Booking Inspector</h1>
        <p className="page-subtitle">Platform-wide inspection of active, completed, and disputed bookings</p>
      </div>

      <div className="card">
        <DataTable columns={columns} data={bookings} keyField="id" />
      </div>
    </div>
  );
}

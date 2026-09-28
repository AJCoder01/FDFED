import React, { useState, useEffect } from 'react';
import { getBookings } from '../../data/mockRepository';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';

export function BookingInspectorPage() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    async function loadData() {
      const list = await getBookings('admin');
      setBookings(list);
    }
    loadData();
  }, []);

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
        const fee = row.platformFee !== undefined ? row.platformFee : Math.round(row.amount * 0.05);
        return <span style={{ color: '#059669', fontWeight: '700' }}>+₹{fee}</span>;
      }
    },
    { 
      header: 'Provider Payout', 
      accessor: 'netPayout', 
      render: (row) => {
        const fee = row.platformFee !== undefined ? row.platformFee : Math.round(row.amount * 0.05);
        return <span style={{ color: 'var(--color-muted)' }}>₹{row.amount - fee}</span>;
      }
    },
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

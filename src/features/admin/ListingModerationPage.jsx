import React, { useState, useEffect } from 'react';
import { getServices } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';

export function ListingModerationPage() {
  const { showToast } = useApp();
  const [services, setServices] = useState([]);

  useEffect(() => {
    async function loadData() {
      const list = await getServices();
      setServices(list);
    }
    loadData();
  }, []);

  const handleToggleStatus = (srvId, currentStatus) => {
    const nextStatus = currentStatus === 'published' ? 'paused' : 'published';
    setServices(services.map(s => s.id === srvId ? { ...s, status: nextStatus } : s));
    showToast(`Listing status updated to ${nextStatus.toUpperCase()}`, 'success');
  };

  const columns = [
    { header: 'Title', accessor: 'title', render: (row) => <strong>{row.title}</strong> },
    { header: 'Category', accessor: 'categoryName' },
    { header: 'Provider', accessor: 'providerName' },
    { header: 'Price (INR)', accessor: 'price', render: (row) => <span>₹{row.price}</span> },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Moderate',
      accessor: 'id',
      render: (row) => (
        <Button variant={row.status === 'published' ? 'danger' : 'success'} size="sm" onClick={() => handleToggleStatus(row.id, row.status)}>
          {row.status === 'published' ? 'Pause Listing' : 'Approve & Publish'}
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Listing Moderation</h1>
        <p className="page-subtitle">Inspect and control published marketplace service listings</p>
      </div>

      <div className="card">
        <DataTable columns={columns} data={services} keyField="id" />
      </div>
    </div>
  );
}

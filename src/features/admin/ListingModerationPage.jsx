import { useCallback, useState } from 'react';
import { getServices, saveService } from '../../data/mockRepository';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { useApp } from '../../app/context/AppContext';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';

export function ListingModerationPage() {
  const { showToast } = useApp();
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => getServices({ role: 'admin' }), []);
  const { data: services, loading, error, refresh } = useRepositoryQuery(load);
  const handleToggleStatus = async (id, currentStatus) => {
    if (busy) return;
    setBusy(true);
    try {
      const status = currentStatus === 'published' ? 'paused' : 'published';
      await saveService({ id, status }, { role: 'admin' });
      showToast(`Listing ${status}.`);
    } catch (error) { showToast(error.message, 'error'); }
    finally { setBusy(false); }
  };
  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="300px" />;

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
        <Button disabled={busy} variant={row.status === 'published' ? 'danger' : 'success'} size="sm" onClick={() => handleToggleStatus(row.id, row.status)}>
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

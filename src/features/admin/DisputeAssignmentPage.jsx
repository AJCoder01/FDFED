import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { getDisputes, assignDispute } from '../../data/mockRepository';
import { DEMO_USERS } from '../../data/mockData';
import { useApp } from '../../app/context/AppContext';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';

export function DisputeAssignmentPage() {
  const { showToast } = useApp();
  const { data: disputes, loading, error, refresh } = useRepositoryQuery(getDisputes);
  const [busy, setBusy] = useState(false);

  const handleAssign = async id => {
    if (busy) return;
    setBusy(true);
    try { await assignDispute(id, DEMO_USERS.arbitrator); showToast('Arbitrator assignment saved.'); }
    catch (error) { showToast(error.message, 'warning'); }
    finally { setBusy(false); }
  };
  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <p>Loading cases…</p>;

  const columns = [
    { header: 'Case ID', accessor: 'id', render: (row) => <strong>#{row.id}</strong> },
    { header: 'Booking ID', accessor: 'bookingId' },
    { header: 'Claim Amount', accessor: 'claimAmount', render: (row) => <strong style={{ color: 'var(--color-conflict)' }}>₹{row.claimAmount}</strong> },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Provider', accessor: 'providerName' },
    { header: 'Assigned Arbitrator', accessor: 'arbitratorName', render: (row) => row.arbitratorName || <em>Unassigned</em> },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Action',
      accessor: 'id',
      render: (row) => (
        <Button disabled={busy || row.status === 'ruled'} variant="primary" size="sm" icon={UserCheck} onClick={() => handleAssign(row.id)}>
          Assign Arbitrator
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Arbitrator Dispute Case Assignment</h1>
        <p className="page-subtitle">Review escalated customer-provider disputes and assign an independent Arbitrator</p>
      </div>

      <div className="card">
        <DataTable columns={columns} data={disputes} keyField="id" />
      </div>
    </div>
  );
}

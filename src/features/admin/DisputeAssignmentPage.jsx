import React, { useState, useEffect } from 'react';
import { Gavel, UserCheck } from 'lucide-react';
import { getDisputes, assignDispute } from '../../data/mockRepository';
import { DEMO_USERS } from '../../data/mockData';
import { useApp } from '../../app/context/AppContext';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';

export function DisputeAssignmentPage() {
  const { showToast } = useApp();
  const [disputes, setDisputes] = useState([]);

  const loadData = async () => {
    const list = await getDisputes();
    setDisputes(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (disputeId) => {
    await assignDispute(disputeId, DEMO_USERS.arbitrator);
    await loadData();
    showToast(`Dispute Case #${disputeId} assigned to Arbitrator ${DEMO_USERS.arbitrator.name}!`, 'success');
  };

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
        <Button variant="primary" size="sm" icon={UserCheck} onClick={() => handleAssign(row.id)}>
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

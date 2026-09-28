import React, { useState } from 'react';
import { Users, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { TextField } from '../../design-system/primitives/TextField';

export function ProviderModerationPage() {
  const { showToast } = useApp();

  const [providers, setProviders] = useState([
    {
      id: 'user-prov-1',
      name: 'Rajesh Kumar',
      businessName: 'Apex Fix Services & Repairs',
      status: 'approved',
      serviceArea: 'Bengaluru Urban',
      skills: 'AC Maintenance, Electrical',
      appliedDate: '2026-08-01'
    },
    {
      id: 'user-prov-2',
      name: 'Sunil Verma',
      businessName: 'Quick Clean Express',
      status: 'submitted',
      serviceArea: 'Mumbai Suburbs',
      skills: 'Home Cleaning',
      appliedDate: '2026-08-15'
    }
  ]);

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [auditReason, setAuditReason] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState('approve'); // approve, reject, changes

  const handleActionClick = (prov, action) => {
    setSelectedProvider(prov);
    setActionType(action);
    setAuditReason('');
    setModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (!auditReason) {
      showToast('Please enter an audit reason note.', 'warning');
      return;
    }

    const newStatus = actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'changes_requested';
    setProviders(providers.map(p => p.id === selectedProvider.id ? { ...p, status: newStatus } : p));
    setModalOpen(false);
    showToast(`Provider ${selectedProvider.businessName} updated to ${newStatus.toUpperCase()}!`, 'success');
  };

  const columns = [
    { header: 'Business Name', accessor: 'businessName', render: (row) => <strong>{row.businessName}</strong> },
    { header: 'Applicant', accessor: 'name' },
    { header: 'Service Area', accessor: 'serviceArea' },
    { header: 'Skills', accessor: 'skills' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button variant="success" size="sm" onClick={() => handleActionClick(row, 'approve')}>Approve</Button>
          <Button variant="danger" size="sm" onClick={() => handleActionClick(row, 'reject')}>Reject</Button>
          <Button variant="outline" size="sm" onClick={() => handleActionClick(row, 'changes')}>Request Changes</Button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Provider Moderation Queue</h1>
        <p className="page-subtitle">Review, approve, or reject business onboarding applications with audit logs</p>
      </div>

      <div className="card">
        <DataTable columns={columns} data={providers} keyField="id" />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Audit Decision: ${actionType.toUpperCase()}`}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant={actionType === 'reject' ? 'danger' : 'primary'} onClick={handleConfirmAction}>
              Confirm Audit Decision
            </Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-ink)' }}>
            Target Provider: <strong>{selectedProvider?.businessName}</strong>
          </p>
          <TextField
            label="Mandatory Audit Reason / Feedback Note"
            value={auditReason}
            onChange={(e) => setAuditReason(e.target.value)}
            placeholder="Explain why this decision was taken for compliance records..."
            multiline
            rows={3}
            required
          />
        </div>
      </Modal>
    </div>
  );
}

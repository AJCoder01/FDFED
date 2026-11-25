import { ErrorState } from '../../design-system/primitives/ErrorState';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  fetchTickets,
  resolveTicket,
  selectGovernanceError,
  selectGovernanceLoading,
  selectTickets,
} from '../../store/slices/governanceSlice';
import { useApp } from '../../app/context/AppContext';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { Select } from '../../design-system/primitives/Select';

export function TicketResolutionPage() {
  const dispatch = useDispatch();
  const { showToast } = useApp();

  const refresh = useCallback(() => {
    dispatch(fetchTickets({ role: 'admin' }));
  }, [dispatch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const tickets = useSelector(selectTickets);
  const loading = useSelector(selectGovernanceLoading);
  const error = useSelector(selectGovernanceError);
  const [busy, setBusy] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [outcome, setOutcome] = useState('Full Mock Refund Issued');
  const [modalOpen, setModalOpen] = useState(false);

  const handleResolveClick = (tck) => {
    setSelectedTicket(tck);
    setModalOpen(true);
  };

  const handleConfirmResolve = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await dispatch(resolveTicket({ ticketId: selectedTicket.id, outcome })).unwrap();
      setModalOpen(false);
      showToast('Ticket resolution saved.');
    }
    catch (err) { showToast(typeof err === 'string' ? err : err?.message, 'warning'); }
    finally { setBusy(false); }
  };
  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading && tickets.length === 0) return <p>Loading tickets…</p>;

  const columns = [
    { header: 'Ticket ID', accessor: 'id', render: (row) => <strong>#{row.id}</strong> },
    { header: 'Booking ID', accessor: 'bookingId' },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Issue Type', accessor: 'issueType' },
    { header: 'Severity', accessor: 'severity' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Action',
      accessor: 'id',
      render: (row) => row.status !== 'resolved' ? (
        <Button variant="primary" size="sm" onClick={() => handleResolveClick(row)}>Triage & Resolve</Button>
      ) : (
        <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: '600' }}>Resolved</span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Support Ticket Triage & Resolution</h1>
        <p className="page-subtitle">Resolve service complaints with mock refunds, redo requests, or arbitration</p>
      </div>

      <div className="card">
        <DataTable columns={columns} data={tickets} keyField="id" />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => { if (!busy) setModalOpen(false); }}
        title={`Resolve Support Ticket #${selectedTicket?.id}`}
        footer={(
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button disabled={busy} variant="success" onClick={handleConfirmResolve}>Enforce Resolution Outcome</Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <strong>Complaint:</strong> {selectedTicket?.description}
          </div>

          <Select
            label="Resolution Outcome"
            disabled={busy}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            options={[
              { value: 'Full Mock Refund Issued', label: 'Full Mock Refund Issued (100% money back)' },
              { value: 'Partial Refund (50%)', label: 'Partial Refund (50% credit)' },
              { value: 'Redo Service Requested', label: 'Request Redo Service (appointment to be agreed)' },
              { value: 'Formal Warning Issued to Provider', label: 'Formal Warning Issued to Provider' },
              { value: 'Escalated to Arbitration', label: 'Escalate to Formal Arbitration' },
              { value: 'Other Resolution Outcome', label: 'Other' }
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

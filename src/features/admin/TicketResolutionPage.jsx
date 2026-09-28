import React, { useState, useEffect } from 'react';
import { Headphones, CheckCircle2 } from 'lucide-react';
import { getTickets, resolveTicket } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { Select } from '../../design-system/primitives/Select';

export function TicketResolutionPage() {
  const { showToast } = useApp();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [outcome, setOutcome] = useState('Full Mock Refund Issued');
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = async () => {
    const list = await getTickets();
    setTickets(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveClick = (tck) => {
    setSelectedTicket(tck);
    setModalOpen(true);
  };

  const handleConfirmResolve = async () => {
    await resolveTicket(selectedTicket.id, outcome);
    setModalOpen(false);
    await loadData();
    showToast(`Ticket #${selectedTicket.id} resolved with outcome: "${outcome}"`, 'success');
  };

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
        <p className="page-subtitle">Resolve routine service complaints with mock refunds or redo orders</p>
      </div>

      <div className="card">
        <DataTable columns={columns} data={tickets} keyField="id" />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Resolve Support Ticket #${selectedTicket?.id}`}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="success" onClick={handleConfirmResolve}>Enforce Resolution Outcome</Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <strong>Complaint:</strong> {selectedTicket?.description}
          </div>

          <Select
            label="Resolution Outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            options={[
              { value: 'Full Mock Refund Issued', label: 'Full Mock Refund Issued (100% money back)' },
              { value: 'Partial Refund (50%)', label: 'Partial Refund (50% credit)' },
              { value: 'Free Redo Service Scheduled', label: 'Free Redo Service Scheduled with top technician' },
              { value: 'Formal Warning Issued to Provider', label: 'Formal Warning Issued to Provider' },
              { value: 'Escalated to Arbitration', label: 'Escalate to Formal Arbitration' }
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

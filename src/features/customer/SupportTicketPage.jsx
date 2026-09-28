import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HelpCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getTickets, createTicket } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';

export function SupportTicketPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId') || 'BK-89021';
  const { currentUser, showToast } = useApp();

  const [tickets, setTickets] = useState([]);
  const [issueType, setIssueType] = useState('Service Quality Issue');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function loadTickets() {
      const list = await getTickets();
      setTickets(list);
    }
    loadTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description) {
      showToast('Please enter a description of the issue.', 'warning');
      return;
    }

    const created = await createTicket({
      bookingId: bookingIdParam,
      serviceTitle: 'Home Service',
      customerId: currentUser.id,
      customerName: currentUser.name,
      providerName: 'Assigned Provider',
      issueType: issueType,
      severity: severity,
      description: description
    });

    setTickets([created, ...tickets]);
    setDescription('');
    showToast(`Support Ticket #${created.id} opened successfully!`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Help & Support Tickets</h1>
        <p className="page-subtitle">Report service issues to platform operations for routine resolution or refunds</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-cols-2">
        {/* Create Ticket Form */}
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Open a Support Ticket</h2>
          
          <TextField
            label="Associated Booking ID"
            value={bookingIdParam}
            disabled
          />

          <Select
            label="Issue Category"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            options={[
              { value: 'Service Quality Issue', label: 'Service Quality Issue' },
              { value: 'Late Technician Arrival', label: 'Late Technician Arrival' },
              { value: 'Damage / Spill Claim', label: 'Damage / Spill Claim' },
              { value: 'Incorrect Billing', label: 'Incorrect Billing' },
            ]}
          />

          <Select
            label="Issue Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            options={[
              { value: 'Low', label: 'Low - Minor inconvenience' },
              { value: 'Medium', label: 'Medium - Incomplete work' },
              { value: 'High', label: 'High - Property damage / Urgent fix' },
            ]}
          />

          <TextField
            label="Detailed Description & Evidence Notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what went wrong and what resolution you expect..."
            multiline
            rows={4}
            required
          />

          <Button type="submit" variant="primary" fullWidth size="lg">
            Submit Support Ticket
          </Button>
        </form>

        {/* Existing Tickets List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Your Open & Past Tickets</h2>

          {tickets.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>No support tickets opened yet.</p>
          ) : (
            tickets.map((t) => (
              <div key={t.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>#{t.id}</strong>
                  <StatusBadge status={t.status} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>{t.issueType}</div>
                <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{t.description}</p>
                <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px' }}>
                  Booking: #{t.bookingId} | Opened: {t.createdAt}
                </div>
                {t.resolutionOutcome && (
                  <div style={{ fontSize: '12px', color: 'var(--color-success)', backgroundColor: 'var(--color-success-bg)', padding: '6px 10px', borderRadius: '4px', marginTop: '4px' }}>
                    <strong>Resolution:</strong> {t.resolutionOutcome}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

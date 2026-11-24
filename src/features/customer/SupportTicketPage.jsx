import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectTickets,
  selectSupportLoading,
  selectSupportError,
  fetchTicketsThunk,
  createTicketThunk,
} from '../../store/slices/supportSlice';
import {
  selectBookings,
  fetchBookingsThunk,
} from '../../store/slices/bookingsSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';

export function SupportTicketPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId') || '';
  const currentUser = useSelector(selectCurrentUser);
  const tickets = useSelector(selectTickets);
  const bookings = useSelector(selectBookings);
  const loading = useSelector(selectSupportLoading);
  const error = useSelector(selectSupportError);
  const { showToast } = useApp();

  const refresh = useCallback(() => {
    dispatch(fetchTicketsThunk());
    dispatch(fetchBookingsThunk());
  }, [dispatch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const [bookingId, setBookingId] = useState(bookingIdParam);
  useEffect(() => { setBookingId(bookingIdParam); }, [bookingIdParam]);
  const [issueType, setIssueType] = useState('Service Quality Issue');
  const [severity, setSeverity] = useState('Medium');
  const [busy, setBusy] = useState(false);
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!description) {
      showToast('Please enter a description of the issue.', 'warning');
      return;
    }

    setBusy(true);
    try {
      const created = await dispatch(createTicketThunk({
        bookingId,
        customerId: currentUser.id,
        issueType,
        severity,
        description
      })).unwrap();
      setDescription('');
      showToast(`Support Ticket #${created.id} opened.`, 'success');
    } catch (error) {
      showToast(error.message, 'warning');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading && tickets.length === 0) return <Skeleton height="300px" />;

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
          
          <Select
            label="Associated Booking ID"
            value={bookingId}
            onChange={event => setBookingId(event.target.value)}
            options={bookings.map(job => ({ value: job.id, label: `#${job.id} — ${job.serviceTitle}` }))}
            required
            disabled={busy}
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
              { value: 'Other', label: 'Other' },
            ]}
          />

          <Select
            label="Issue Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            options={[
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' }
            ]}
          />

          <TextField
            label="Detailed Description & Evidence Notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what went wrong, technician conduct, or requested remedy..."
            multiline
            rows={4}
            required
            disabled={busy}
          />

          <Button type="submit" variant="primary" fullWidth size="lg" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit Support Ticket'}
          </Button>
        </form>

        {/* Existing Tickets List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Your Tickets History</h2>
          
          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-muted)' }}>
              No support tickets filed yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tickets.map((t) => (
                <div key={t.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--color-ink)' }}>#{t.id}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>· Booking #{t.bookingId}</span>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>{t.issueType} ({t.severity})</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>"{t.description}"</div>

                  {t.resolutionOutcome && (
                    <div style={{ backgroundColor: 'var(--color-success-bg)', padding: '8px', borderRadius: '4px', fontSize: '12px', color: 'var(--color-ink)', marginTop: '4px' }}>
                      <strong>Resolution Outcome:</strong> {t.resolutionOutcome}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

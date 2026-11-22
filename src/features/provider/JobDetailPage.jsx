import { TimeProposalForm } from './TimeProposalForm';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Play } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  selectSelectedBooking,
  selectBookingsLoading,
  selectBookingsError,
  fetchBookingByIdThunk,
  updateBookingStatusThunk,
} from '../../store/slices/bookingsSlice';
import {
  selectDisputes,
  fetchDisputesThunk,
} from '../../store/slices/supportSlice';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { ProviderDisputeResponse } from './ProviderDisputeResponse';
import { JobRequestActions } from './JobRequestActions';
import { formatDate, formatTimestamp, isAccepted, isPaid, money, netPayout, platformFee } from './providerUtils';

export function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const rawJob = useSelector(selectSelectedBooking);
  const allDisputes = useSelector(selectDisputes);
  const loading = useSelector(selectBookingsLoading);
  const error = useSelector(selectBookingsError);
  const { showToast } = useApp();

  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const refresh = useCallback(() => {
    if (jobId) {
      dispatch(fetchBookingByIdThunk(jobId));
      dispatch(fetchDisputesThunk());
    }
  }, [jobId, dispatch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setNotes('');
    setActionError('');
  }, [jobId]);

  const job = rawJob && rawJob.providerId === currentUser?.id ? rawJob : null;
  const disputes = (allDisputes || []).filter(d => d.bookingId === job?.id && d.providerId === currentUser?.id);

  const changeStatus = async (event, action) => {
    event.preventDefault();
    if (busy) return;
    if (action === 'complete' && !notes.trim()) {
      setActionError('Enter completion notes before finishing the job.');
      return;
    }
    setBusy(true);
    setActionError('');
    try {
      const note = action === 'start' ? 'Provider started work at the service location.' : `Job completed. Notes: ${notes.trim()}`;
      const statusMap = { start: 'in_progress', complete: 'completed' };
      await dispatch(updateBookingStatusThunk({
        id: job.id,
        status: statusMap[action],
        note
      })).unwrap();
      setNotes('');
      showToast(action === 'start' ? 'Job started.' : 'Job marked completed. Earnings summary updated.');
    } catch (error) {
      setActionError(error.message);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading && !job) return <Skeleton height="400px" borderRadius="12px" />;
  if (!job) return <div className="provider-page"><p>Job not found or access restricted.</p></div>;

  return (
    <div className="provider-page">
      <button type="button" className="provider-link" onClick={() => navigate('/provider/jobs')}>
        <ArrowLeft size={16} /> Back to Job Inbox
      </button>

      <div className="card provider-row provider-between">
        <div className="provider-stack">
          <div className="provider-row">
            <h1>Job #{job.id}</h1>
            <StatusBadge status={job.status} label={job.status === 'active' ? (isAccepted(job) ? 'Accepted' : 'Awaiting Acceptance') : undefined} />
          </div>
          <p className="provider-hint">{job.serviceTitle} · {formatDate(job.scheduledDate)} at {job.scheduledSlot}</p>
        </div>
        <JobRequestActions job={job} onRefresh={refresh} />
      </div>

      <div className="grid-cols-2">
        <div className="card provider-stack">
          <h2>Job Progression</h2>
          <p className="provider-hint">Record on-site arrival and complete the service after customer inspection.</p>
          {job.status === 'active' && isAccepted(job) && (
            <Button icon={Play} disabled={busy} onClick={e => changeStatus(e, 'start')}>Start Job</Button>
          )}
          {job.status === 'in_progress' && (
            <form className="provider-stack" onSubmit={e => changeStatus(e, 'complete')}>
              <TextField
                name="completion-notes"
                label="Completion Notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe work completed, tests performed, customer sign-off…"
                multiline
                required
              />
              <Button icon={CheckCircle2} type="submit" disabled={busy || !notes.trim()}>Complete Job</Button>
            </form>
          )}
          {actionError && <p role="alert" className="provider-error">{actionError}</p>}
          <h3>Booking History</h3>
          <ul className="provider-timeline">
            {(job.timeline || []).map((t, idx) => (
              <li key={idx}><strong>{t.title}</strong> — {t.desc} <small>({formatTimestamp(t.time)})</small></li>
            ))}
          </ul>
        </div>

        <div className="provider-stack">
          <div className="card provider-stack">
            <h2>Customer & Location</h2>
            <p><strong>Customer:</strong> {job.customerName}</p>
            <p><strong>Phone:</strong> {job.customerPhone}</p>
            <p><strong>Address:</strong> {job.address}</p>
            <p><strong>Payment Method:</strong> {job.paymentMethod}</p>
            <p><strong>Payment Status:</strong> {job.paymentStatus}</p>
            <p><strong>Net Payout:</strong> {money(netPayout(job))} <small>(Fee: {money(platformFee(job))})</small></p>
          </div>

          {(job.status === 'active' || job.status === 'reschedule_proposed') && (
            <TimeProposalForm job={job} />
          )}

          {disputes.length > 0 && (
            <div className="card provider-stack">
              <h2>Active Disputes on this Booking</h2>
              {disputes.map(dispute => (
                <div key={dispute.id} className="provider-stack">
                  <div className="provider-row provider-between">
                    <strong>Case #{dispute.id}</strong>
                    <StatusBadge status={dispute.status} />
                  </div>
                  <p><strong>Customer Claim:</strong> ₹{dispute.claimAmount} — "{dispute.customerStatement}"</p>
                  <ProviderDisputeResponse dispute={dispute} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

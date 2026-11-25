import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, CheckCircle2, Play } from 'lucide-react';
import {
  fetchBookingById,
  selectBookingsError,
  selectBookingsLoading,
  selectSelectedBooking,
  updateBookingStatus,
} from '../../store/slices/bookingsSlice';
import { fetchDisputes, selectDisputes } from '../../store/slices/governanceSlice';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { ProviderDisputeResponse } from './ProviderDisputeResponse';
import { JobRequestActions } from './JobRequestActions';
import { ACTION_TO_STATUS, formatDate, formatTimestamp, isAccepted, isPaid, money, netPayout, platformFee } from './providerUtils';

export function JobDetailPage() {
  const dispatch = useDispatch();
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { currentUser, showToast } = useApp();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const refresh = useCallback(() => {
    if (jobId) {
      dispatch(fetchBookingById(jobId));
      dispatch(fetchDisputes());
    }
  }, [dispatch, jobId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rawJob = useSelector(selectSelectedBooking);
  const allDisputes = useSelector(selectDisputes);
  const loading = useSelector(selectBookingsLoading);
  const error = useSelector(selectBookingsError);

  const job = rawJob && rawJob.id === jobId && rawJob.providerId === currentUser?.id ? rawJob : null;
  const data = {
    job,
    disputes: job ? allDisputes.filter(dispute => dispute.bookingId === job.id && dispute.providerId === currentUser?.id) : [],
  };

  useEffect(() => {
    setNotes('');
    setActionError('');
  }, [jobId]);

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
      await dispatch(updateBookingStatus({ bookingId: job.id, status: ACTION_TO_STATUS[action], note })).unwrap();
      setNotes('');
      showToast(action === 'start' ? 'Job started.' : 'Job marked completed. Earnings summary updated.');
    } catch (err) {
      setActionError(typeof err === 'string' ? err : err?.message);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="400px" borderRadius="12px" />;
  if (!job) return <ErrorState title="Job Unavailable" description="This booking does not belong to your provider account or no longer exists." onRetry={() => navigate('/provider/jobs')} />;

  return (
    <div className="provider-page">
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/provider/jobs')}>Back to Job Inbox</Button>
      <div className="card provider-row provider-between">
        <div className="provider-stack">
          <div className="provider-row"><h1>Job Workspace #{job.id}</h1><StatusBadge status={job.status} label={job.status === 'active' ? (isAccepted(job) ? 'Accepted' : 'Awaiting Acceptance') : undefined} /></div>
          <p className="provider-hint">{job.serviceTitle} · {formatDate(job.scheduledDate)} at {job.scheduledSlot}</p>
        </div>
        <JobRequestActions job={job} onRefresh={refresh} />
        {job.status === 'active' && isAccepted(job) && <Button icon={Play} disabled={busy} onClick={event => changeStatus(event, 'start')}>{busy ? 'Saving…' : 'Start Work'}</Button>}
      </div>
      {actionError && <p role="alert" className="provider-error">{actionError}</p>}
      <div className="provider-detail-grid">
        <div className="provider-page">
          {job.status === 'in_progress' && (
            <form className="card provider-stack" onSubmit={event => changeStatus(event, 'complete')}>
              <h2>Job Fulfillment & Completion</h2>
              <TextField name="completion-notes" label="Completion Notes" value={notes} onChange={event => setNotes(event.target.value)} multiline required disabled={busy} />
              <Button type="submit" icon={CheckCircle2} disabled={busy}>{busy ? 'Saving…' : job.paymentStatus === 'Pending' ? 'Complete Job & Record Cash Payment' : 'Mark Job Completed'}</Button>
            </form>
          )}
          <section className="card provider-stack">
            <h2>Fulfillment Timeline</h2>
            <div className="provider-timeline">
              {job.timeline?.map((event, index) => <div key={`${event.time}-${index}`} className="provider-stack"><strong>{event.title}</strong><p className="provider-hint">{event.desc}</p><span className="provider-hint">{formatTimestamp(event.time)}</span></div>)}
            </div>
          </section>
          {data.disputes.map(dispute => (
            <section key={dispute.id} className="card provider-stack">
              <div className="provider-row provider-between"><h2>Dispute #{dispute.id}</h2><StatusBadge status={dispute.status} /></div>
              <p>{dispute.customerStatement}</p>
              {dispute.status === 'ruled' && dispute.providerStatement && <p><strong>Your Response:</strong> {dispute.providerStatement}</p>}
              <ProviderDisputeResponse dispute={dispute} />
              {dispute.evidences && dispute.evidences.filter(e => e.uploaderRole === 'provider' || (e.uploader && e.uploader.includes('Provider'))).length > 0 && (
                <div>
                  <strong>Your Submitted Evidence Records:</strong>
                  <ul style={{ paddingLeft: '20px' }}>
                    {dispute.evidences
                      .filter(e => e.uploaderRole === 'provider' || (e.uploader && e.uploader.includes('Provider')))
                      .map(evidence => (
                        <li key={evidence.id}>{evidence.filename} <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>({evidence.uploadedAt})</span></li>
                      ))}
                  </ul>
                </div>
              )}
              <p className="provider-hint">Assigned arbitrator: {dispute.arbitratorName || 'Not assigned'}</p>
              {dispute.hearingSchedule && <p>Hearing: {formatDate(dispute.hearingSchedule.scheduledDate)} at {dispute.hearingSchedule.scheduledTime}</p>}
              {dispute.hearingSchedule && dispute.status !== 'ruled' && <a href={dispute.hearingSchedule.meetUrl} target="_blank" rel="noreferrer">Join Hearing</a>}
              {dispute.ruling && <div className="provider-record"><strong>{dispute.ruling.verdict}</strong><p>Award: {money(dispute.ruling.awardAmount)}</p><p>{dispute.ruling.reason}</p></div>}
            </section>
          ))}
        </div>
        <div className="card provider-stack">
          <h2>Customer Details</h2>
          <p><strong>Customer:</strong> {job.customerName}</p>
          <p><strong>Phone:</strong> {job.customerPhone}</p>
          <p><strong>Address:</strong> {job.address}</p>
          <p><strong>Customer Notes:</strong> {job.notes || 'None provided'}</p>
          <hr />
          <h2>Payment Breakdown</h2>
          <div className="provider-row provider-between"><span>Gross Price</span><strong>{money(job.amount)}</strong></div>
          {job.refundedAmount > 0 && <div className="provider-row provider-between"><span>Refunded Amount</span><span>{money(job.refundedAmount)}</span></div>}
          <div className="provider-row provider-between"><span>Platform Fee (5%)</span><span>{money(platformFee(job))}</span></div>
          <div className="provider-row provider-between"><span>Net Amount</span><strong>{money(netPayout(job))}</strong></div>
          <p className="provider-hint">Payment: {job.paymentStatus}. {job.status === 'completed' && isPaid(job) ? 'Included in completed earnings.' : 'Not included in completed earnings.'}</p>
        </div>
      </div>
    </div>
  );
}

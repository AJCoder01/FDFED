import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Play } from 'lucide-react';
import { getBookingById, getDisputes } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { useProviderQuery } from './useProviderQuery';
import { JobRequestActions } from './JobRequestActions';
import { formatDate, isAccepted, isPaid, money, netPayout, platformFee, updateJob } from './providerUtils';

export function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { currentUser, showToast } = useApp();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const load = useCallback(async () => {
    const job = await getBookingById(jobId);
    if (!job || job.providerId !== currentUser.id) return { job: null, disputes: [] };
    const disputes = await getDisputes();
    return { job, disputes: disputes.filter(dispute => dispute.bookingId === job.id && dispute.providerId === currentUser.id) };
  }, [jobId, currentUser.id]);
  const { data, setData, error, loading, refresh } = useProviderQuery(load);
  const job = data?.job;
  const setJob = updated => setData(value => ({ ...value, job: updated }));

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
      setJob(await updateJob(job.id, currentUser.id, action, note));
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
        <JobRequestActions job={job} onUpdate={setJob} onRefresh={refresh} />
        {job.status === 'active' && isAccepted(job) && <Button icon={Play} disabled={busy} onClick={event => changeStatus(event, 'start')}>{busy ? 'Saving…' : 'Start Work'}</Button>}
      </div>
      {actionError && <p role="alert" className="provider-error">{actionError}</p>}
      <div className="provider-detail-grid">
        <div className="provider-page">
          {job.status === 'in_progress' && (
            <form className="card provider-stack" onSubmit={event => changeStatus(event, 'complete')}>
              <h2>Job Fulfillment & Completion</h2>
              <TextField name="completion-notes" label="Completion Notes" value={notes} onChange={event => setNotes(event.target.value)} multiline required disabled={busy} />
              <Button type="submit" icon={CheckCircle2} disabled={busy}>{busy ? 'Saving…' : 'Mark Job Completed'}</Button>
            </form>
          )}
          <section className="card provider-stack">
            <h2>Fulfillment Timeline</h2>
            <div className="provider-timeline">
              {job.timeline?.map((event, index) => <div key={`${event.time}-${index}`} className="provider-stack"><strong>{event.title}</strong><p className="provider-hint">{event.desc}</p><span className="provider-hint">{event.time}</span></div>)}
            </div>
          </section>
          {data.disputes.map(dispute => (
            <section key={dispute.id} className="card provider-stack">
              <div className="provider-row provider-between"><h2>Dispute #{dispute.id}</h2><StatusBadge status={dispute.status} /></div>
              <p>{dispute.customerStatement}</p>
              <p className="provider-hint">Assigned arbitrator: {dispute.arbitratorName || 'Not assigned'}</p>
              {dispute.hearingSchedule && <p>Hearing: {formatDate(dispute.hearingSchedule.scheduledDate)} at {dispute.hearingSchedule.scheduledTime}</p>}
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
          <div className="provider-row provider-between"><span>Platform Fee (5%)</span><span>{money(platformFee(job))}</span></div>
          <div className="provider-row provider-between"><span>Net Amount</span><strong>{money(netPayout(job))}</strong></div>
          <p className="provider-hint">Payment: {job.paymentStatus}. {job.status === 'completed' && isPaid(job) ? 'Included in completed earnings.' : 'Not included in completed earnings.'}</p>
        </div>
      </div>
    </div>
  );
}

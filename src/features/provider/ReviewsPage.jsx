import { useCallback, useState } from 'react';
import { Star } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { getBookings, replyToReview } from '../../data/mockRepository';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { formatDate } from './providerUtils';

export function ReviewsPage() {
  const { currentUser, showToast } = useApp();
  const [replyId, setReplyId] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [replyError, setReplyError] = useState('');
  const load = useCallback(() => getBookings('provider', currentUser.id), [currentUser.id]);
  const { data: jobs, setData: setJobs, loading, error, refresh } = useRepositoryQuery(load);

  const sendReply = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setReplyError('');
    try {
      const updated = await replyToReview(replyId, reply, currentUser.id);
      setJobs(list => list.map(job => job.id === updated.id ? updated : job));
      setReplyId(null); setReply(''); showToast('Public reply saved.');
    } catch (error) { setReplyError(error.message); }
    finally { setBusy(false); }
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="200px" borderRadius="12px" />;
  const reviews = jobs.filter(job => job.reviewSubmitted);
  const rated = reviews.filter(job => Number(job.reviewRating) >= 1 && Number(job.reviewRating) <= 5);
  const average = rated.length ? (rated.reduce((sum, job) => sum + Number(job.reviewRating), 0) / rated.length).toFixed(1) : null;

  return (
    <div className="provider-page">
      <div className="page-header">
        <h1 className="page-title">Customer Reviews & Ratings</h1>
        <p className="page-subtitle">{reviews.length} customer review{reviews.length === 1 ? '' : 's'}{average && ` · Average ${average} / 5`}</p>
      </div>

      {reviews.length === 0 && <div className="card">No customer reviews have been saved yet.</div>}
      {reviews.map(job => (
        <div key={job.id} className="card provider-stack">
          <div className="provider-row provider-between">
            <div><strong>{job.customerName}</strong><p className="provider-hint">{job.serviceTitle} · #{job.id}</p></div>
            <span className="provider-hint">Service date: {formatDate(job.scheduledDate)}</span>
          </div>
          <div className="provider-row" aria-label={`Rating: ${job.reviewRating} out of 5`}>
            {[1, 2, 3, 4, 5].map(star => <Star key={star} size={16} fill={star <= Number(job.reviewRating) ? '#F59E0B' : 'none'} color="#F59E0B" />)}
          </div>
          <p>{job.reviewComment}</p>
          {job.reviewReply && <div className="provider-record"><strong>Your Reply</strong><p>{job.reviewReply}</p></div>}
          {replyId === job.id ? <form className="provider-stack" onSubmit={sendReply}>
            <TextField name="review-reply" label="Your Reply" value={reply} onChange={event => setReply(event.target.value)} multiline required disabled={busy} />
            {replyError && <p role="alert" className="provider-error">{replyError}</p>}
            <div className="provider-row"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Post Reply'}</Button><Button variant="secondary" disabled={busy} onClick={() => setReplyId(null)}>Cancel</Button></div>
          </form> : <Button variant="outline" size="sm" disabled={busy} onClick={() => { setReplyId(job.id); setReply(job.reviewReply || ''); setReplyError(''); }}>{job.reviewReply ? 'Edit Reply' : 'Reply to Review'}</Button>}
        </div>
      ))}
    </div>
  );
}

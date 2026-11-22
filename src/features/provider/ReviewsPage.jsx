import { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectBookings,
  selectBookingsLoading,
  selectBookingsError,
  fetchBookingsThunk,
  replyToReviewThunk,
} from '../../store/slices/bookingsSlice';
import { useApp } from '../../app/context/AppContext';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { formatDate } from './providerUtils';

export function ReviewsPage() {
  const dispatch = useDispatch();
  const jobs = useSelector(selectBookings);
  const loading = useSelector(selectBookingsLoading);
  const error = useSelector(selectBookingsError);
  const { showToast } = useApp();

  const [replyId, setReplyId] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [replyError, setReplyError] = useState('');

  const refresh = useCallback(() => {
    dispatch(fetchBookingsThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBookingsThunk());
  }, [dispatch]);

  const sendReply = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setReplyError('');
    try {
      await dispatch(replyToReviewThunk({ id: replyId, reply })).unwrap();
      setReplyId(null); setReply(''); showToast('Public reply saved.');
    } catch (err) { setReplyError(err.message); }
    finally { setBusy(false); }
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading && jobs.length === 0) return <Skeleton height="200px" borderRadius="12px" />;
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
          <div className="provider-row" role="img" aria-label={`Rating: ${job.reviewRating} out of 5`}>
            {[1, 2, 3, 4, 5].map(star => <Star key={star} size={16} fill={star <= Number(job.reviewRating) ? '#F59E0B' : 'none'} color="#F59E0B" />)}
          </div>
          <p>{job.reviewComment}</p>
          {job.reviewReply && <div className="provider-record"><strong>Your Reply</strong><p>{job.reviewReply}</p></div>}
          {replyId === job.id ? <form className="provider-stack" onSubmit={sendReply}>
            <TextField name="review-reply" label="Your Reply" value={reply} onChange={event => setReply(event.target.value)} multiline required disabled={busy} />
            {replyError && <p role="alert" className="provider-error">{replyError}</p>}
            <div className="provider-row"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Submit Reply'}</Button><Button variant="secondary" disabled={busy} onClick={() => setReplyId(null)}>Cancel</Button></div>
          </form> : !job.reviewReply && <Button size="sm" variant="outline" onClick={() => { setReplyId(job.id); setReply(''); }}>Reply</Button>}
        </div>
      ))}
    </div>
  );
}

import { useCallback } from 'react';
import { Star } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { getBookings } from '../../data/mockRepository';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Button } from '../../design-system/primitives/Button';
import { useProviderQuery } from './useProviderQuery';
import { formatDate } from './providerUtils';

export function ReviewsPage() {
  const { currentUser } = useApp();
  const load = useCallback(() => getBookings('provider', currentUser.id), [currentUser.id]);
  const { data: jobs, loading, error, refresh } = useProviderQuery(load);

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="200px" borderRadius="12px" />;
  const reviews = jobs.filter(job => job.reviewSubmitted);
  const rated = reviews.filter(job => Number(job.reviewRating) >= 1 && Number(job.reviewRating) <= 5);
  const average = rated.length ? (rated.reduce((sum, job) => sum + Number(job.reviewRating), 0) / rated.length).toFixed(1) : null;

  return (
    <div className="provider-page">
      <div className="page-header">
        <h1 className="page-title">Customer Reviews & Ratings</h1>
        <p className="page-subtitle">{reviews.length} stored booking review{reviews.length === 1 ? '' : 's'}{average && ` · Average ${average} / 5`}</p>
      </div>
      <p className="provider-hint">Public replies are currently unavailable. Only reviews saved to booking records appear here.</p>
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
          <Button variant="outline" size="sm" disabled>Reply to Review</Button>
        </div>
      ))}
    </div>
  );
}

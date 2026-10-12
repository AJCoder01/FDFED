import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/context/AppContext';
import { getBookings } from '../../data/mockRepository';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Button } from '../../design-system/primitives/Button';
import { Select } from '../../design-system/primitives/Select';
import { JobRequestActions } from './JobRequestActions';
import { useProviderQuery } from './useProviderQuery';
import { formatDate, isAccepted, isPending } from './providerUtils';

export function JobInboxPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const load = useCallback(() => getBookings('provider', currentUser.id), [currentUser.id]);
  const { data: jobs, setData: setJobs, loading, error, refresh } = useProviderQuery(load);

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="200px" borderRadius="12px" />;
  const filtered = jobs.filter(job => filter === 'all' || (filter === 'pending' ? isPending(job) : job.status === filter));

  return (
    <div className="provider-page">
      <div className="page-header">
        <h1 className="page-title">Provider Job Inbox</h1>
        <p className="page-subtitle">Manage incoming requests and track accepted jobs</p>
      </div>
      <Select name="job-filter" label="Filter Jobs" value={filter} onChange={event => setFilter(event.target.value)} options={[
        { value: 'all', label: 'All Jobs' }, { value: 'pending', label: 'Pending Requests' },
        { value: 'active', label: 'Active & Scheduled' }, { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
        { value: 'reschedule_proposed', label: 'Time Proposed' }, { value: 'disputed', label: 'Disputed' }
      ]} />
      {filtered.length === 0 && <p className="provider-hint">No jobs match this filter.</p>}
      {filtered.map(job => (
        <div key={job.id} className="card provider-row provider-between">
          <div className="provider-stack">
            <div className="provider-row"><strong>#{job.id}</strong><StatusBadge status={job.status} label={job.status === 'active' ? (isAccepted(job) ? 'Accepted' : 'Awaiting Acceptance') : undefined} /></div>
            <h3>{job.serviceTitle}</h3>
            <p className="provider-hint">Customer: {job.customerName} ({job.customerPhone}) | Address: {job.address}</p>
            <strong>{formatDate(job.scheduledDate)} at {job.scheduledSlot}</strong>
          </div>
          <div className="provider-stack">
            <JobRequestActions job={job} onUpdate={updated => setJobs(list => list.map(item => item.id === updated.id ? updated : item))} onRefresh={refresh} />
            <Button variant="secondary" size="sm" onClick={() => navigate(`/provider/jobs/${job.id}`)}>Workspace</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

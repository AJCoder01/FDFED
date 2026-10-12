import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, DollarSign, Shield, Plus, CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { getBookings } from '../../data/mockRepository';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Button } from '../../design-system/primitives/Button';
import { useProviderQuery } from './useProviderQuery';
import { bookingTime, formatDate, isPending, isPaid, money, netPayout, slotMinutes } from './providerUtils';
import { getTodayDateInputValue } from '../../utils/date';

export function ProviderDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const load = useCallback(() => getBookings('provider', currentUser.id), [currentUser.id]);
  const { data: jobs, loading, error, refresh } = useProviderQuery(load);

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="400px" borderRadius="12px" />;

  const completed = jobs.filter(job => job.status === 'completed');
  const earnings = completed.filter(isPaid).reduce((sum, job) => sum + netPayout(job), 0);
  const recent = [...jobs].sort((a, b) => bookingTime(b.createdAt) - bookingTime(a.createdAt));
  const today = getTodayDateInputValue();
  const upcoming = jobs.filter(job => ['active', 'in_progress', 'reschedule_proposed'].includes(job.status) && job.scheduledDate >= today)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || slotMinutes(a.scheduledSlot) - slotMinutes(b.scheduledSlot));
  const stats = [
    { label: 'TOTAL JOBS', value: jobs.length, icon: Briefcase, color: 'primary' },
    { label: 'PENDING REQUESTS', value: jobs.filter(isPending).length, icon: Clock, color: 'warning' },
    { label: 'COMPLETED JOBS', value: completed.length, icon: CheckCircle2, color: 'success' },
    { label: 'COMPLETED NET EARNINGS', value: money(earnings), icon: DollarSign, color: 'success' }
  ];

  return (
    <div className="provider-page">
      <div className="card provider-row provider-between">
        <div className="provider-row">
          <Shield size={24} color="var(--color-primary)" />
          <div>
            <strong>Verification Status: {currentUser.verificationStatus?.replaceAll('_', ' ').toUpperCase() || 'UNAVAILABLE'}</strong>
            <p className="provider-hint">{currentUser.businessName}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/provider/profile')}>View Profile & Skills</Button>
      </div>

      <div className="grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card provider-row">
            <div className="provider-stat-icon" style={{ color: `var(--color-${color})`, background: `var(--color-${color === 'primary' ? 'primary-light' : `${color}-bg`})` }}><Icon size={22} /></div>
            <div><span className="provider-hint">{label}</span><div className="provider-stat-value">{value}</div></div>
          </div>
        ))}
      </div>

      <div className="provider-row">
        <Button icon={Plus} disabled={currentUser.verificationStatus !== 'approved'} onClick={() => navigate('/provider/services/new')}>Create New Listing</Button>
        <Button variant="outline" onClick={() => navigate('/provider/availability')}>Manage Availability</Button>
        <Button variant="secondary" onClick={() => navigate('/provider/jobs')}>View Job Inbox</Button>
      </div>

      {[
        { title: 'Upcoming Jobs', list: upcoming.slice(0, 3), empty: 'No upcoming jobs scheduled.' },
        { title: 'Recent Job Inbox', list: recent.slice(0, 3), empty: 'No jobs assigned yet.' }
      ].map(({ title, list, empty }) => (
        <section key={title} className="card provider-stack">
          <h2>{title}</h2>
          {list.length === 0 && <p className="provider-hint">{empty}</p>}
          {list.map(job => (
            <div key={job.id} className="provider-record provider-row provider-between">
              <div>
                <div className="provider-row"><strong>#{job.id}</strong><StatusBadge status={job.status} /></div>
                <h3>{job.serviceTitle}</h3>
                <p className="provider-hint">Customer: {job.customerName} | {formatDate(job.scheduledDate)} at {job.scheduledSlot}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/provider/jobs/${job.id}`)}>Open Job Workspace</Button>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

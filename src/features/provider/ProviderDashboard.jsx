import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, DollarSign, Shield, Plus, CheckCircle2, Clock } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  selectBookings,
  selectBookingsLoading,
  selectBookingsError,
  fetchBookingsThunk,
} from '../../store/slices/bookingsSlice';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Button } from '../../design-system/primitives/Button';
import { bookingTime, formatDate, isPending, isPaid, money, netPayout, slotMinutes } from './providerUtils';
import { getTodayDateInputValue } from '../../utils/date';

export function ProviderDashboard() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const jobs = useSelector(selectBookings);
  const loading = useSelector(selectBookingsLoading);
  const error = useSelector(selectBookingsError);
  const navigate = useNavigate();

  const refresh = useCallback(() => {
    dispatch(fetchBookingsThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBookingsThunk());
  }, [dispatch]);

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading && jobs.length === 0) return <Skeleton height="400px" borderRadius="12px" />;

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
            <strong>Verification Status: {currentUser?.verificationStatus?.replaceAll('_', ' ').toUpperCase() || 'UNAVAILABLE'}</strong>
            <p className="provider-hint">{currentUser?.businessName}</p>
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
        <Button icon={Plus} disabled={currentUser?.verificationStatus !== 'approved'} onClick={() => navigate('/provider/services/new')}>Create New Listing</Button>
        <Button variant="secondary" onClick={() => navigate('/provider/jobs')}>View Job Inbox</Button>
        <Button variant="secondary" onClick={() => navigate('/provider/availability')}>Edit Availability</Button>
        <Button variant="secondary" onClick={() => navigate('/provider/earnings')}>Earnings Breakdown</Button>
      </div>

      <div className="grid-cols-2">
        <div className="card provider-stack">
          <h3>Upcoming Appointments</h3>
          {upcoming.length === 0 && <p className="provider-hint">No scheduled jobs coming up.</p>}
          {upcoming.slice(0, 5).map(job => (
            <div key={job.id} className="provider-row provider-between">
              <div>
                <strong>{job.serviceTitle}</strong>
                <p className="provider-hint">{formatDate(job.scheduledDate)} at {job.scheduledSlot}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>
          ))}
        </div>

        <div className="card provider-stack">
          <h3>Recent Booking Activity</h3>
          {recent.length === 0 && <p className="provider-hint">No recent booking updates.</p>}
          {recent.slice(0, 5).map(job => (
            <div key={job.id} className="provider-row provider-between">
              <div>
                <strong>#{job.id} — {job.customerName}</strong>
                <p className="provider-hint">{job.serviceTitle}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate(`/provider/jobs/${job.id}`)}>Open</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

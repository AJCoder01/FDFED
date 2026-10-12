import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { getBookings } from '../../data/mockRepository';
import { collectedAmount } from '../../data/bookingRules';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';

export function CustomerDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const load = useCallback(() => getBookings('customer', currentUser.id), [currentUser.id]);
  const { data, loading, error, refresh } = useRepositoryQuery(load);
  const bookings = data || [];

  if (error) return <ErrorState description={error} onRetry={refresh} />;

  const activeBookings = bookings.filter(b => ['active', 'in_progress', 'reschedule_proposed'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalSpent = bookings.reduce((sum, b) => sum + collectedAmount(b), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top KPI Cards */}
      <div className="grid-cols-3">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: '600' }}>ACTIVE BOOKINGS</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{activeBookings.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: '600' }}>COMPLETED JOBS</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{completedBookings.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: '600' }}>TOTAL SPENT (INR)</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>₹{totalSpent}</div>
          </div>
        </div>
      </div>

      {/* Active Bookings Banner */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Recent Bookings</h2>
          <Link to="/customer/bookings" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)' }}>
            View All History →
          </Link>
        </div>

        {loading ? (
          <Skeleton height="160px" borderRadius="12px" />
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)' }}>
            <p>You haven't made any bookings yet.</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/services')} style={{ marginTop: '12px' }}>
              Explore Services
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bookings.slice(0, 3).map((bk) => (
              <div key={bk.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>#{bk.id}</strong>
                    <StatusBadge status={bk.status} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)' }}>{bk.serviceTitle}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>
                    Scheduled: <strong>{bk.scheduledDate} ({bk.scheduledSlot})</strong> | Provider: {bk.providerName}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)', display: 'block' }}>Paid After Refunds</span>
                    <strong style={{ fontSize: '16px', color: 'var(--color-ink)' }}>₹{collectedAmount(bk)}</strong>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/customer/bookings/${bk.id}`)}>
                    View Timeline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Addresses Card */}
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '12px' }}>Saved Delivery Addresses</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-cols-2">
          {currentUser?.addresses?.map((addr) => (
            <div key={addr.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '12px', backgroundColor: 'var(--color-page-bg)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase' }}>{addr.label}</span>
              <p style={{ fontSize: '13px', color: 'var(--color-ink)', marginTop: '4px' }}>{addr.addressLine}, {addr.city} - {addr.pincode}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

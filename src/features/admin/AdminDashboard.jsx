import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Headphones, Gavel, DollarSign, TrendingUp } from 'lucide-react';
import { getBookings, getTickets, getDisputes, getServices, getRevenueStats } from '../../data/mockRepository';

import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';

export function AdminDashboard() {
  const navigate = useNavigate();
  const load = useCallback(async () => {
    const [bookings, tickets, disputes, services, revenue] = await Promise.all([getBookings('admin'), getTickets(), getDisputes(), getServices({ role: 'admin' }), getRevenueStats()]);
    return { bookingsCount: bookings.length, ticketsCount: tickets.filter(ticket => ticket.status === 'open').length,
      disputesCount: disputes.filter(dispute => dispute.status === 'pending_assignment').length,
      servicesCount: services.length, platformRevenue: revenue.totalRevenue, gmv: revenue.gmv };
  }, []);
  const { data: stats, loading, error, refresh } = useRepositoryQuery(load);
  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="400px" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Platform Operations Dashboard</h1>
        <p className="page-subtitle">Marketplace control panel for revenue tracking, provider moderation, support triage, and dispute management</p>
      </div>

      {/* Action-First KPI Grid */}
      <div className="grid-cols-4">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #10B981' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>PLATFORM REVENUE (5%)</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669' }}>₹{stats.platformRevenue.toLocaleString()}</div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>GMV: ₹{stats.gmv.toLocaleString()}</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>TOTAL BOOKINGS</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{stats.bookingsCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Headphones size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>OPEN TICKETS</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{stats.ticketsCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-conflict-bg)', color: 'var(--color-conflict)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gavel size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>UNASSIGNED DISPUTES</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{stats.disputesCount}</div>
          </div>
        </div>
      </div>

      {/* Quick Ops Queues */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="#059669" /> Platform Revenue & Ledger
            </h2>
            <Button variant="primary" size="sm" onClick={() => navigate('/admin/revenue')}>View Financials</Button>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Track platform 5% booking fees, gross merchandise value (GMV), category-wise earnings, and provider payout ledgers.
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Provider Moderation Queue</h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/providers')}>Manage Queue</Button>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Review pending business verification applications and skill audit certificates.
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>Dispute Case Assignment</h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/disputes')}>Assign Cases</Button>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Assign unresolved booking disputes to independent Arbitrators.
          </div>
        </div>
      </div>
    </div>
  );
}

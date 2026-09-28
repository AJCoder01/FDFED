import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Eye } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { getBookings } from '../../data/mockRepository';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { EmptyState } from '../../design-system/primitives/EmptyState';
import { Button } from '../../design-system/primitives/Button';

export function BookingsListPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (currentUser) {
        const list = await getBookings('customer', currentUser.id);
        setBookings(list);
      }
      setLoading(false);
    }
    loadData();
  }, [currentUser]);

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'active') return b.status === 'active' || b.status === 'in_progress';
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    if (activeTab === 'disputed') return b.status === 'disputed';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">Track, reschedule, cancel or review your service bookings</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
        {[
          { key: 'all', label: 'All Bookings' },
          { key: 'active', label: 'Active & Scheduled' },
          { key: 'completed', label: 'Completed' },
          { key: 'disputed', label: 'Disputed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-control)',
              border: 'none',
              backgroundColor: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.key ? '#FFF' : 'var(--color-ink)',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton height="200px" borderRadius="12px" />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title="No Bookings Found"
          description="You don't have any bookings matching this filter category."
          actionLabel="Find a Service to Book"
          onAction={() => navigate('/services')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredBookings.map((bk) => (
            <div key={bk.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--color-ink)' }}>#{bk.id}</strong>
                  <StatusBadge status={bk.status} />
                  {bk.hasTicket && <span style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: '600' }}>[Ticket Open]</span>}
                  {bk.hasDispute && <span style={{ fontSize: '11px', color: 'var(--color-conflict)', fontWeight: '600' }}>[Dispute Escalated]</span>}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>{bk.serviceTitle}</h3>
                <div style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
                  Scheduled: <strong>{bk.scheduledDate} at {bk.scheduledSlot}</strong> | Provider: {bk.providerName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                  Location: {bk.address}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)', display: 'block' }}>Paid Total</span>
                  <strong style={{ fontSize: '18px', color: 'var(--color-ink)' }}>₹{bk.amount}</strong>
                </div>
                <Button variant="primary" size="sm" onClick={() => navigate(`/customer/bookings/${bk.id}`)} icon={Eye}>
                  View Details & Timeline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

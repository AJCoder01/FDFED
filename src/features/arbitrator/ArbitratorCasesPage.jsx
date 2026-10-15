import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Calendar,
  Award,
  Eye,
  Clock,
  AlertTriangle,
  Scale,
  Video,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { getDisputes } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { EmptyState } from '../../design-system/primitives/EmptyState';
import { ErrorState } from '../../design-system/primitives/ErrorState';

export function ArbitratorCasesPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'pending_hearing', 'scheduled', 'all'

  const load = useCallback(async () => {
    const allDisputes = await getDisputes();
    const userDisputes = allDisputes.filter(
      (d) => d.arbitratorId === currentUser?.id || (!currentUser?.id && d.arbitratorId === 'user-arbit-1') || (currentUser?.id === 'user-arbit-1' && d.arbitratorId === 'user-arbit-1')
    );
    return userDisputes;
  }, [currentUser?.id]);

  const { data, loading, error, refresh } = useRepositoryQuery(load);
  const disputes = data || [];

  const filteredDisputes = useMemo(() => {
    return disputes.filter((disp) => {
      // Status filter
      if (statusFilter === 'active') {
        if (disp.status !== 'assigned' && disp.status !== 'hearing_scheduled' && disp.status !== 'pending_assignment') {
          return false;
        }
      } else if (statusFilter === 'pending_hearing') {
        if (disp.status !== 'assigned' && disp.status !== 'pending_assignment') return false;
      } else if (statusFilter === 'scheduled') {
        if (disp.status !== 'hearing_scheduled') return false;
      } else if (statusFilter === 'ruled') {
        if (disp.status !== 'ruled' && disp.status !== 'closed') return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = disp.id?.toLowerCase().includes(query);
        const matchesTitle = disp.serviceTitle?.toLowerCase().includes(query);
        const matchesCust = disp.customerName?.toLowerCase().includes(query);
        const matchesProv = disp.providerName?.toLowerCase().includes(query);
        const matchesBooking = disp.bookingId?.toLowerCase().includes(query);
        return matchesId || matchesTitle || matchesCust || matchesProv || matchesBooking;
      }

      return true;
    });
  }, [disputes, statusFilter, searchTerm]);

  if (error) {
    return <ErrorState description={error} onRetry={refresh} />;
  }

  const activeCount = disputes.filter(
    (d) => d.status === 'assigned' || d.status === 'hearing_scheduled' || d.status === 'pending_assignment'
  ).length;
  const pendingHearingCount = disputes.filter(
    (d) => d.status === 'assigned' || d.status === 'pending_assignment'
  ).length;
  const scheduledCount = disputes.filter((d) => d.status === 'hearing_scheduled').length;
  const ruledCount = disputes.filter((d) => d.status === 'ruled' || d.status === 'closed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Active Dispute Cases</h1>
          <p className="page-subtitle">
            Inspect case submissions, review party evidence, convene hearings, and issue arbitration awards.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            size="sm"
            icon={Calendar}
            onClick={() => navigate('/arbitrator/hearings')}
          >
            Hearing Schedule Calendar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Award}
            onClick={() => navigate('/arbitrator/rulings')}
          >
            Issue Ruling & Award
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '260px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '0 12px', backgroundColor: 'var(--color-surface)' }}>
            <Search size={18} color="var(--color-muted)" />
            <input
              type="text"
              placeholder="Search by Case ID (#DISP-...), party name, service title, or booking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: '38px', border: 'none', outline: 'none', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--color-ink)' }}
            />
          </div>

          {/* Quick status tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-control)',
                fontSize: '13px',
                fontWeight: '600',
                border: statusFilter === 'active' ? '1px solid var(--color-conflict)' : '1px solid var(--color-border)',
                backgroundColor: statusFilter === 'active' ? 'var(--color-conflict-bg)' : 'var(--color-surface)',
                color: statusFilter === 'active' ? 'var(--color-conflict)' : 'var(--color-ink-secondary)',
                cursor: 'pointer'
              }}
            >
              All Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending_hearing')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-control)',
                fontSize: '13px',
                fontWeight: '600',
                border: statusFilter === 'pending_hearing' ? '1px solid var(--color-warning)' : '1px solid var(--color-border)',
                backgroundColor: statusFilter === 'pending_hearing' ? 'var(--color-warning-bg)' : 'var(--color-surface)',
                color: statusFilter === 'pending_hearing' ? 'var(--color-warning)' : 'var(--color-ink-secondary)',
                cursor: 'pointer'
              }}
            >
              Hearing Pending ({pendingHearingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('scheduled')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-control)',
                fontSize: '13px',
                fontWeight: '600',
                border: statusFilter === 'scheduled' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: statusFilter === 'scheduled' ? 'var(--color-primary-light)' : 'var(--color-surface)',
                color: statusFilter === 'scheduled' ? 'var(--color-primary)' : 'var(--color-ink-secondary)',
                cursor: 'pointer'
              }}
            >
              Scheduled ({scheduledCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-control)',
                fontSize: '13px',
                fontWeight: '600',
                border: statusFilter === 'all' ? '1px solid var(--color-ink)' : '1px solid var(--color-border)',
                backgroundColor: statusFilter === 'all' ? 'var(--color-surface)' : 'var(--color-surface)',
                color: statusFilter === 'all' ? 'var(--color-ink)' : 'var(--color-muted)',
                cursor: 'pointer'
              }}
            >
              All Caseload ({disputes.length})
            </button>
          </div>
        </div>
      </div>

      {/* Caseload Listing */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Skeleton height="140px" borderRadius="12px" />
          <Skeleton height="140px" borderRadius="12px" />
          <Skeleton height="140px" borderRadius="12px" />
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <EmptyState
            title="No Active Dispute Cases Found"
            description={searchTerm ? `No disputes match your search query "${searchTerm}".` : 'There are no active dispute cases matching the selected status filter.'}
            action={searchTerm ? (
              <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                Clear Search Filter
              </Button>
            ) : null}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredDisputes.map((disp) => {
            const hasHearing = disp.hearingSchedule && disp.hearingSchedule.status === 'scheduled';
            const evidenceCount = disp.evidences ? disp.evidences.length : 0;

            return (
              <div
                key={disp.id}
                className="card"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  borderLeft: disp.status === 'hearing_scheduled' ? '4px solid var(--color-primary)' : '4px solid var(--color-conflict)'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-conflict)', letterSpacing: '0.02em' }}>
                        #{disp.id}
                      </span>
                      <StatusBadge status={disp.status} />
                      {disp.bookingId && (
                        <span style={{ fontSize: '12px', color: 'var(--color-muted)', backgroundColor: 'var(--color-page-bg)', padding: '2px 8px', borderRadius: '4px' }}>
                          Booking Ref: {disp.bookingId}
                        </span>
                      )}
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)' }}>
                      {disp.serviceTitle}
                    </h2>
                  </div>

                  {/* Financials Summary */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>DISPUTE / CLAIM AMOUNT</span>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-ink)' }}>
                      ₹{disp.amountInDispute} <span style={{ fontSize: '12px', color: 'var(--color-danger)', fontWeight: '600' }}>(Claim: ₹{disp.claimAmount || disp.amountInDispute})</span>
                    </div>
                  </div>
                </div>

                {/* Parties Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', padding: '12px 16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>CLAIMANT (CUSTOMER)</span>
                    <strong style={{ display: 'block', fontSize: '13px', color: 'var(--color-ink)', marginTop: '2px' }}>
                      {disp.customerName}
                    </strong>
                    <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', marginTop: '4px', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{disp.customerStatement ? (disp.customerStatement.length > 90 ? `${disp.customerStatement.slice(0, 90)}...` : disp.customerStatement) : 'No written statement filed.'}"
                    </p>
                  </div>

                  <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '16px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>RESPONDENT (PROVIDER)</span>
                    <strong style={{ display: 'block', fontSize: '13px', color: 'var(--color-ink)', marginTop: '2px' }}>
                      {disp.providerName}
                    </strong>
                    <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', marginTop: '4px', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{disp.providerStatement ? (disp.providerStatement.length > 90 ? `${disp.providerStatement.slice(0, 90)}...` : disp.providerStatement) : 'Awaiting provider formal response.'}"
                    </p>
                  </div>
                </div>

                {/* Hearing Schedule Info Banner if scheduled */}
                {hasHearing && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', flexWrap: 'wrap', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: '600' }}>
                      <Video size={16} />
                      <span>Hearing Scheduled: <strong>{disp.hearingSchedule.scheduledDate}</strong> at <strong>{disp.hearingSchedule.scheduledTime}</strong></span>
                    </div>
                    {disp.hearingSchedule.meetUrl && (
                      <a
                        href={disp.hearingSchedule.meetUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: '700', fontSize: '12px', textDecoration: 'underline' }}
                      >
                        Join Virtual Meeting <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                )}

                {/* Footer Controls & Evidence */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--color-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} color="var(--color-primary)" /> {evidenceCount} Evidence Files Submitted
                    </span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> Registered: {disp.createdAt ? new Date(disp.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Calendar}
                      onClick={() => navigate(`/arbitrator/hearings?caseId=${disp.id}`)}
                    >
                      {hasHearing ? 'Reschedule Hearing' : 'Schedule Hearing'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Eye}
                      onClick={() => navigate(`/arbitrator/cases/${disp.id}`)}
                    >
                      Inspect Case & Evidence →
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

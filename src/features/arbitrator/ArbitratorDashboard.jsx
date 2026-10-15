import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Award,
  Eye,
  TrendingUp
} from 'lucide-react';

import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { getDisputes } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';

import { ErrorState } from '../../design-system/primitives/ErrorState';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';

export function ArbitratorDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const load = useCallback(async () => {
    const allDisputes = await getDisputes();
    return allDisputes.filter(
      dispute => dispute.arbitratorId === currentUser?.id || (!currentUser?.id && dispute.arbitratorId === 'user-arbit-1') || (currentUser?.id === 'user-arbit-1' && dispute.arbitratorId === 'user-arbit-1')
    );
  }, [currentUser?.id]);

  const { data, loading, error, refresh } = useRepositoryQuery(load);
  const disputes = data || [];

  const activeCases = disputes.filter(
    dispute =>
      dispute.status === 'assigned' ||
      dispute.status === 'hearing_scheduled' ||
      dispute.status === 'pending_assignment'
  );

  const ruledCases = disputes.filter(
    dispute =>
      dispute.status === 'ruled' ||
      dispute.status === 'closed'
  );

  const scheduledHearings = disputes.filter(
    dispute => dispute.status === 'hearing_scheduled'
  );

  const totalClaimValue = disputes.reduce((sum, d) => sum + (Number(d.claimAmount) || Number(d.amountInDispute) || 0), 0);

  if (error) {
    return <ErrorState description={error} onRetry={refresh} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Arbitration Operations Dashboard</h1>
          <p className="page-subtitle">
            Executive overview of your judicial caseload, upcoming hearing schedule, and ruling pipeline.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            size="sm"
            icon={FileText}
            onClick={() => navigate('/arbitrator/cases')}
          >
            Active Dispute Cases ({activeCases.length})
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Calendar}
            onClick={() => navigate('/arbitrator/hearings')}
          >
            Open Hearing Calendar
          </Button>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-conflict-bg)', color: 'var(--color-conflict)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>
              ACTIVE CASELOAD
            </span>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-ink)', lineHeight: 1.2 }}>
              {activeCases.length}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Requiring adjudication</span>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>
              SCHEDULED HEARINGS
            </span>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-ink)', lineHeight: 1.2 }}>
              {scheduledHearings.length}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Virtual sessions booked</span>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>
              COMPLETED RULINGS
            </span>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-ink)', lineHeight: 1.2 }}>
              {ruledCases.length}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Final awards published</span>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>
              TOTAL DISPUTED VALUE
            </span>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-ink)', lineHeight: 1.2 }}>
              ₹{totalClaimValue.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Cumulative claims filed</span>
          </div>
        </div>
      </div>

      {/* Recent Assigned Cases Summary Card */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)' }}>
              Recent Assigned Proceedings
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
              Quick preview of recent disputes requiring evaluation
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/arbitrator/cases')}
          >
            View All Active Dispute Cases ({activeCases.length}) →
          </Button>
        </div>

        {loading ? (
          <Skeleton height="140px" borderRadius="12px" />
        ) : disputes.length === 0 ? (
          <p style={{ color: 'var(--color-muted)', padding: '16px 0' }}>
            No dispute cases currently assigned to your desk.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {disputes.slice(0, 3).map(dispute => (
              <div
                key={dispute.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-control)',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  backgroundColor: 'var(--color-page-bg)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--color-conflict)' }}>
                      #{dispute.id}
                    </strong>
                    <StatusBadge status={dispute.status} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>
                    {dispute.serviceTitle}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                    Claimant: {dispute.customerName} vs Respondent: {dispute.providerName} | Claim: ₹{dispute.claimAmount || dispute.amountInDispute}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Eye}
                    onClick={() => navigate(`/arbitrator/cases/${dispute.id}`)}
                  >
                    Inspect Case
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

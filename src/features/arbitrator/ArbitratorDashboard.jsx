import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Award,
  Eye,
  TrendingUp
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  selectDisputes,
  selectSupportLoading,
  selectSupportError,
  fetchDisputesThunk,
} from '../../store/slices/supportSlice';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';

export function ArbitratorDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const allDisputes = useSelector(selectDisputes);
  const loading = useSelector(selectSupportLoading);
  const error = useSelector(selectSupportError);

  const refresh = useCallback(() => {
    dispatch(fetchDisputesThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchDisputesThunk());
  }, [dispatch]);

  const disputes = (allDisputes || []).filter(
    dispute => dispute.arbitratorId === currentUser?.id
  );

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
            onClick={() => navigate('/arbitrator/schedule')}
          >
            Hearing Calendar ({scheduledHearings.length})
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>ACTIVE CASES</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{activeCases.length}</div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Assigned to you</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>SCHEDULED HEARINGS</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{scheduledHearings.length}</div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Upcoming sessions</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>RULED AWARDS</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{ruledCases.length}</div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Binding verdicts</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '700' }}>TOTAL CLAIMS VALUE</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>₹{totalClaimValue.toLocaleString()}</div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>In dispute across cases</span>
          </div>
        </div>
      </div>

      {/* Main Content Areas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Case List Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)', margin: 0 }}>
              Recent Caseload
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/arbitrator/cases')}
            >
              View All Cases ({disputes.length}) →
            </Button>
          </div>

          {loading && disputes.length === 0 ? (
            <Skeleton height="200px" />
          ) : disputes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--color-muted)' }}>
              No dispute cases are currently assigned to your account.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {disputes.slice(0, 5).map((disp) => (
                <div
                  key={disp.id}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-control)',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>
                        Case #{disp.id}
                      </strong>
                      <StatusBadge status={disp.status} />
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-ink)', fontWeight: '600' }}>
                      {disp.serviceTitle || `Booking #${disp.bookingId}`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                      Customer: {disp.customerName} · Provider: {disp.providerName} · Claim: ₹{disp.claimAmount || disp.amountInDispute || 0}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Eye}
                      onClick={() => navigate(`/arbitrator/cases/${disp.id}`)}
                    >
                      Open Case
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

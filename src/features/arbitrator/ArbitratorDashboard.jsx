import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { useApp } from '../../app/context/AppContext';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Award, Eye } from 'lucide-react';
import { getDisputes } from '../../data/mockRepository';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Button } from '../../design-system/primitives/Button';

export function ArbitratorDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const load = useCallback(async () => (await getDisputes()).filter(dispute => dispute.arbitratorId === currentUser.id), [currentUser.id]);
  const { data, loading, error, refresh } = useRepositoryQuery(load);
  const disputes = data || [];

  if (error) return <ErrorState description={error} onRetry={refresh} />;

  const activeCases = disputes.filter(d => d.status === 'assigned' || d.status === 'hearing_scheduled');
  const ruledCases = disputes.filter(d => d.status === 'ruled' || d.status === 'closed');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Arbitrator Case History & Desk</h1>
        <p className="page-subtitle">Inspect dispute evidence, schedule virtual hearings, and issue binding rulings</p>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-3">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-conflict-bg)', color: 'var(--color-conflict)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>ACTIVE DISPUTE CASES</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{activeCases.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>SCHEDULED HEARINGS</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{disputes.filter(dispute => dispute.status === 'hearing_scheduled').length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={24} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>COMPLETED RULINGS</span>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{ruledCases.length}</div>
          </div>
        </div>
      </div>

      {/* Active Disputes List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Assigned Dispute Cases</h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/arbitrator/hearings')}>
            Hearing Schedule Calendar →
          </Button>
        </div>

        {loading ? (
          <Skeleton height="160px" borderRadius="12px" />
        ) : disputes.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>No dispute cases assigned.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {disputes.map((disp) => (
              <div key={disp.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '15px', color: 'var(--color-ink)' }}>#{disp.id}</strong>
                    <StatusBadge status={disp.status} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)' }}>{disp.serviceTitle}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
                    Customer: {disp.customerName} vs Provider: {disp.providerName} | Claim: ₹{disp.claimAmount}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="primary" size="sm" icon={Eye} onClick={() => navigate(`/arbitrator/cases/${disp.id}`)}>
                    Inspect Case & Evidence
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

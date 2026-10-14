import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { useState, useCallback } from 'react';
import { Award, Eye } from 'lucide-react';
import { getDisputes, getAccounts, assignDispute } from '../../data/mockRepository';
import { useApp } from '../../app/context/AppContext';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { Select } from '../../design-system/primitives/Select';
import { Modal } from '../../design-system/primitives/Modal';

export function DisputeAssignmentPage() {
  const { showToast } = useApp();
  const [busy, setBusy] = useState(false);
  const [viewVerdictCase, setViewVerdictCase] = useState(null);

  const load = useCallback(async () => {
    const [disputes, accounts] = await Promise.all([
      getDisputes(),
      getAccounts()
    ]);
    const arbitrators = (accounts || []).filter(a => a.role === 'arbitrator');
    return { disputes, arbitrators };
  }, []);

  const { data, loading, error, refresh } = useRepositoryQuery(load);
  const disputes = data?.disputes || [];
  const arbitrators = data?.arbitrators || [];

  const handleAssign = async (disputeId, arbitratorId) => {
    if (busy) return;
    const selected = arbitrators.find(a => a.id === arbitratorId);
    if (!selected) return;
    setBusy(true);
    try {
      await assignDispute(disputeId, selected);
      showToast(`Arbitrator ${selected.name} assigned to Case #${disputeId}.`);
      refresh();
    } catch (error) {
      showToast(error.message, 'warning');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <p>Loading cases…</p>;

  const arbitratorOptions = arbitrators.map(arb => ({
    value: arb.id,
    label: arb.name
  }));

  const columns = [
    { header: 'Case ID', accessor: 'id', render: (row) => <strong>#{row.id}</strong> },
    { header: 'Booking ID', accessor: 'bookingId' },
    { header: 'Claim Amount', accessor: 'claimAmount', render: (row) => <strong style={{ color: 'var(--color-conflict)' }}>₹{row.claimAmount}</strong> },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Provider', accessor: 'providerName' },
    {
      header: 'Assigned Arbitrator',
      accessor: 'arbitratorName',
      render: (row) => row.arbitratorName ? (
        <span style={{ fontWeight: '700', color: 'var(--color-ink)' }}>
          {row.arbitratorName}
        </span>
      ) : (
        <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontStyle: 'italic' }}>
          Unassigned
        </span>
      )
    },
    {
      header: 'Hearing Schedule',
      accessor: 'hearingSchedule',
      render: (row) => row.hearingSchedule ? (
        <span style={{ fontSize: '12px', color: 'var(--color-ink)' }}>
          {row.hearingSchedule.scheduledDate} ({row.hearingSchedule.scheduledTime})
        </span>
      ) : (
        <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Not scheduled</span>
      )
    },
    {
      header: 'Dispute Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Final Verdict & Outcome',
      accessor: 'ruling',
      render: (row) => row.ruling ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <strong style={{ fontSize: '12px', color: row.ruling.verdict.toLowerCase().includes('customer') ? 'var(--color-success)' : 'var(--color-ink)' }}>
            {row.ruling.verdict}
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Award: ₹{row.ruling.awardAmount}</span>
        </div>
      ) : (
        <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Pending ruling</span>
      )
    },
    {
      header: 'Assign / Reassign',
      accessor: 'id',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '150px' }}>
          {row.ruling ? (
            <Button size="sm" variant="outline" icon={Eye} onClick={() => setViewVerdictCase(row)}>
              View Verdict
            </Button>
          ) : (
            <Select
              placeholder="Choose"
              value=""
              disabled={busy || row.status === 'ruled'}
              onChange={(e) => {
                if (e.target.value) handleAssign(row.id, e.target.value);
              }}
              options={arbitratorOptions}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Dispute Case Assignment & Final Verdicts</h1>
        <p className="page-subtitle">Assign disputes to independent arbitrators and monitor scheduled hearings and final binding verdicts</p>
      </div>

      <div className="card">
        <DataTable columns={columns} data={disputes || []} keyField="id" />
      </div>

      {/* Final Verdict Details Modal */}
      {viewVerdictCase && (
        <Modal
          isOpen={true}
          onClose={() => setViewVerdictCase(null)}
          title={`Arbitration Final Ruling: Case #${viewVerdictCase.id}`}
          footer={(
            <Button variant="secondary" onClick={() => setViewVerdictCase(null)}>
              Close
            </Button>
          )}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: 'var(--color-success-bg)', borderRadius: '8px', color: 'var(--color-success)' }}>
              <Award size={24} />
              <div>
                <strong style={{ fontSize: '15px', display: 'block' }}>Verdict: {viewVerdictCase.ruling?.verdict}</strong>
                <span style={{ fontSize: '12px' }}>Awarded Compensation: ₹{viewVerdictCase.ruling?.awardAmount}</span>
              </div>
            </div>

            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Booking Reference:</strong> #{viewVerdictCase.bookingId} ({viewVerdictCase.serviceTitle})</div>
              <div><strong>Customer:</strong> {viewVerdictCase.customerName}</div>
              <div><strong>Provider:</strong> {viewVerdictCase.providerName}</div>
              <div><strong>Adjudicating Arbitrator:</strong> {viewVerdictCase.arbitratorName}</div>
              {viewVerdictCase.hearingSchedule && (
                <div><strong>Hearing Date:</strong> {viewVerdictCase.hearingSchedule.scheduledDate} at {viewVerdictCase.hearingSchedule.scheduledTime}</div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Arbitrator Rationale:</strong>
              <p style={{ backgroundColor: 'var(--color-page-bg)', padding: '12px', borderRadius: '6px', fontSize: '13px', color: 'var(--color-ink)', margin: 0 }}>
                {viewVerdictCase.ruling?.reason}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

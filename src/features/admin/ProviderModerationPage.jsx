import { useState } from 'react';
import { getProviders, moderateProvider } from '../../data/mockRepository';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { useApp } from '../../app/context/AppContext';
import { DataTable } from '../../design-system/primitives/DataTable';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { TextField } from '../../design-system/primitives/TextField';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { ErrorState } from '../../design-system/primitives/ErrorState';

export function ProviderModerationPage() {
  const { showToast } = useApp();
  const { data: providers, loading, error, refresh } = useRepositoryQuery(getProviders);
  const [decision, setDecision] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const close = () => { if (!busy) { setDecision(null); setReason(''); setSaveError(''); } };
  const confirm = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setSaveError('');
    try {
      await moderateProvider(decision.id, decision.status, reason);
      setDecision(null); setReason(''); showToast('Provider verification decision saved.');
    } catch (error) { setSaveError(error.message); }
    finally { setBusy(false); }
  };
  if (error) return <ErrorState description={error} onRetry={refresh} />;
  if (loading) return <Skeleton height="300px" />;
  const columns = [
    { header: 'Business Name', accessor: 'businessName' }, { header: 'Applicant', accessor: 'name' },
    { header: 'Service Area', accessor: 'serviceArea' },
    { header: 'Skills', render: row => row.skills.join(', ') },
    { header: 'Status', render: row => <StatusBadge status={row.verificationStatus} /> },
    { header: 'Document Record', render: row => row.documentName || 'Not submitted' },
    { header: 'Actions', render: row => <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {[['approved', row.verificationStatus === 'suspended' ? 'Restore' : 'Approve'], ['rejected', 'Reject'], ['changes_requested', 'Request Changes'], ['suspended', 'Suspend']].map(([status, label]) =>
        <Button key={status} variant={status === 'approved' ? 'success' : status === 'suspended' || status === 'rejected' ? 'danger' : 'outline'} size="sm" disabled={busy || row.verificationStatus === status} onClick={() => setDecision({ id: row.id, status })}>{label}</Button>)}
    </div> }
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header"><h1 className="page-title">Provider Moderation Queue</h1><p className="page-subtitle">Review saved provider profiles and record verification decisions</p></div>
      <div className="card"><DataTable columns={columns} data={providers} /></div>
      <form onSubmit={confirm}>
        <Modal isOpen={Boolean(decision)} onClose={close} title="Provider Verification Decision" footer={<><Button variant="secondary" disabled={busy} onClick={close}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Confirm Audit Decision'}</Button></>}>
          <TextField name="audit-reason" label="Audit Reason / Feedback" value={reason} onChange={event => setReason(event.target.value)} multiline required disabled={busy} />
          {saveError && <p role="alert" style={{ color: 'var(--color-danger)' }}>{saveError}</p>}
        </Modal>
      </form>
    </div>
  );
}

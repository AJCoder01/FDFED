import { useEffect, useState } from 'react';
import { useApp } from '../../app/context/AppContext';
import { saveDisputeResponse } from '../../data/mockRepository';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';

export function ProviderDisputeResponse({ dispute }) {
  const { currentUser, showToast } = useApp();
  const [statement, setStatement] = useState(dispute.providerStatement || '');
  const [filename, setFilename] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setStatement(dispute.providerStatement || ''); }, [dispute.providerStatement]);
  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      await saveDisputeResponse(dispute.id, currentUser.id, statement, filename);
      setFilename(''); showToast('Dispute response saved.');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };
  if (dispute.status === 'ruled') return null;
  return (
    <form className="provider-stack" onSubmit={submit}>
      <TextField name={`statement-${dispute.id}`} label="Your Dispute Response" value={statement} onChange={event => setStatement(event.target.value)} multiline required disabled={busy} />
      <TextField name={`evidence-${dispute.id}`} label="Evidence Filename (Demo Record)" value={filename} onChange={event => setFilename(event.target.value)} disabled={busy} helperText="Records a filename for the demo; no file is uploaded." />
      {error && <p role="alert" className="provider-error">{error}</p>}
      <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Dispute Response'}</Button>
    </form>
  );
}

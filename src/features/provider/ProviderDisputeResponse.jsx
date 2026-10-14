import { useEffect, useState } from 'react';
import { useApp } from '../../app/context/AppContext';
import { saveDisputeResponse } from '../../data/mockRepository';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { Upload, FileText, X } from 'lucide-react';

export function ProviderDisputeResponse({ dispute }) {
  const { currentUser, showToast } = useApp();
  const [statement, setStatement] = useState(dispute.providerStatement || '');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setStatement(dispute.providerStatement || ''); }, [dispute.providerStatement]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const mapped = files.map(f => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`
    }));
    setEvidenceFiles(prev => [...prev, ...mapped]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setEvidenceFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const filenames = evidenceFiles.map(f => f.name);
      await saveDisputeResponse(dispute.id, currentUser.id, statement, filenames);
      setEvidenceFiles([]);
      showToast('Dispute response and evidence saved.');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };

  if (dispute.status === 'ruled') return null;

  return (
    <form className="provider-stack" onSubmit={submit}>
      <TextField
        name={`statement-${dispute.id}`}
        label="Your Dispute Response"
        value={statement}
        onChange={event => setStatement(event.target.value)}
        multiline
        required
        disabled={busy}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>
          Upload Counter-Evidence Documents / Photos <span style={{ fontWeight: '400', color: 'var(--color-muted)' }}>(Optional)</span>
        </label>
        <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-control)', padding: '16px', textAlign: 'center', backgroundColor: 'var(--color-page-bg)' }}>
          <Upload size={22} style={{ color: 'var(--color-muted)', margin: '0 auto 6px' }} />
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '0 0 8px 0' }}>
            Upload completion photos, chat logs, job sheets, or inspection evidence
          </p>
          <input
            type="file"
            id={`providerEvidenceInput-${dispute.id}`}
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={busy}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`providerEvidenceInput-${dispute.id}`).click()}
            disabled={busy}
          >
            Select Evidence File(s)
          </Button>
        </div>

        {evidenceFiles.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>Attached Files ({evidenceFiles.length}):</span>
            {evidenceFiles.map((file, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="var(--color-primary)" />
                  <span><strong>{file.name}</strong> <span style={{ color: 'var(--color-muted)', fontSize: '11px' }}>({file.size})</span></span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                  title="Remove file"
                  disabled={busy}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p role="alert" className="provider-error">{error}</p>}
      <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Dispute Response'}</Button>
    </form>
  );
}


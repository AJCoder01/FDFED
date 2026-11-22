import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { saveDisputeResponseThunk } from '../../store/slices/supportSlice';
import { useApp } from '../../app/context/AppContext';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { Upload, FileText, X } from 'lucide-react';

export function ProviderDisputeResponse({ dispute }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const { showToast } = useApp();
  const [statement, setStatement] = useState(dispute.providerStatement || '');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setStatement(dispute.providerStatement || ''); }, [dispute.providerStatement]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEvidenceFiles(prev => [
          ...prev,
          {
            name: f.name,
            size: `${(f.size / 1024).toFixed(1)} KB`,
            fileData: event.target.result,
            type: f.type
          }
        ]);
      };
      reader.readAsDataURL(f);
    });
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
      await dispatch(saveDisputeResponseThunk({
        id: dispute.id,
        providerId: currentUser.id,
        statement,
        files: evidenceFiles
      })).unwrap();
      setEvidenceFiles([]);
      showToast('Dispute response and evidence saved.');
    } catch (err) { setError(err.message); }
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
        placeholder="Explain your work quality, arrival time, or response to customer claim…"
      />

      {/* Provider Evidence File Uploader */}
      <div className="provider-stack" style={{ border: '1px dashed var(--color-border)', padding: '12px', borderRadius: 'var(--radius-control)' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Upload size={14} /> Attach Provider Evidence (Photos / Work Receipts)
        </label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={busy}
          style={{ fontSize: '12px' }}
        />
        {evidenceFiles.length > 0 && (
          <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '11px', color: 'var(--color-ink)' }}>
            {evidenceFiles.map((f, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={12} /> {f.name} ({f.size})
                <button type="button" onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p role="alert" className="provider-error">{error}</p>}
      <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Response & Evidence'}</Button>
    </form>
  );
}

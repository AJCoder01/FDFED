import { useEffect, useState } from 'react';
import { useApp } from '../../app/context/AppContext';
import { saveProvider } from '../../data/mockRepository';
import { TextField } from '../../design-system/primitives/TextField';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';

export function ProviderOnboardingPage() {
  const { currentUser, showToast } = useApp();
  const [form, setForm] = useState({ businessName: '', serviceArea: '', skills: '', documentName: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saved = JSON.stringify([currentUser.businessName, currentUser.serviceArea, currentUser.skills, currentUser.documentName]);
  useEffect(() => {
    const [businessName, serviceArea, skills, documentName] = JSON.parse(saved);
    setForm({ businessName, serviceArea, skills: skills.join(', '), documentName: documentName || '' });
  }, [saved]);
  const change = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));
  const save = async (event, submit = false) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await saveProvider(currentUser.id, { ...form, skills: form.skills.split(',').map(skill => skill.trim()).filter(Boolean) }, submit);
      showToast(submit ? 'Verification profile submitted for Admin review.' : 'Provider profile saved.');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="provider-page provider-narrow">
      <div className="page-header"><h1 className="page-title">Provider Verification & Profile</h1><p className="page-subtitle">Manage your business details and verification profile</p></div>
      <form className="card provider-stack" onSubmit={save}>
        <div className="provider-record provider-row provider-between"><strong>Current Verification Status</strong><StatusBadge status={currentUser.verificationStatus} /></div>
        {currentUser.verificationFeedback && <p className="provider-hint">{currentUser.verificationFeedback}</p>}
        <TextField name="businessName" label="Business / Trading Name" value={form.businessName} onChange={change} required disabled={busy} />
        <TextField name="serviceArea" label="Service Coverage Area" value={form.serviceArea} onChange={change} required disabled={busy} multiline />
        <TextField name="skills" label="Trade Skills (Comma separated)" value={form.skills} onChange={change} required disabled={busy} />
        <TextField name="documentName" label="Verification Document Filename" value={form.documentName} onChange={change} disabled={busy} helperText="Demo document record only; no real identity document is uploaded or verified." />
        <TextField name="provider-email" label="Email" value={currentUser.email} disabled />
        <TextField name="provider-phone" label="Phone" value={currentUser.phone} disabled />
        {error && <p role="alert" className="provider-error">{error}</p>}
        <div className="provider-row">
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Profile'}</Button>
          <Button variant="outline" disabled={busy || currentUser.verificationStatus === 'submitted'} onClick={event => save(event, true)}>Submit for Verification</Button>
        </div>
      </form>
    </div>
  );
}

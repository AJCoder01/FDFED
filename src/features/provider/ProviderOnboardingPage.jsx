import { useEffect, useState } from 'react';
import { useApp } from '../../app/context/AppContext';
import { saveProvider } from '../../data/mockRepository';
import { TextField } from '../../design-system/primitives/TextField';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';

export function ProviderOnboardingPage() {
  const { currentUser, showToast } = useApp();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    avatar: '',
    businessName: '',
    serviceArea: '',
    skills: '',
    documentName: ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const saved = JSON.stringify([
    currentUser.name,
    currentUser.phone,
    currentUser.avatar,
    currentUser.businessName,
    currentUser.serviceArea,
    currentUser.skills,
    currentUser.documentName
  ]);

  useEffect(() => {
    const [name, phone, avatar, businessName, serviceArea, skills, documentName] = JSON.parse(saved);
    setForm({
      name: name || '',
      phone: phone || '',
      avatar: avatar || DEFAULT_BLANK_AVATAR,
      businessName: businessName || '',
      serviceArea: serviceArea || '',
      skills: (skills || []).join(', '),
      documentName: documentName || ''
    });
  }, [saved]);

  const change = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));

  const save = async (event, submit = false) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await saveProvider(currentUser.id, {
        ...form,
        skills: form.skills.split(',').map(skill => skill.trim()).filter(Boolean)
      }, submit);
      showToast(submit ? 'Verification profile submitted for Admin review.' : 'Provider profile saved.', 'success');
    } catch (error) {
      setError(error.message);
      showToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="provider-page provider-narrow" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Provider Profile & Verification</h1>
        <p className="page-subtitle">Manage business credentials, contact info, trade skills, and verification status.</p>
      </div>
      <form className="card provider-stack" onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px' }}>
        <div className="provider-record provider-row provider-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <strong>Current Verification Status</strong>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '2px 0 0 0' }}>Verified providers appear in public marketplace search</p>
          </div>
          <StatusBadge status={currentUser.verificationStatus} />
        </div>
        {currentUser.verificationFeedback && <p className="provider-hint" style={{ fontSize: '13px', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '10px 14px', borderRadius: 'var(--radius-control)' }}>{currentUser.verificationFeedback}</p>}

        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-ink)', marginTop: '8px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
          Personal & Contact Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <TextField name="name" label="Contact Person / Full Name *" value={form.name} onChange={change} required disabled={busy} placeholder="e.g. Ramesh Kumar" />
          <TextField name="phone" label="Contact Phone Number" value={form.phone} onChange={change} disabled={busy} placeholder="e.g. +91 98888 77665" />
        </div>

        <div>
          <TextField name="avatar" label="Profile Avatar URL (or use Blank Default Silhouette)" value={form.avatar} onChange={change} disabled={busy} placeholder="https://..." helperText="Paste an image URL or reset to default blank avatar silhouette" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
            <img
              src={form.avatar || DEFAULT_BLANK_AVATAR}
              alt="Avatar preview"
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-success)' }}
              onError={(e) => { e.currentTarget.src = DEFAULT_BLANK_AVATAR; }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm(f => ({ ...f, avatar: DEFAULT_BLANK_AVATAR }))}
            >
              Use Blank Silhouette Avatar
            </Button>
          </div>
        </div>

        <TextField name="provider-email" label="Account Email (Read-Only)" value={currentUser.email} disabled helperText="Used for authentication and dispatch communications" />

        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-ink)', marginTop: '12px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
          Business & Service Information
        </h3>
        <TextField name="businessName" label="Business / Trading Name *" value={form.businessName} onChange={change} required disabled={busy} placeholder="e.g. Urban Clean Pro & Pest Solutions" />
        <TextField name="serviceArea" label="Service Coverage Area *" value={form.serviceArea} onChange={change} required disabled={busy} placeholder="e.g. Bengaluru Urban, Indiranagar, Whitefield, Koramangala" multiline />
        <TextField name="skills" label="Trade Skills (Comma separated) *" value={form.skills} onChange={change} required disabled={busy} placeholder="Cleaning, Electrical, Plumbing, Appliance Repair" helperText="Used to match custom job requests and catalog filters" />
        <TextField name="documentName" label="Verification Document Record" value={form.documentName} onChange={change} disabled={busy} placeholder="e.g. trade-license-ka-2025.pdf" helperText="Demo document record only; no real identity document is uploaded or verified." />

        {error && <p role="alert" className="provider-error" style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: '600' }}>{error}</p>}
        <div className="provider-row" style={{ display: 'flex', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <Button type="submit" disabled={busy}>{busy ? 'Saving Profile…' : 'Save Profile Details'}</Button>
          <Button variant="outline" disabled={busy || currentUser.verificationStatus === 'submitted'} onClick={event => save(event, true)}>Submit for Verification</Button>
        </div>
      </form>
    </div>
  );
}

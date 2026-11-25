import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useApp } from '../../app/context/AppContext';
import { saveProvider } from '../../store/slices/usersSlice';
import { TextField } from '../../design-system/primitives/TextField';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { Upload } from 'lucide-react';
import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';

export function ProviderOnboardingPage() {
  const dispatch = useDispatch();
  const { currentUser, showToast } = useApp();

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, avatar: ev.target.result }));
    reader.readAsDataURL(file);
  };
  const [form, setForm] = useState({
    name: '',
    phone: '',
    avatar: '',
    providerType: 'company',
    businessName: '',
    operatingCity: 'Bengaluru',
    serviceArea: '',
    servedPincodes: '',
    coverageRadiusKm: 25,
    experienceYears: '',
    bio: '',
    skills: '',
    documentName: ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const saved = JSON.stringify([
    currentUser.name,
    currentUser.phone,
    currentUser.avatar,
    currentUser.providerType,
    currentUser.businessName,
    currentUser.operatingCity,
    currentUser.serviceArea,
    currentUser.servedPincodes,
    currentUser.coverageRadiusKm,
    currentUser.experienceYears,
    currentUser.bio,
    currentUser.skills,
    currentUser.documentName
  ]);

  useEffect(() => {
    const [
      name,
      phone,
      avatar,
      providerType,
      businessName,
      operatingCity,
      serviceArea,
      servedPincodes,
      coverageRadiusKm,
      experienceYears,
      bio,
      skills,
      documentName
    ] = JSON.parse(saved);
    setForm({
      name: name || '',
      phone: phone || '',
      avatar: avatar || DEFAULT_BLANK_AVATAR,
      providerType: providerType || 'company',
      businessName: businessName || '',
      operatingCity: operatingCity || 'Bengaluru',
      serviceArea: serviceArea || '',
      servedPincodes: Array.isArray(servedPincodes) ? servedPincodes.join(', ') : '',
      coverageRadiusKm: coverageRadiusKm ?? 25,
      experienceYears: experienceYears ?? '',
      bio: bio || '',
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
      const areaTokens = form.serviceArea.split(',').map(s => s.trim()).filter(Boolean);
      const pinTokens = form.servedPincodes.split(',').map(s => s.trim()).filter(Boolean);
      await dispatch(saveProvider({
        providerId: currentUser.id,
        values: {
          ...form,
          servedAreas: areaTokens,
          servedPincodes: pinTokens,
          coverageRadiusKm: Number(form.coverageRadiusKm) || 25,
          experienceYears: form.experienceYears !== '' ? Number(form.experienceYears) : undefined,
          skills: form.skills.split(',').map(skill => skill.trim()).filter(Boolean)
        },
        submit
      })).unwrap();
      showToast(submit ? 'Verification profile submitted for Admin review.' : 'Provider profile saved.', 'success');
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message;
      setError(msg);
      showToast(msg, 'error');
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>Profile Picture</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src={form.avatar || DEFAULT_BLANK_AVATAR}
              alt="Avatar preview"
              style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-success)', backgroundColor: 'var(--color-page-bg)' }}
              onError={(e) => { e.currentTarget.src = DEFAULT_BLANK_AVATAR; }}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="file"
                id="providerAvatarUpload"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarFile}
                disabled={busy}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Upload}
                onClick={() => document.getElementById('providerAvatarUpload').click()}
                disabled={busy}
              >
                Upload Picture
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setForm(f => ({ ...f, avatar: DEFAULT_BLANK_AVATAR }))}
                disabled={busy}
              >
                Clear to Empty Avatar
              </Button>
            </div>
          </div>
        </div>

        <TextField name="provider-email" label="Account Email (Read-Only)" value={currentUser.email} disabled helperText="Used for authentication and dispatch communications" />

        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-ink)', marginTop: '12px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
          Provider Type, Business & Coverage Area
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { value: 'individual', label: 'Individual Freelancer' },
            { value: 'company', label: 'Registered Company / Agency' },
          ].map(opt => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1.5px solid ${form.providerType === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                backgroundColor: form.providerType === opt.value ? 'var(--color-primary-light)' : 'transparent',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="providerType"
                value={opt.value}
                checked={form.providerType === opt.value}
                onChange={change}
                disabled={busy}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <TextField name="businessName" label={form.providerType === 'individual' ? 'Display / Brand Name *' : 'Business / Trading Name *'} value={form.businessName} onChange={change} required disabled={busy} placeholder={form.providerType === 'individual' ? 'e.g. Vikram Joshi Plumbing' : 'e.g. Urban Clean Pro & Pest Solutions'} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <TextField name="operatingCity" label="Operating City *" value={form.operatingCity} onChange={change} required disabled={busy} placeholder="e.g. Bengaluru" />
          <TextField name="coverageRadiusKm" label="Coverage Radius (km)" type="number" min="1" max="100" value={form.coverageRadiusKm} onChange={change} disabled={busy} />
        </div>
        <TextField name="serviceArea" label="Service Coverage Areas (Comma separated) *" value={form.serviceArea} onChange={change} required disabled={busy} placeholder="e.g. Indiranagar, Whitefield, Koramangala" multiline />
        <TextField name="servedPincodes" label="Served PIN Codes (Comma separated)" value={form.servedPincodes} onChange={change} disabled={busy} placeholder="e.g. 560038, 560066, 560034" />
        {form.providerType === 'individual' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <TextField name="experienceYears" label="Experience (Years)" type="number" min="0" value={form.experienceYears} onChange={change} disabled={busy} placeholder="e.g. 5" />
            <TextField name="bio" label="Short Bio / Specialization" value={form.bio} onChange={change} disabled={busy} placeholder="e.g. Certified technician specializing in home plumbing" />
          </div>
        )}
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

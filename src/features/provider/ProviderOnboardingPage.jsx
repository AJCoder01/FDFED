import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, fetchCurrentUserThunk } from '../../store/slices/authSlice';
import { saveProviderThunk } from '../../store/slices/usersSlice';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { Upload } from 'lucide-react';
import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';

export function ProviderOnboardingPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const { showToast } = useApp();

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
    businessName: '',
    serviceArea: '',
    skills: '',
    documentName: ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const saved = JSON.stringify([
    currentUser?.name,
    currentUser?.phone,
    currentUser?.avatar,
    currentUser?.businessName,
    currentUser?.serviceArea,
    currentUser?.skills,
    currentUser?.documentName
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
      const skillsArray = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      await dispatch(saveProviderThunk({
        id: currentUser.id,
        values: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          avatar: form.avatar.trim() || DEFAULT_BLANK_AVATAR,
          businessName: form.businessName.trim(),
          serviceArea: form.serviceArea.trim(),
          skills: skillsArray,
          documentName: form.documentName.trim()
        },
        submit
      })).unwrap();
      await dispatch(fetchCurrentUserThunk()).unwrap();
      showToast(submit ? 'Application submitted for moderation.' : 'Draft saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="provider-page">
      <div className="page-header">
        <h1 className="page-title">Provider Profile & Verification</h1>
        <p className="page-subtitle">Submit credentials and business information for administrator approval</p>
      </div>

      <div className="card provider-stack">
        <div className="provider-row provider-between">
          <h2>Verification Status</h2>
          <StatusBadge status={currentUser?.verificationStatus} />
        </div>
        {currentUser?.verificationFeedback && (
          <p className="provider-record">Admin Feedback: {currentUser.verificationFeedback}</p>
        )}

        <form className="provider-stack" onSubmit={e => save(e, false)}>
          <div className="provider-row" style={{ alignItems: 'center', gap: '16px' }}>
            <img
              src={form.avatar || DEFAULT_BLANK_AVATAR}
              alt="Profile"
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
            />
            <label style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
              <span className="btn btn-sm btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> Upload Avatar
              </span>
            </label>
          </div>

          <div className="provider-row">
            <TextField name="name" label="Full Name" value={form.name} onChange={change} required />
            <TextField name="phone" label="Phone" value={form.phone} onChange={change} required />
          </div>

          <div className="provider-row">
            <TextField name="businessName" label="Business / Trade Name" value={form.businessName} onChange={change} required />
            <TextField name="serviceArea" label="Operating City / Region" value={form.serviceArea} onChange={change} required />
          </div>

          <TextField
            name="skills"
            label="Service Specialties (comma separated)"
            value={form.skills}
            onChange={change}
            placeholder="e.g. Plumbing, Leak Repair, Water Heater Installation"
            required
          />

          <TextField
            name="documentName"
            label="Verification Document Reference / License"
            value={form.documentName}
            onChange={change}
            placeholder="e.g. Trade License #TR-88912 or Govt ID"
          />

          {error && <p role="alert" className="provider-error">{error}</p>}

          <div className="provider-row">
            <Button type="submit" variant="secondary" disabled={busy}>
              Save Draft
            </Button>
            <Button
              type="button"
              disabled={busy || currentUser?.verificationStatus === 'submitted' || currentUser?.verificationStatus === 'approved'}
              onClick={e => save(e, true)}
            >
              {currentUser?.verificationStatus === 'submitted' ? 'Application Under Review' : 'Submit for Admin Approval'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

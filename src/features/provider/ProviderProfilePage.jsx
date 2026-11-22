import React, { useState, useEffect } from 'react';
import {
  Wrench,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Star,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  Edit3,
  Save,
  X,
  Upload,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, fetchCurrentUserThunk } from '../../store/slices/authSlice';
import { saveProviderThunk } from '../../store/slices/usersSlice';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { PhoneInputField, validatePhoneNumber } from '../../design-system/primitives/PhoneInputField';
import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';

export function ProviderProfilePage() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const { showToast } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || DEFAULT_BLANK_AVATAR);
  const [businessName, setBusinessName] = useState(currentUser?.businessName || '');
  const [serviceArea, setServiceArea] = useState(currentUser?.serviceArea || '');
  const [skills, setSkills] = useState((currentUser?.skills || []).join(', '));
  const [documentName, setDocumentName] = useState(currentUser?.documentName || '');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Keep state synced with currentUser changes
  useEffect(() => {
    if (!isEditing) {
      setName(currentUser?.name || '');
      setPhone(currentUser?.phone || '');
      setAvatar(currentUser?.avatar || DEFAULT_BLANK_AVATAR);
      setBusinessName(currentUser?.businessName || '');
      setServiceArea(currentUser?.serviceArea || '');
      setSkills((currentUser?.skills || []).join(', '));
      setDocumentName(currentUser?.documentName || '');
      setError('');
    }
  }, [currentUser, isEditing]);

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e, submitForVerification = false) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty.', 'warning');
      return;
    }
    if (!businessName.trim()) {
      showToast('Business Name cannot be empty.', 'warning');
      return;
    }

    if (phone) {
      const phoneErr = validatePhoneNumber(phone);
      if (phoneErr) {
        showToast(phoneErr, 'warning');
        return;
      }
    }

    setBusy(true);
    setError('');

    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      await dispatch(saveProviderThunk({
        id: currentUser.id,
        values: {
          name: name.trim(),
          phone: phone.trim(),
          avatar: avatar.trim() || DEFAULT_BLANK_AVATAR,
          businessName: businessName.trim(),
          serviceArea: serviceArea.trim(),
          skills: skillsArray,
          documentName: documentName.trim()
        },
        submit: submitForVerification
      })).unwrap();
      await dispatch(fetchCurrentUserThunk()).unwrap();
      setIsEditing(false);
      showToast(submitForVerification ? 'Profile and credentials submitted for Admin review.' : 'Profile changes saved.', 'success');
    } catch (err) {
      setError(err.message || 'Failed to update provider profile.');
      showToast(err.message || 'Update failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Provider Profile & Credentials</h1>
          <p className="page-subtitle">Manage your verified marketplace profile, services, and trade credentials</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!isEditing ? (
            <Button variant="primary" icon={Edit3} onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="secondary" icon={X} onClick={() => setIsEditing(false)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="primary" icon={Save} onClick={e => handleSaveProfile(e, false)} disabled={busy}>
                {busy ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }} className="grid-cols-2">
        {/* Left Column: Avatar & Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '32px' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={avatar}
              alt={name}
              style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-border)', backgroundColor: 'var(--color-primary-light)' }}
              onError={e => { e.currentTarget.src = DEFAULT_BLANK_AVATAR; }}
            />
            {isEditing && (
              <label style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: 'var(--color-primary)', color: '#FFF', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                <Upload size={16} />
                <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-ink)', margin: 0 }}>{businessName || name}</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>Lead Contractor: {name}</p>
          </div>

          <StatusBadge status={currentUser?.verificationStatus} />
          {currentUser?.verificationFeedback && (
            <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '12px', borderRadius: 'var(--radius-control)', fontSize: '12px', color: 'var(--color-muted)', width: '100%', textAlign: 'left' }}>
              <strong>Admin Feedback:</strong> {currentUser.verificationFeedback}
            </div>
          )}
        </div>

        {/* Right Column: Profile Details */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Business & Contact Information</h2>

          {!isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><strong style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Business Name:</strong> <div style={{ fontSize: '15px', color: 'var(--color-ink)' }}>{businessName}</div></div>
              <div><strong style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Contact Name:</strong> <div style={{ fontSize: '15px', color: 'var(--color-ink)' }}>{name}</div></div>
              <div><strong style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Email:</strong> <div style={{ fontSize: '15px', color: 'var(--color-ink)' }}>{currentUser?.email}</div></div>
              <div><strong style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Phone:</strong> <div style={{ fontSize: '15px', color: 'var(--color-ink)' }}>{phone || 'Not provided'}</div></div>
              <div><strong style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Service Region:</strong> <div style={{ fontSize: '15px', color: 'var(--color-ink)' }}>{serviceArea || 'Not specified'}</div></div>
              <div><strong style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Skills & Specialties:</strong> <div style={{ fontSize: '15px', color: 'var(--color-ink)' }}>{skills || 'None'}</div></div>
              <div><strong style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Document / License:</strong> <div style={{ fontSize: '15px', color: 'var(--color-ink)' }}>{documentName || 'Not submitted'}</div></div>
            </div>
          ) : (
            <form onSubmit={e => handleSaveProfile(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TextField label="Business Name" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
              <TextField label="Contact Person Name" value={name} onChange={e => setName(e.target.value)} required />
              <TextField label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required />
              <TextField label="Service Area / City" value={serviceArea} onChange={e => setServiceArea(e.target.value)} required />
              <TextField label="Skills (comma separated)" value={skills} onChange={e => setSkills(e.target.value)} required />
              <TextField label="Verification Document Record" value={documentName} onChange={e => setDocumentName(e.target.value)} />
              {error && <p role="alert" style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save Draft'}</Button>
                {currentUser?.verificationStatus !== 'approved' && (
                  <Button type="button" variant="primary" disabled={busy} onClick={e => handleSaveProfile(e, true)}>
                    Submit for Verification
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

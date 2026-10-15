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
import { useApp } from '../../app/context/AppContext';
import { saveProvider } from '../../data/mockRepository';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { PhoneInputField, validatePhoneNumber } from '../../design-system/primitives/PhoneInputField';
import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';

export function ProviderProfilePage() {
  const { currentUser, showToast } = useApp();

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
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCancelEdit = () => {
    setName(currentUser?.name || '');
    setPhone(currentUser?.phone || '');
    setAvatar(currentUser?.avatar || DEFAULT_BLANK_AVATAR);
    setBusinessName(currentUser?.businessName || '');
    setServiceArea(currentUser?.serviceArea || '');
    setSkills((currentUser?.skills || []).join(', '));
    setDocumentName(currentUser?.documentName || '');
    setError('');
    setIsEditing(false);
  };

  const handleSave = async (e, submit = false) => {
    if (e) e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full contact name.');
      return;
    }

    if (!businessName.trim()) {
      setError('Please enter a business or trading name.');
      return;
    }

    if (!serviceArea.trim()) {
      setError('Please enter your service coverage area.');
      return;
    }

    const skillsArray = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (skillsArray.length === 0) {
      setError('Please specify at least one trade skill or category.');
      return;
    }

    if (phone) {
      const phoneErr = validatePhoneNumber(phone);
      if (phoneErr) {
        setError(phoneErr);
        return;
      }
    }

    if (submit && !documentName.trim()) {
      setError('Please enter a document filename before submitting for verification.');
      return;
    }

    setBusy(true);
    try {
      await saveProvider(
        currentUser.id,
        {
          name: name.trim(),
          phone: phone.trim(),
          avatar: avatar.trim() || DEFAULT_BLANK_AVATAR,
          businessName: businessName.trim(),
          serviceArea: serviceArea.trim(),
          skills: skillsArray,
          documentName: documentName.trim()
        },
        submit
      );

      setIsEditing(false);
      showToast(
        submit
          ? 'Profile and credentials submitted for Admin review.'
          : 'Service provider profile updated successfully!',
        'success'
      );
    } catch (err) {
      setError(err.message || 'Unable to update provider profile.');
      showToast(err.message || 'Unable to update profile.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const skillList = (currentUser?.skills && currentUser.skills.length > 0)
    ? currentUser.skills
    : ['AC Maintenance', 'Electrical Repair', 'Appliance Repair'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Service Provider Profile</h1>
          <p className="page-subtitle">Manage business credentials, contact info, trade skills, and verification status.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant={isEditing ? 'outline' : 'primary'}
            size="sm"
            icon={isEditing ? X : Edit3}
            onClick={() => {
              if (isEditing) {
                handleCancelEdit();
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {/* Edit Profile Form Mode */}
      {isEditing && (
        <form onSubmit={(e) => handleSave(e, false)} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '22px', padding: '28px', border: '2px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Edit3 size={20} color="var(--color-primary)" />
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)' }}>Edit Provider Profile Details</h2>
            </div>
            <StatusBadge status="warning" label="Editing Active" />
          </div>

          {/* Profile Picture Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Profile Avatar
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src={avatar || DEFAULT_BLANK_AVATAR}
                alt="Avatar preview"
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-success)', backgroundColor: 'var(--color-page-bg)' }}
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
                  onClick={() => setAvatar(DEFAULT_BLANK_AVATAR)}
                  disabled={busy}
                >
                  Clear to Unknown Avatar
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <TextField
              label="Contact Person / Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rohan Verma"
              required
              disabled={busy}
            />
            <PhoneInputField
              label="Contact Phone Number *"
              value={phone}
              onChange={setPhone}
              required
              disabled={busy}
            />
          </div>

          <TextField
            label="Account Email (Read-Only)"
            value={currentUser?.email || ''}
            disabled
            helperText="Used for authentication and booking dispatch notices"
          />

          {/* Business Information */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-ink)' }}>Business & Trade Information</h3>

            <TextField
              label="Business / Trading Name *"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. UrbanFix Home Solutions"
              required
              disabled={busy}
            />

            <TextField
              label="Service Coverage Area *"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="e.g. Bengaluru"
              required
              disabled={busy}
            />

            <TextField
              label="Trade Skills (Comma separated) *"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="AC Maintenance, Electrical Repair, Appliance Repair, Plumbing"
              helperText="Comma-separated list used to match customer inquiries and directory categories"
              required
              disabled={busy}
            />

            <TextField
              label="Verification Document Record"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g. trade_license_ka_2026.pdf"
              helperText="Demo registration record; upload simulated filename for administrative verification"
              disabled={busy}
            />
          </div>

          {error && (
            <div role="alert" style={{ padding: '12px', borderRadius: 'var(--radius-control)', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px', flexWrap: 'wrap' }}>
            <Button type="button" variant="secondary" onClick={handleCancelEdit} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Save} disabled={busy}>
              {busy ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
            {currentUser?.verificationStatus !== 'approved' && (
              <Button type="button" variant="outline" icon={ShieldCheck} onClick={(e) => handleSave(e, true)} disabled={busy || currentUser?.verificationStatus === 'submitted'}>
                Submit for Verification
              </Button>
            )}
          </div>
        </form>
      )}

      {/* View Mode (Display Profile Cards) */}
      {!isEditing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Identity Card */}
          <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <img
              src={currentUser?.avatar || DEFAULT_BLANK_AVATAR}
              alt={currentUser?.name || 'Provider'}
              style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-success)', backgroundColor: 'var(--color-page-bg)' }}
              onError={(e) => { e.currentTarget.src = DEFAULT_BLANK_AVATAR; }}
            />
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>{currentUser?.businessName || currentUser?.name}</h2>
                <StatusBadge status={currentUser?.verificationStatus || 'approved'} />
              </div>
              <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> Contact Person: <strong>{currentUser?.name}</strong>
              </p>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', fontSize: '13px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#D97706', fontWeight: '700' }}>
                  <Star size={15} fill="#F59E0B" color="#F59E0B" /> {currentUser?.rating || 4.8} ({currentUser?.reviewCount || 34} verified reviews)
                </span>
                <span style={{ color: 'var(--color-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} /> {currentUser?.serviceArea || 'Bengaluru'}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Status Banner */}
          <div className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderLeft: '4px solid var(--color-success)' }}>
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>Platform Verification Record</strong>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                {currentUser?.verificationFeedback || 'Your business credentials and trade certification are verified by platform operations.'}
              </p>
              {currentUser?.documentName && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} /> Document: <code>{currentUser.documentName}</code>
                </div>
              )}
            </div>
            <StatusBadge status={currentUser?.verificationStatus || 'approved'} />
          </div>

          {/* Details 2-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Contact Details */}
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-ink)', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                Contact & Account Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={16} color="var(--color-primary)" />
                  <div>
                    <span style={{ color: 'var(--color-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>FULL NAME</span>
                    <strong style={{ color: 'var(--color-ink)' }}>{currentUser?.name || 'N/A'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={16} color="var(--color-primary)" />
                  <div>
                    <span style={{ color: 'var(--color-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>CONTACT PHONE</span>
                    <strong style={{ color: 'var(--color-ink)' }}>{currentUser?.phone || '+91 91234 56789'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={16} color="var(--color-primary)" />
                  <div>
                    <span style={{ color: 'var(--color-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>REGISTERED EMAIL</span>
                    <strong style={{ color: 'var(--color-ink)' }}>{currentUser?.email || 'rohan@gmail.com'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Business & Trade Skills */}
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-ink)', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                Business Trade & Coverage
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--color-muted)', display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>SERVICE COVERAGE AREA</span>
                  <strong style={{ color: 'var(--color-ink)' }}>{currentUser?.serviceArea || 'Bengaluru'}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--color-muted)', display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '8px' }}>PRIMARY TRADE SKILLS</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {skillList.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        <Wrench size={12} /> {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours Summary */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-ink)' }}>Standard Operating Hours</h3>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--color-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>ACTIVE WORKING DAYS</span>
                <strong style={{ color: 'var(--color-ink)' }}>Monday – Saturday</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>DAILY SHIFT HOURS</span>
                <strong style={{ color: 'var(--color-ink)' }}>09:00 AM – 07:00 PM</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-muted)', display: 'block', fontSize: '11px', fontWeight: '700' }}>SCHEDULE BUFFER</span>
                <strong style={{ color: 'var(--color-ink)' }}>15 mins travel buffer between slots</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

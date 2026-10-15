import React, { useState } from 'react';
import { Scale, User, Mail, Phone, ShieldCheck, CheckCircle2, Award, FileText, Calendar, Clock, MapPin, Gavel, Edit3, Save, X, Upload } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { PhoneInputField, validatePhoneNumber } from '../../design-system/primitives/PhoneInputField';
import { updateUserProfile, getDisputes } from '../../data/mockRepository';
import { useRepositoryQuery } from '../../data/useRepositoryQuery';
import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';

export function ArbitratorProfilePage() {
  const { currentUser, showToast } = useApp();
  const { data: disputes } = useRepositoryQuery(getDisputes);

  const myDisputes = (disputes || []).filter(
    (d) => d.arbitratorId === currentUser?.id || d.arbitratorId === 'user-arbit-1'
  );
  const activeDisputesCount = myDisputes.filter(
    (d) => d.status === 'assigned' || d.status === 'hearing_scheduled' || d.status === 'pending_assignment'
  ).length;
  const resolvedDisputesCount = myDisputes.filter(
    (d) => d.status === 'ruled' || d.status === 'closed'
  ).length;
  const awardsIssuedCount = myDisputes.filter((d) => Boolean(d.ruling)).length;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || DEFAULT_BLANK_AVATAR);
  const [title, setTitle] = useState(currentUser?.title || 'Senior Independent Arbitrator');
  const [saving, setSaving] = useState(false);

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCredentialVerify = () => {
    showToast('Arbitrator bar council credentials & digital signature verified.', 'success');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty.', 'warning');
      return;
    }

    if (phone) {
      const phoneErr = validatePhoneNumber(phone);
      if (phoneErr) {
        showToast(phoneErr, 'warning');
        return;
      }
    }

    setSaving(true);
    try {
      await updateUserProfile(currentUser.id, {
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar.trim() || DEFAULT_BLANK_AVATAR,
        title: title.trim()
      });
      setIsEditing(false);
      showToast('Arbitrator profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Arbitrator Profile & Accreditation</h1>
          <p className="page-subtitle">View and edit official panel credentials, contact details, and judicial standing.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant={isEditing ? 'outline' : 'primary'}
            size="sm"
            icon={isEditing ? X : Edit3}
            onClick={() => {
              if (isEditing) {
                setName(currentUser?.name || '');
                setPhone(currentUser?.phone || '');
                setAvatar(currentUser?.avatar || DEFAULT_BLANK_AVATAR);
                setTitle(currentUser?.title || 'Senior Independent Arbitrator');
              }
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {/* Edit Profile Form when active */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px', border: '2px solid var(--color-conflict)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Edit3 size={20} color="var(--color-conflict)" />
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)' }}>Edit Arbitrator Profile Details</h3>
            </div>
            <StatusBadge status="warning" label="Editing Active" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <TextField
              label="Full Legal Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kabir Malhotra"
              required
            />
            <PhoneInputField
              label="Direct Phone Number"
              value={phone}
              onChange={setPhone}
              helperText="Requires country code & 10-digit number"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <TextField
              label="Judicial Standing / Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Independent Arbitrator"
            />
            <TextField
              label="Tribunal Email (Read-Only)"
              value={currentUser?.email || ''}
              disabled
              helperText="Official judicial email registered with the arbitration panel"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>Profile Picture</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src={avatar || DEFAULT_BLANK_AVATAR}
                alt="Avatar preview"
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-conflict)', backgroundColor: 'var(--color-page-bg)' }}
                onError={(e) => { e.currentTarget.src = DEFAULT_BLANK_AVATAR; }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  id="arbitratorAvatarUpload"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarFile}
                  disabled={saving}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Upload}
                  onClick={() => document.getElementById('arbitratorAvatarUpload').click()}
                  disabled={saving}
                >
                  Upload Picture
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAvatar(DEFAULT_BLANK_AVATAR)}
                  disabled={saving}
                >
                  Clear to Empty Avatar
                </Button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setName(currentUser?.name || '');
                setPhone(currentUser?.phone || '');
                setAvatar(currentUser?.avatar || DEFAULT_BLANK_AVATAR);
                setTitle(currentUser?.title || 'Senior Independent Arbitrator');
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              disabled={saving}
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      )}

      {/* Main Profile Summary Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', padding: '32px' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={currentUser?.avatar || DEFAULT_BLANK_AVATAR}
            alt={currentUser?.name}
            style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-conflict)' }}
            onError={(e) => { e.currentTarget.src = DEFAULT_BLANK_AVATAR; }}
          />
          <div style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: '#10B981', width: '22px', height: '22px', borderRadius: '50%', border: '3px solid #FFF' }} />
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>{currentUser?.name || 'Kabir Malhotra'}</h2>
            <StatusBadge status="approved" label="Empaneled Arbitrator" />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-conflict)', fontWeight: '700', marginTop: '2px' }}>
            {currentUser?.title || 'Senior Independent Arbitrator'} • Indian Arbitration Panel
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: 'var(--color-muted)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={15} color="var(--color-primary)" /> {currentUser?.email || 'kabir@gmail.com'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={15} color="var(--color-primary)" /> {currentUser?.phone || '+91 94444 88888'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={15} color="var(--color-primary)" /> {currentUser?.location || currentUser?.country || 'Arbitration Tribunal, India'}</span>
          </div>
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-cols-2">
        
        {/* Left: Judicial & Panel Credentials */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--color-conflict-bg)', color: 'var(--color-conflict)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scale size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-ink)' }}>Judicial Credentials</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Official bar standing & panel registration</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Roster Panel ID</span>
              <strong style={{ color: 'var(--color-ink)', fontFamily: 'monospace' }}>ARB-IND-509</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Bar Council Reg.</span>
              <strong style={{ color: 'var(--color-ink)' }}>KAR/1988/4092</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Specialization</span>
              <strong style={{ color: 'var(--color-ink)' }}>Contractual & Escrow Disputes</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Appointed Date</span>
              <strong style={{ color: 'var(--color-ink)' }}>March 10, 2025</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Jurisdiction</span>
              <strong style={{ color: 'var(--color-primary)' }}>Pan-India Digital Arbitration</strong>
            </div>
          </div>
        </div>

        {/* Right: Dispute Resolution Performance Metrics */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gavel size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-ink)' }}>Tribunal Performance</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Dispute case statistics & ruling records</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>{resolvedDisputesCount}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', fontWeight: '600' }}>Total Cases Resolved</div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-warning)' }}>{activeDisputesCount}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', fontWeight: '600' }}>Active Disputes</div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#10B981' }}>{awardsIssuedCount}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', fontWeight: '600' }}>Final Awards Issued</div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-primary)' }}>3.5 Days</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', fontWeight: '600' }}>Avg. Resolution Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Code of Neutrality & Digital Signature Banner */}
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(217, 119, 6, 0.1)', color: 'var(--color-conflict)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-ink)' }}>Independent & Neutral Adjudication Protocol</h4>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '2px' }}>
              Bound by the Indian Arbitration & Conciliation Act • Digital Signature Certificate Verified
            </p>
          </div>
        </div>
        <StatusBadge status="approved" label="Certified Neutral" />
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Scale, User, Mail, Phone, ShieldCheck, CheckCircle2, Award, FileText, Calendar, Clock, MapPin, Gavel, Edit3, Save, X } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { updateUserProfile } from '../../data/mockRepository';
import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';

export function ArbitratorProfilePage() {
  const { currentUser, showToast } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || DEFAULT_BLANK_AVATAR);
  const [title, setTitle] = useState(currentUser?.title || 'Senior Independent Arbitrator');
  const [saving, setSaving] = useState(false);

  const handleCredentialVerify = () => {
    showToast('Arbitrator bar council credentials & digital signature verified.', 'success');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty.', 'warning');
      return;
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
          <Button variant="outline" size="sm" icon={ShieldCheck} onClick={handleCredentialVerify}>
            Verify Accreditation
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
              placeholder="e.g. Justice V. K. Sundaram (Retd.)"
              required
            />
            <TextField
              label="Direct Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 94444 88888"
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

          <div>
            <TextField
              label="Avatar Image URL (or use Blank Default Silhouette)"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
              helperText="Paste an image URL or reset to default blank avatar"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
              <img
                src={avatar || DEFAULT_BLANK_AVATAR}
                alt="Avatar preview"
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-conflict)' }}
                onError={(e) => { e.currentTarget.src = DEFAULT_BLANK_AVATAR; }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAvatar(DEFAULT_BLANK_AVATAR)}
              >
                Use Blank Silhouette Avatar
              </Button>
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
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>{currentUser?.name || 'Justice V. K. Sundaram (Retd.)'}</h2>
            <StatusBadge status="approved" label="Empaneled Arbitrator" />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-conflict)', fontWeight: '700', marginTop: '2px' }}>
            {currentUser?.title || 'Senior Independent Arbitrator'} • Indian Arbitration Panel
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: 'var(--color-muted)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={15} color="var(--color-primary)" /> {currentUser?.email || 'arbitrator.sundaram@servicehub.in'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={15} color="var(--color-primary)" /> {currentUser?.phone || '+91 94444 88888'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={15} color="var(--color-primary)" /> Arbitration Tribunal, Bengaluru</span>
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
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>18</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', fontWeight: '600' }}>Total Cases Resolved</div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-warning)' }}>1</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', fontWeight: '600' }}>Active Dispute (#DISP-101)</div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#10B981' }}>17</div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', fontWeight: '600' }}>Final Awards Issued</div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-primary)' }}>4.2 Days</div>
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

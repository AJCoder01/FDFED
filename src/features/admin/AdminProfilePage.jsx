import React, { useState } from 'react';
import { Shield, User, Mail, Phone, Lock, CheckCircle2, Award, Server, Key, MapPin, Calendar, Clock, Edit3, Save, X, Upload } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';
import { updateUserProfile } from '../../data/mockRepository';
import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';

export function AdminProfilePage() {
  const { currentUser, showToast } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || DEFAULT_BLANK_AVATAR);
  const [department, setDepartment] = useState(currentUser?.department || 'Platform Operations & Compliance');
  const [saving, setSaving] = useState(false);

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSecurityCheck = () => {
    showToast('Admin security session verified cleanly.', 'success');
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
        department: department.trim()
      });
      setIsEditing(false);
      showToast('Admin profile updated successfully!', 'success');
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
          <h1 className="page-title">Administrator Profile</h1>
          <p className="page-subtitle">View and edit account metadata, contact details, and system permissions.</p>
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
                setDepartment(currentUser?.department || 'Platform Operations & Compliance');
              }
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </Button>
          <Button variant="outline" size="sm" icon={Key} onClick={handleSecurityCheck}>
            Verify Security
          </Button>
        </div>
      </div>

      {/* Edit Profile Form when active */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px', border: '2px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Edit3 size={20} color="var(--color-warning)" />
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)' }}>Edit Administrator Profile Details</h3>
            </div>
            <StatusBadge status="warning" label="Editing Active" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <TextField
              label="Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Nair"
              required
            />
            <TextField
              label="Contact Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 99000 11223"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <TextField
              label="Operations Role / Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Marketplace Operations & Compliance"
            />
            <TextField
              label="Account Email (Read-Only)"
              value={currentUser?.email || ''}
              disabled
              helperText="Primary administrator credential managed under root governance"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>Profile Picture</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src={avatar || DEFAULT_BLANK_AVATAR}
                alt="Avatar preview"
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-warning)', backgroundColor: 'var(--color-page-bg)' }}
                onError={(e) => { e.currentTarget.src = DEFAULT_BLANK_AVATAR; }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  id="adminAvatarUpload"
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
                  onClick={() => document.getElementById('adminAvatarUpload').click()}
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
                setDepartment(currentUser?.department || 'Platform Operations & Compliance');
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
            style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-warning)' }}
            onError={(e) => { e.currentTarget.src = DEFAULT_BLANK_AVATAR; }}
          />
          <div style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: '#10B981', width: '22px', height: '22px', borderRadius: '50%', border: '3px solid #FFF' }} />
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>{currentUser?.name || 'Priya Nair'}</h2>
            <StatusBadge status="approved" label={currentUser?.isSuperUser ? 'Active SuperUser' : 'Active Admin'} />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: '700', marginTop: '2px' }}>
            {currentUser?.department || 'Platform Operations Lead & Marketplace Compliance Administrator'}
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: 'var(--color-muted)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={15} color="var(--color-primary)" /> {currentUser?.email || 'admin.ops@servicehub.in'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={15} color="var(--color-primary)" /> {currentUser?.phone || '+91 99000 11223'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={15} color="var(--color-primary)" /> {currentUser?.location || 'ServiceHub HQ, Bengaluru'}</span>
          </div>
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-cols-2">
        
        {/* Left: Account Metadata */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-ink)' }}>Account Information</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Role assignment & identity metadata</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>User ID</span>
              <strong style={{ color: 'var(--color-ink)', fontFamily: 'monospace' }}>{currentUser?.id || 'user-admin-1'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>System Role</span>
              <span style={{ fontWeight: '700', color: 'var(--color-warning)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.04em' }}>
                {currentUser?.isSuperUser ? 'SuperUser' : 'Admin'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Access Level</span>
              <strong style={{ color: 'var(--color-ink)' }}>
                {currentUser?.isSuperUser ? 'SuperUser (Root Access & Multi-Actor Demo)' : 'Admin (Platform Operations)'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Account Created</span>
              <strong style={{ color: 'var(--color-ink)' }}>January 15, 2025</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Last Session Login</span>
              <strong style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                Active Now
              </strong>
            </div>
          </div>
        </div>

        {/* Right: Operational Permissions */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-ink)' }}>Operational Capabilities</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Authorized administrative powers</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'Provider Onboarding Verification & Approval',
              'Catalog Listing Inspection & Moderation',
              'Escrow Payment & Booking Audit Access',
              'Support Ticket Triage & Escalation',
              'Dispute Assignment to Arbitrator Roster',
              'System Category & Sub-category Management'
            ].map((capability, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--color-ink)', fontWeight: '600' }}>
                <CheckCircle2 size={16} color="#10B981" />
                {capability}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Clearance Footer Banner */}
      <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-ink)' }}>Security & Compliance Status</h4>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '2px' }}>
              Multi-factor Hardware Key Enabled • 256-Bit SSL Encrypted Admin Control Panel
            </p>
          </div>
        </div>
        <StatusBadge status="success" label="Fully Compliant" />
      </div>
    </div>
  );
}

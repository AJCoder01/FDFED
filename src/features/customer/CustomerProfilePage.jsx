import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Plus, Trash2, CheckCircle2, Save, Edit3 } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { updateUserProfile } from '../../data/mockRepository';
import { TextField } from '../../design-system/primitives/TextField';
import { Button } from '../../design-system/primitives/Button';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';

export function CustomerProfilePage() {
  const { currentUser, showToast } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || DEFAULT_BLANK_AVATAR);
  const [addresses, setAddresses] = useState(currentUser?.addresses || []);

  const [newAddressOpen, setNewAddressOpen] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: 'Home', addressLine: '', city: '', pincode: '', isDefault: false });
  const [saving, setSaving] = useState(false);

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
        addresses
      });
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddr.addressLine.trim() || !newAddr.city.trim() || !/^\d{6}$/.test(newAddr.pincode.trim())) {
      showToast('Please enter a valid street address, city, and 6-digit PIN code.', 'warning');
      return;
    }

    const created = {
      id: `addr-${crypto.randomUUID().slice(0, 8)}`,
      label: newAddr.label,
      addressLine: newAddr.addressLine.trim(),
      city: newAddr.city.trim(),
      pincode: newAddr.pincode.trim(),
      isDefault: addresses.length === 0 || newAddr.isDefault
    };

    let updated = [...addresses];
    if (created.isDefault) {
      updated = updated.map(a => ({ ...a, isDefault: false }));
    }
    updated.push(created);
    setAddresses(updated);
    setNewAddressOpen(false);
    setNewAddr({ label: 'Home', addressLine: '', city: '', pincode: '', isDefault: false });
    showToast('New address added. Click "Save Changes" to persist.', 'info');
  };

  const handleRemoveAddress = (addressId) => {
    const updated = addresses.filter(a => a.id !== addressId);
    if (updated.length > 0 && !updated.some(a => a.isDefault)) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
  };

  const handleSetDefaultAddress = (addressId) => {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: a.id === addressId
    }));
    setAddresses(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Customer Profile</h1>
          <p className="page-subtitle">Manage personal contact details, saved delivery addresses, and account preferences.</p>
        </div>
        <Button
          variant={isEditing ? 'outline' : 'primary'}
          icon={isEditing ? null : Edit3}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </Button>
      </div>

      {/* Main Profile Summary Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', padding: '32px' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={currentUser?.avatar || DEFAULT_BLANK_AVATAR}
            alt={currentUser?.name}
            style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary-light)', backgroundColor: 'var(--color-page-bg)' }}
          />
          <div style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: '#10B981', width: '22px', height: '22px', borderRadius: '50%', border: '3px solid #FFF' }} />
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>{currentUser?.name || 'Customer'}</h2>
            <StatusBadge status="approved" label="Verified Customer" />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '2px' }}>
            ServiceHub Verified Household Member
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: 'var(--color-muted)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={15} color="var(--color-primary)" /> {currentUser?.email}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={15} color="var(--color-primary)" /> {currentUser?.phone || '+91 98765 43210'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={15} color="var(--color-primary)" /> {addresses[0]?.city || 'Bengaluru'}</span>
          </div>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
            Edit Profile Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-cols-2">
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <TextField
            label="Email Address (Login ID)"
            value={currentUser?.email || ''}
            disabled
            helperText="Email is your registered account ID and cannot be altered."
          />

          <TextField
            label="Profile Picture URL (Optional)"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://... (Leave blank for default placeholder avatar)"
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      ) : null}

      {/* Address Book Section */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)' }}>Saved Service Delivery Addresses</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '2px' }}>Addresses used for booking dispatches & technician navigation</p>
          </div>
          <Button variant="outline" size="sm" icon={Plus} onClick={() => setNewAddressOpen(!newAddressOpen)}>
            Add New Address
          </Button>
        </div>

        {newAddressOpen && (
          <form onSubmit={handleAddAddress} style={{ padding: '16px', borderRadius: 'var(--radius-control)', backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>Add New Delivery Address</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <TextField
                label="Label"
                value={newAddr.label}
                onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                placeholder="Home / Work / Other"
                required
              />
              <TextField
                label="Street Address / Flat / Society"
                value={newAddr.addressLine}
                onChange={(e) => setNewAddr({ ...newAddr, addressLine: e.target.value })}
                placeholder="e.g. Flat 301, Lakeview Residency"
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <TextField
                label="City"
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                placeholder="e.g. Bengaluru"
                required
              />
              <TextField
                label="6-Digit PIN Code"
                value={newAddr.pincode}
                onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                placeholder="e.g. 560103"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <Button type="button" variant="outline" size="sm" onClick={() => setNewAddressOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Add Address
              </Button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderRadius: 'var(--radius-control)',
                border: addr.isDefault ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: addr.isDefault ? 'rgba(37, 99, 235, 0.04)' : 'var(--color-surface)',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <MapPin size={20} color={addr.isDefault ? 'var(--color-primary)' : 'var(--color-muted)'} style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>{addr.label}</strong>
                    {addr.isDefault && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: '4px' }}>
                        Default Address
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '4px 0 0 0' }}>
                    {addr.addressLine}, {addr.city} – {addr.pincode}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!addr.isDefault && (
                  <Button variant="outline" size="sm" onClick={() => handleSetDefaultAddress(addr.id)}>
                    Set as Default
                  </Button>
                )}
                {addresses.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveAddress(addr.id)} aria-label="Remove Address">
                    <Trash2 size={16} color="var(--color-danger)" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {addresses.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <Button variant="primary" icon={Save} onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

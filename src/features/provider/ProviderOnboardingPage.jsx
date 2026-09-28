import React, { useState } from 'react';
import { Shield, CheckCircle2, Upload } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';

export function ProviderOnboardingPage() {
  const { currentUser, showToast } = useApp();

  const [businessName, setBusinessName] = useState(currentUser?.businessName || 'Apex Fix Services & Repairs');
  const [serviceArea, setServiceArea] = useState(currentUser?.serviceArea || 'Bengaluru Urban (Bellandur, HSR Layout, Koramangala)');
  const [docName, setDocName] = useState('gst_aadhaar_placeholder.pdf');
  const [status, setStatus] = useState(currentUser?.verificationStatus || 'approved');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('submitted');
    showToast('Onboarding profile & verification documents submitted for admin review!', 'success');
  };

  return (
    <div className="app-container" style={{ padding: '24px 0', maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Provider Verification & Profile</h1>
        <p className="page-subtitle">Manage your business credentials, trade skills, and verification status</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--color-page-bg)', borderRadius: 'var(--radius-control)' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', display: 'block' }}>Current Status</span>
            <strong style={{ fontSize: '15px', color: 'var(--color-ink)' }}>Verification Badge:</strong>
          </div>
          <StatusBadge status={status} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            label="Business / Trading Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />

          <TextField
            label="Service Coverage Area (Cities & Pin codes)"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            required
          />

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)', display: 'block', marginBottom: '6px' }}>
              Identity & Trade Document Placeholder (Aadhaar / GST / Trade License)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <TextField
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px', display: 'block' }}>
              Placeholder mode: Simulated document verification only. No real KYC processed.
            </span>
          </div>

          <Button type="submit" variant="primary" size="lg">
            Update Verification Profile
          </Button>
        </form>
      </div>
    </div>
  );
}

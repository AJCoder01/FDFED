import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';

export function SignupPage() {
  const { switchRole, showToast } = useApp();
  const navigate = useNavigate();

  const [role, setRole] = useState('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) {
      showToast('Please enter your full name and email.', 'warning');
      return;
    }

    switchRole(role);
    showToast(`Account created! Welcome to ServiceHub as ${role.toUpperCase()}.`, 'success');
    if (role === 'customer') navigate('/customer');
    else navigate('/provider');
  };

  return (
    <div className="app-container" style={{ padding: '48px 16px', maxWidth: '500px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', margin: '0 auto 12px' }}>
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>Create ServiceHub Account</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>Join India's trusted non-retail services marketplace</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select
            label="I want to join as:"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'customer', label: 'Customer (Book Services)' },
              { value: 'provider', label: 'Service Professional (Offer Services)' }
            ]}
          />

          <TextField
            label="Full Name or Business Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aarav Sharma or Apex Repairs"
            required
          />

          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />

          <TextField
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            required
          />

          <Button type="submit" variant="primary" fullWidth size="lg" style={{ marginTop: '8px' }}>
            Create Account & Continue
          </Button>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, User, Wrench, BarChart2, Scale, ArrowRight } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Button } from '../../design-system/primitives/Button';

export function LoginPage() {
  const { switchRole, savedIntent, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('aarav.sharma@example.com');
  const [password, setPassword] = useState('password123');

  const handleRoleSelect = (role) => {
    switchRole(role);
    showToast(`Signed in successfully as ${role.toUpperCase()}!`, 'success');

    if (savedIntent && (role === 'customer' || role === 'guest')) {
      navigate('/customer/checkout');
    } else {
      if (role === 'customer') navigate('/customer');
      else if (role === 'provider') navigate('/provider');
      else if (role === 'admin') navigate('/admin');
      else if (role === 'arbitrator') navigate('/arbitrator');
      else navigate('/');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleRoleSelect('customer');
  };

  return (
    <div className="app-container" style={{ padding: '48px 16px', maxWidth: '480px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', margin: '0 auto 12px' }}>
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>Sign in to ServiceHub</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
            {savedIntent ? 'Sign in to complete your saved booking' : 'Choose a demo persona or enter credentials'}
          </p>
        </div>

        {/* Demo Quick Logins */}
        <div style={{ backgroundColor: 'var(--color-page-bg)', padding: '16px', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
            ⚡ One-Click Demo Role Login
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => handleRoleSelect('customer')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#FFF', cursor: 'pointer', textAlign: 'left' }}>
              <User size={16} color="var(--color-primary)" />
              <div style={{ fontSize: '12px', flex: 1 }}>
                <strong>Customer Persona:</strong> Aarav Sharma
              </div>
            </button>
            <button onClick={() => handleRoleSelect('provider')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#FFF', cursor: 'pointer', textAlign: 'left' }}>
              <Wrench size={16} color="var(--color-success)" />
              <div style={{ fontSize: '12px', flex: 1 }}>
                <strong>Provider Persona:</strong> Apex Fix Services
              </div>
            </button>
            <button onClick={() => handleRoleSelect('admin')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#FFF', cursor: 'pointer', textAlign: 'left' }}>
              <BarChart2 size={16} color="var(--color-warning)" />
              <div style={{ fontSize: '12px', flex: 1 }}>
                <strong>Platform Admin Persona:</strong> Priya Nair
              </div>
            </button>
            <button onClick={() => handleRoleSelect('arbitrator')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#FFF', cursor: 'pointer', textAlign: 'left' }}>
              <Scale size={16} color="var(--color-conflict)" />
              <div style={{ fontSize: '12px', flex: 1 }}>
                <strong>Arbitrator Persona:</strong> Justice Sundaram
              </div>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-muted)', fontSize: '12px' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
          <span>OR SIGN IN WITH EMAIL</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
        </div>

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" fullWidth size="lg">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

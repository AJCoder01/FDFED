import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, UserRound, Wrench, Scale, ArrowLeft } from 'lucide-react';
import { DEMO_USERS } from '../../data/mockData';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Button } from '../../design-system/primitives/Button';

export function LoginPage() {
  const { switchRole, savedIntent, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const selectedRole = searchParams.get('role');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const roleChoices = [
    { role: 'customer', label: 'Customer', description: 'Book and manage services', icon: UserRound },
    { role: 'provider', label: 'Provider', description: 'Manage services and jobs', icon: Wrench },
    { role: 'arbitrator', label: 'Arbitrator', description: 'Review and resolve disputes', icon: Scale },
    { role: 'superuser', label: 'SuperUser', description: 'Platform administration', icon: Shield }
  ];
  const credentialRoles = ['customer', 'provider', 'arbitrator'];
  const hasSelectedCredentialRole = credentialRoles.includes(selectedRole);
  const selectedRoleLabel = roleChoices.find(({ role }) => role === selectedRole)?.label;

  const chooseRole = (role) => {
    if (role === 'superuser') {
      handleSignIn('admin');
      return;
    }
    const query = new URLSearchParams({ role });
    if (redirectParam) query.set('redirect', redirectParam);
    setError('');
    setEmail('');
    setPassword('');
    navigate(`/login?${query.toString()}`);
  };

  const handleSignIn = (role) => {
    switchRole(role);
    showToast(`Signed in successfully as ${role.toUpperCase()}!`, 'success');

    if (savedIntent && role === 'customer') {
      navigate('/customer/checkout');
    } else {
      const destinations = {
        customer: '/customer',
        provider: '/provider',
        admin: '/admin',
        arbitrator: '/arbitrator'
      };
      navigate(redirectParam === 'checkout' && role === 'customer' ? '/customer/checkout' : destinations[role]);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const account = DEMO_USERS[selectedRole];

    if (!account || account.email.toLowerCase() !== email.trim().toLowerCase() || password !== '123456Ab@') {
      setError('Email or password is incorrect. Check your credentials and try again.');
      return;
    }

    setError('');
    handleSignIn(account.role);
  };

  return (
    <div className="app-container" style={{ padding: '48px 16px', maxWidth: '480px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', margin: '0 auto 12px' }}>
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>
            {hasSelectedCredentialRole ? `Sign in as ${selectedRoleLabel}` : 'Welcome to ServiceHub'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
            {hasSelectedCredentialRole ? (savedIntent && selectedRole === 'customer' ? 'Sign in to complete your saved booking' : 'Enter the credentials for this role') : 'Choose your role to continue'}
          </p>
        </div>

        {!hasSelectedCredentialRole ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {roleChoices.map(({ role, label, description, icon: Icon }) => (
              <button key={role} type="button" onClick={() => chooseRole(role)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', cursor: 'pointer', textAlign: 'left' }}>
                <Icon size={20} color="var(--color-primary)" />
                <span style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                  <strong style={{ fontSize: '14px' }}>{label}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{description}</span>
                </span>
                <span aria-hidden="true" style={{ color: 'var(--color-muted)' }}>→</span>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button type="button" onClick={() => navigate(`/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', border: 0, background: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Choose another role
          </button>
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p role="alert" style={{ color: 'var(--color-danger)', fontSize: '13px', margin: 0 }}>{error}</p>}
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
        )}
      </div>
    </div>
  );
}

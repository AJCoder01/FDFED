import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Shield, ShieldCheck, UserRound, Wrench, Scale, ArrowLeft, KeyRound, UserPlus, Sparkles } from 'lucide-react';
import { DEMO_USERS, DEFAULT_DEMO_PASSWORD } from '../../data/mockData';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Button } from '../../design-system/primitives/Button';

export function LoginPage() {
  const { login, savedIntent } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const roleParam = searchParams.get('role');
  const selectedRole = roleParam;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const roleChoices = [
    { role: 'customer', label: 'Customer', description: 'Book and manage services', icon: UserRound },
    { role: 'provider', label: 'Provider', description: 'Manage services and jobs', icon: Wrench },
    { role: 'arbitrator', label: 'Arbitrator', description: 'Review and resolve disputes', icon: Scale },
    { role: 'admin', label: 'Admin', description: 'Platform operations & compliance management', icon: Shield }
  ];

  const credentialRoles = ['customer', 'provider', 'arbitrator', 'admin', 'superuser'];
  const hasSelectedCredentialRole = credentialRoles.includes(selectedRole);
  const selectedChoice = roleChoices.find(({ role }) => role === selectedRole);
  const selectedRoleLabel = selectedChoice?.label || 'Account';

  let demoAccount = null;
  if (selectedRole === 'superuser') {
    demoAccount = DEMO_USERS.admin;
  } else if (selectedRole === 'admin') {
    demoAccount = DEMO_USERS.staffAdmin;
  } else if (selectedRole && DEMO_USERS[selectedRole]) {
    demoAccount = DEMO_USERS[selectedRole];
  }

  // Reset credentials when selecting or changing roles (do not auto-enter credentials)
  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
  }, [selectedRole]);

  const chooseRole = (role) => {
    const query = new URLSearchParams({ role });
    if (redirectParam) query.set('redirect', redirectParam);
    setEmail('');
    setPassword('');
    setError('');
    navigate(`/login?${query.toString()}`);
  };

  const handleFillDemo = () => {
    if (demoAccount) {
      setEmail(demoAccount.email);
      setPassword(DEFAULT_DEMO_PASSWORD);
      setError('');
    }
  };

  // Instant 1-Click SuperUser Login
  const handleQuickSuperUserLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login(DEMO_USERS.admin.email, DEFAULT_DEMO_PASSWORD, 'admin');
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Unable to sign in as SuperUser.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const expectedAuthRole = selectedRole === 'superuser' ? 'admin' : selectedRole;
      const user = await login(email, password, expectedAuthRole);

      const isSuper = user.isSuperUser === true || user.email?.toLowerCase() === 'admin@gmail.com' || user.id === 'user-admin-1';
      if (selectedRole === 'superuser' && !isSuper) {
        throw new Error('This account does not have SuperUser root privileges. Please sign in as Admin.');
      }

      if (savedIntent && user.role === 'customer') {
        navigate('/customer/checkout');
      } else {
        const destinations = {
          customer: '/customer',
          provider: '/provider',
          admin: '/admin',
          superuser: '/admin',
          arbitrator: '/arbitrator'
        };
        navigate(redirectParam === 'checkout' && user.role === 'customer' ? '/customer/checkout' : (destinations[selectedRole] || destinations[user.role]));
      }
    } catch (err) {
      setError(err.message || 'Email or password is incorrect. Check your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
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
            {hasSelectedCredentialRole
              ? (savedIntent && selectedRole === 'customer'
                ? 'Sign in to complete your saved booking'
                : 'Enter your credentials to access your account')
              : 'Choose your role to continue'}
          </p>
        </div>

        {!hasSelectedCredentialRole ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 1-Click Instant SuperUser Login Banner */}
            <div
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-control)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--color-ink)', display: 'block' }}>
                    ⚡ 1-Click SuperUser Login
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                    Instant demo access (Naina Kapoor)
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleQuickSuperUserLogin}
                disabled={submitting}
              >
                {submitting ? 'Signing in...' : 'Sign In Now'}
              </Button>
            </div>

            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '6px 0 2px' }}>
              Or choose standard role login:
            </div>

            {roleChoices.map(({ role, label, description, icon: Icon, isSuper }) => (
              <button
                key={role}
                type="button"
                onClick={() => chooseRole(role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-control)',
                  border: isSuper ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: isSuper ? 'rgba(99, 102, 241, 0.04)' : 'var(--color-surface)',
                  color: 'var(--color-ink)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: isSuper ? 'rgba(99, 102, 241, 0.12)' : 'var(--color-page-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSuper ? 'var(--color-primary)' : 'var(--color-muted)'
                  }}
                >
                  <Icon size={18} />
                </div>
                <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px' }}>{label}</strong>
                    {isSuper && (
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--color-primary)', color: '#FFF' }}>
                        DEMO CONTROLLER
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{description}</span>
                </span>
                <span aria-hidden="true" style={{ color: 'var(--color-muted)' }}>→</span>
              </button>
            ))}

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 10px 0' }}>Don't have an account yet?</p>
              <Link to="/signup" style={{ textDecoration: 'none' }}>
                <Button variant="outline" fullWidth size="md">
                  <UserPlus size={16} style={{ marginRight: '6px' }} /> Create New Account
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => navigate(`/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 0,
                  background: 'none',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                <ArrowLeft size={16} /> Choose another role
              </button>

              {demoAccount && (
                <button
                  type="button"
                  onClick={handleFillDemo}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px dashed var(--color-border)',
                    background: 'var(--color-page-bg)',
                    color: 'var(--color-muted)',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                  title="Click to fill sample demo credentials"
                >
                  <KeyRound size={12} /> Fill Demo Credentials
                </button>
              )}
            </div>

            {demoAccount && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)', fontSize: '11px', color: 'var(--color-muted)' }}>
                <span>{selectedRoleLabel} Demo: <strong style={{ color: 'var(--color-ink)' }}>{demoAccount.email}</strong> / Password: <strong style={{ color: 'var(--color-ink)' }}>123456Ab@</strong></span>
              </div>
            )}

            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              required
            />

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <div role="alert" style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth size="lg" disabled={submitting}>
              {submitting ? 'Signing In...' : `Sign In as ${selectedRoleLabel}`}
            </Button>

            {selectedRole !== 'superuser' && selectedRole !== 'admin' && (
              <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-muted)', marginTop: '8px' }}>
                Don't have an account?{' '}
                <Link to={`/signup?role=${selectedRole}`} style={{ color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'none' }}>
                  Sign up as {selectedRoleLabel}
                </Link>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

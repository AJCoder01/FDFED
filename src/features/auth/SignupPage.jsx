import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Shield, UserRound, Wrench, Scale, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { Select } from '../../design-system/primitives/Select';
import { Button } from '../../design-system/primitives/Button';
import { PhoneInputField, validatePhoneNumber } from '../../design-system/primitives/PhoneInputField';

import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';
import { ArbitratorSignupWizard } from './ArbitratorSignupWizard';

export function SignupPage() {
  const { signup, setSavedIntent } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const initialRole = ['customer', 'provider', 'arbitrator'].includes(roleParam) ? roleParam : 'customer';

  const [selectedRole, setSelectedRole] = useState(initialRole);

  useEffect(() => {
    if (roleParam && ['customer', 'provider', 'arbitrator'].includes(roleParam)) {
      setSelectedRole(roleParam);
    }
  }, [roleParam]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Customer specific
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // Provider specific
  const [businessName, setBusinessName] = useState('');
  const [skill, setSkill] = useState('Home Cleaning');
  const [serviceArea, setServiceArea] = useState('Bengaluru Urban');

  // Arbitrator specific
  const [title, setTitle] = useState('Senior Independent Dispute Arbitrator');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const roleChoices = [
    { role: 'customer', label: 'Customer', description: 'Book services & track appointments', icon: UserRound },
    { role: 'provider', label: 'Provider', description: 'Offer services & grow your business', icon: Wrench },
    { role: 'arbitrator', label: 'Arbitrator', description: 'Review & adjudicate dispute cases', icon: Scale }
  ];

  const skillOptions = [
    { value: 'Home Cleaning', label: 'Home Cleaning' },
    { value: 'Plumbing', label: 'Plumbing' },
    { value: 'Electrical Repair', label: 'Electrical Repair' },
    { value: 'Appliance Repair', label: 'Appliance Repair' },
    { value: 'AC Maintenance', label: 'AC Maintenance' },
    { value: 'Others', label: 'Others' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const phoneError = validatePhoneNumber(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (selectedRole === 'customer' && pincode && !/^\d{6}$/.test(pincode.trim())) {
      setError('Please enter a valid 6-digit PIN code.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name,
        email,
        phone,
        password,
        role: selectedRole,
        avatar: DEFAULT_BLANK_AVATAR,
        ...(selectedRole === 'customer' && {
          addressLine: addressLine || '123 Main Road',
          city: city || 'Bengaluru',
          pincode: pincode || '560001',
          addressLabel: 'Home'
        }),
        ...(selectedRole === 'provider' && {
          businessName: businessName || `${name}'s Pro Services`,
          skills: [skill],
          skill,
          serviceArea: serviceArea || 'Bengaluru Urban'
        }),
        ...(selectedRole === 'arbitrator' && {
          title: title || 'Senior Independent Arbitrator'
        })
      };

      const user = await signup(payload);

      // Always clear any booking intent and navigate strictly to the concerned actor's dashboard
      if (setSavedIntent) setSavedIntent(null);

      const destinations = {
        customer: '/customer',
        provider: '/provider',
        arbitrator: '/arbitrator'
      };
      navigate(destinations[user.role] || `/${user.role}`);
    } catch (err) {
      setError(err.message || 'Unable to register account. Please check your information and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedRole === 'arbitrator') {
    return (
      <div className="app-container" style={{ padding: '40px 16px', maxWidth: '780px', margin: '0 auto' }}>
        <ArbitratorSignupWizard onBackToRoleSelect={() => setSelectedRole('customer')} />
      </div>
    );
  }

  return (
    <div className="app-container" style={{ padding: '40px 16px', maxWidth: '580px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', margin: '0 auto 12px' }}>
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-ink)' }}>
            Create ServiceHub Account
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
            Select your actor role and enter your details to sign up.
          </p>
        </div>

        {/* Role Selector Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {roleChoices.map(({ role, label, description, icon: Icon }) => {
            const isSelected = selectedRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => { setSelectedRole(role); setError(''); }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '12px',
                  borderRadius: 'var(--radius-control)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.06)' : 'var(--color-surface)',
                  color: 'var(--color-ink)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
                  <Icon size={18} color={isSelected ? 'var(--color-primary)' : 'var(--color-muted)'} />
                  {isSelected && <CheckCircle2 size={16} color="var(--color-primary)" />}
                </div>
                <strong style={{ fontSize: '13px', color: isSelected ? 'var(--color-primary)' : 'var(--color-ink)' }}>{label}</strong>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px', lineHeight: 1.3 }}>{description}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <TextField
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              required
            />
            <PhoneInputField
              label="Phone Number"
              value={phone}
              onChange={setPhone}
              required
            />
          </div>

          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. priya@gmail.com"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <TextField
              label="Password (Min 8 chars)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
            />
          </div>

          {/* Role-Specific Fields */}
          {selectedRole === 'customer' && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Delivery Address Information
              </span>
              <TextField
                label="Street Address / Society"
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="e.g. Flat 301, Lakeview Residency, Koramangala"
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <TextField
                  label="City"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  required
                />
                <TextField
                  label="PIN Code"
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 560034"
                  required
                />
              </div>
            </div>
          )}

          {selectedRole === 'provider' && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Service Business Details
              </span>
              <TextField
                label="Business / Trade Name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. ProClean Experts & Repairs"
                required
              />
              <Select
                label="Primary Category / Skill"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                options={skillOptions}
                required
              />
              <TextField
                label="Service Coverage Area"
                type="text"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="e.g. Bengaluru Urban (HSR, Koramangala, Bellandur)"
                required
              />
            </div>
          )}

          {selectedRole === 'arbitrator' && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Arbitration Credentials
              </span>
              <TextField
                label="Professional Title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Independent Arbitrator"
                required
              />
            </div>
          )}

          {error && (
            <div role="alert" style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth size="lg" disabled={submitting}>
            {submitting ? 'Creating Account...' : `Register as ${selectedRole.toUpperCase()}`}
          </Button>

          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-muted)', marginTop: '8px' }}>
            Already have an account?{' '}
            <Link to={`/login?role=${selectedRole}`} style={{ color: 'var(--color-primary)', fontWeight: '700', textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

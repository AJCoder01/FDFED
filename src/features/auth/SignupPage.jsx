import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '../../design-system/primitives/Button';

export function SignupPage() {
  return (
    <div className="app-container" style={{ padding: '48px 16px', maxWidth: '500px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
          <Shield size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-ink)' }}>Demo Accounts Only</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '8px', lineHeight: 1.5 }}>
            Account registration is disabled in this demo. Sign in with one of the authorized demo accounts.
          </p>
        </div>
        <Link to="/login" style={{ width: '100%', textDecoration: 'none' }}>
          <Button variant="primary" fullWidth size="lg">Go to Sign In</Button>
        </Link>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEMO_USERS } from '../../data/mockData';

export function DemoSwitcherBar() {
  const { currentRole, currentUser, switchRole, handleResetDemoData, isSuperUser, isSuperUserDemoMode } = useApp();
  const navigate = useNavigate();

  if (!isSuperUser && !isSuperUserDemoMode) {
    return null;
  }

  let activeKey = currentRole;
  if (currentUser?.id === DEMO_USERS?.staffAdmin?.id) {
    activeKey = 'admin';
  } else if (currentUser?.id === DEMO_USERS?.admin?.id) {
    activeKey = 'superuser';
  }

  const DEMO_ACTORS = [
    { key: 'customer', label: 'Customer', name: 'Aarav Mehta' },
    { key: 'provider', label: 'Provider', name: 'Rohan Verma' },
    { key: 'arbitrator', label: 'Arbitrator', name: 'Kabir Malhotra' },
    { key: 'admin', label: 'Admin', name: 'Priya Nair' },
    { key: 'superuser', label: 'SuperUser', name: 'Naina Kapoor' },
    { key: 'guest', label: 'Guest', name: 'Sign Out' },
  ];

  const getActiveRoleLabel = () => {
    if (activeKey === 'admin') return 'ADMIN (Priya Nair)';
    if (activeKey === 'superuser') return 'SUPERUSER (Naina Kapoor)';
    if (activeKey === 'customer') return `CUSTOMER (${currentUser?.name || 'Aarav Mehta'})`;
    if (activeKey === 'provider') return `PROVIDER (${currentUser?.businessName || currentUser?.name || 'Rohan Verma'})`;
    if (activeKey === 'arbitrator') return `ARBITRATOR (${currentUser?.name || 'Kabir Malhotra'})`;
    return 'GUEST';
  };

  const handleActorClick = async (key) => {
    if (key === activeKey) return;
    const destinations = {
      customer: '/customer',
      provider: '/provider',
      admin: '/admin',
      superuser: '/admin',
      staffAdmin: '/admin',
      arbitrator: '/arbitrator',
      guest: '/'
    };
    const targetPath = destinations[key] || '/';
    navigate(targetPath);
    await switchRole(key);
  };

  return (
    <div
      style={{
        backgroundColor: '#090F1E',
        color: '#94A3B8',
        padding: '8px 24px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        zIndex: 50
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontWeight: '700',
            color: '#60A5FA',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          ServiceHub Demo Switcher:
        </span>
        <span style={{ color: '#E2E8F0' }}>
          Role: <strong style={{ color: '#93C5FD' }}>{getActiveRoleLabel()}</strong>
        </span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {DEMO_ACTORS.map(({ key, label, name }) => {
            const isActive = activeKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleActorClick(key)}
                title={`Switch demo actor to ${name}`}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#FFFFFF' : '#CBD5E1',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                {key === 'superuser' && <ShieldCheck size={12} />}
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={handleResetDemoData}
        style={{
          background: '#EF4444',
          color: '#FFF',
          border: 'none',
          padding: '4px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          boxShadow: '0 2px 4px rgba(239,68,68,0.2)'
        }}
      >
        <RotateCcw size={12} /> Reset Demo Data
      </button>
    </div>
  );
}

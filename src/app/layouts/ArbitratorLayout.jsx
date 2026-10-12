import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Scale, FileText, Calendar, Award, User, Bell, RotateCcw, ChevronRight, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Toast } from '../../design-system/primitives/Toast';
import { NotificationDrawer } from '../../features/notifications/NotificationDrawer';
import { ThemeToggle } from '../../design-system/primitives/ThemeToggle';

export function ArbitratorLayout() {
  const { currentRole, isSuperUser, switchRole, currentUser, handleResetDemoData, toast, clearToast, unreadCount } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = [
    { label: 'Arbitration Dashboard', path: '/arbitrator', icon: Scale },
    { label: 'Active Dispute Cases', path: '/arbitrator/cases', icon: FileText },
    { label: 'Hearing Schedule', path: '/arbitrator/hearings', icon: Calendar },
    { label: 'Rulings & Awards', path: '/arbitrator/rulings', icon: Award },
    { label: 'Arbitrator Profile', path: '/arbitrator/profile', icon: User },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-page-bg)' }}>
      {isSuperUser && (
      <div style={{ backgroundColor: '#090F1E', color: '#94A3B8', padding: '8px 24px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontWeight: '700', color: '#60A5FA', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            ServiceHub Demo Switcher:
          </span>
          <span style={{ color: '#E2E8F0' }}>Role: <strong style={{ color: '#93C5FD' }}>ARBITRATOR</strong> ({currentUser?.name})</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['guest', 'customer', 'provider', 'admin', 'arbitrator'].map((role) => (
              <button
                key={role}
                onClick={() => {
                  switchRole(role, true);
                  if (role === 'guest') navigate('/');
                  else if (role === 'customer') navigate('/customer');
                  else if (role === 'provider') navigate('/provider');
                  else if (role === 'admin') navigate('/admin');
                }}
                style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: currentRole === role ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)',
                  backgroundColor: currentRole === role ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  color: currentRole === role ? '#FFFFFF' : '#CBD5E1',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease'
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleResetDemoData}
          style={{ background: '#EF4444', color: '#FFF', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 4px rgba(239,68,68,0.2)' }}
        >
          <RotateCcw size={12} /> Reset Demo Data
        </button>
      </div>
      )}

      <div style={{ display: 'flex', flex: 1 }}>
        <aside style={{ width: 'var(--sidebar-width)', backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
          <Link to="/" aria-label="Return Home" title="Return Home" style={{ padding: '24px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', boxShadow: '0 4px 10px rgba(37,99,235,0.25)' }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>ServiceHub</div>
              <div style={{ fontSize: '10px', color: 'var(--color-conflict)', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Arbitrator Desk</div>
            </div>
          </Link>

          <nav style={{ padding: '20px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '11px 16px',
                    borderRadius: 'var(--radius-control)',
                    fontSize: '14px',
                    fontWeight: isActive ? '700' : '600',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-ink-secondary)',
                    backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                    border: isActive ? '1px solid var(--color-primary-border)' : '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} color={isActive ? 'var(--color-primary)' : 'var(--color-muted)'} />
                    {item.label}
                  </div>
                  {isActive && <ChevronRight size={16} color="var(--color-primary)" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <header style={{ height: '72px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-xs)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>Independent Arbitrator Desk</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ThemeToggle />
              <button onClick={() => { switchRole('guest'); navigate('/'); }} aria-label="Log out" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                <LogOut size={16} /> Log Out
              </button>
              <button
                onClick={() => setNotifOpen(true)}
                style={{ position: 'relative', background: 'var(--color-page-bg)', border: '1px solid var(--color-border)', cursor: 'pointer', padding: '10px', borderRadius: '50%', color: 'var(--color-ink)', transition: 'all 0.15s ease' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'var(--color-danger)', color: '#FFF', fontSize: '10px', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', border: '2px solid #FFF' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              <Link to="/arbitrator/profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '12px', borderLeft: '1px solid var(--color-border)', textDecoration: 'none' }}>
                <img src={currentUser?.avatar} alt={currentUser?.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-conflict)' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>{currentUser?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Senior Arbitrator</div>
                </div>
              </Link>
            </div>
          </header>

          <main style={{ flex: 1, padding: '32px' }}>
            <Outlet />
          </main>
        </div>
      </div>

      <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <Toast message={toast.message} type={toast.type} onClose={clearToast} />
    </div>
  );
}

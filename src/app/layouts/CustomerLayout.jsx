import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Home, Search, Calendar, HelpCircle, Bell, RotateCcw, ChevronRight, LogOut, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Toast } from '../../design-system/primitives/Toast';
import { NotificationDrawer } from '../../features/notifications/NotificationDrawer';
import { ThemeToggle } from '../../design-system/primitives/ThemeToggle';
import { DemoSwitcherBar } from './DemoSwitcherBar';
import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';

export function CustomerLayout() {
  const { logout, currentUser, toast, clearToast, unreadCount } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = [
    { label: 'Overview', path: '/customer', icon: Home },
    { label: 'Find Services', path: '/customer/services', icon: Search },
    { label: 'My Bookings', path: '/customer/bookings', icon: Calendar },
    { label: 'Profile', path: '/customer/profile', icon: User },
    { label: 'Help & Support', path: '/customer/support', icon: HelpCircle },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-page-bg)' }}>
      <DemoSwitcherBar />

      {/* Main Layout Shell */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: 'var(--sidebar-width)', backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
          <Link to="/customer" aria-label="Customer Dashboard" title="Customer Dashboard" style={{ padding: '24px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', boxShadow: '0 4px 10px rgba(37,99,235,0.25)' }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>ServiceHub</div>
              <div style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Customer Workspace</div>
            </div>
          </Link>

          <nav style={{ padding: '20px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path
                || (item.path !== '/customer' && location.pathname.startsWith(`${item.path}/`));
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

        {/* Right Main Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <header style={{ height: '72px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-xs)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>Customer Dashboard</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ThemeToggle />
              <button onClick={async () => { await logout(); navigate('/'); }} aria-label="Log out" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
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

              <Link to="/customer/profile" title="View Customer Profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '12px', borderLeft: '1px solid var(--color-border)', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                <img src={currentUser?.avatar || DEFAULT_BLANK_AVATAR} alt={currentUser?.name || 'Customer'} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary-border)' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>{currentUser?.name || 'Customer'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: '600' }}>Bengaluru, KA</div>
                </div>
              </Link>
            </div>
          </header>

          {/* Main Outlet */}
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

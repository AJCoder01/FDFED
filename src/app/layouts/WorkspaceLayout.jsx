import { Suspense, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, LogOut, Menu, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_BLANK_AVATAR } from '../../data/mockData';
import { Modal } from '../../design-system/primitives/Modal';
import { Skeleton } from '../../design-system/primitives/Skeleton';
import { Toast } from '../../design-system/primitives/Toast';
import { ThemeToggle } from '../../design-system/primitives/ThemeToggle';
import { NotificationDrawer } from '../../features/notifications/NotificationDrawer';
import { DemoSwitcherBar } from './DemoSwitcherBar';

export function WorkspaceLayout({ role, title, label, accent, navItems }) {
  const { currentUser, logout, toast, clearToast, unreadCount, showToast, reloadNotifications } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const subtitle = role === 'provider' ? currentUser?.verificationStatus?.replaceAll('_', ' ')
    : role === 'admin' ? currentUser?.isSuperUser ? 'Superuser' : 'Admin'
    : role === 'arbitrator' ? currentUser?.title || 'Arbitrator' : currentUser?.location;
  const links = <nav className="workspace-nav" aria-label={`${role} navigation`}>
    {navItems.map(({ label, path, icon: Icon }) => {
      const active = location.pathname === path || (path !== `/${role}` && location.pathname.startsWith(`${path}/`));
      return <Link key={path} to={path} onClick={() => setMenuOpen(false)} aria-current={active ? 'page' : undefined}>
        <Icon size={18} aria-hidden="true" /><span>{label}</span>{active && <ChevronRight size={16} aria-hidden="true" />}
      </Link>;
    })}
  </nav>;
  return <div className={`workspace ${role === 'provider' ? 'provider-workspace' : ''}`}>
    <DemoSwitcherBar />
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <Link to={`/${role}`} className="workspace-brand" aria-label={`${role[0].toUpperCase() + role.slice(1)} Dashboard`}>
          <span className="workspace-brand-icon"><Shield size={20} /></span>
          <span><strong>ServiceHub</strong><small style={{ color: `var(--color-${accent})` }}>{role === 'admin' && currentUser?.isSuperUser ? 'Superuser' : label}</small></span>
        </Link>
        {links}
      </aside>
      <div className="workspace-content">
        <header className="workspace-header">
          <h2>{title}</h2>
          <div className="workspace-controls">
            <button type="button" className="icon-control mobile-menu-toggle" aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={event => { event.currentTarget.focus(); setMenuOpen(true); }}><Menu size={20} /></button>
            <ThemeToggle />
            <button type="button" className="workspace-logout" aria-label="Log out" disabled={leaving} onClick={async () => {
              setLeaving(true);
              try { await logout(); navigate('/'); } catch (error) { showToast(error.message, 'error'); } finally { setLeaving(false); }
            }}><LogOut size={16} /><span>{leaving ? 'Leaving…' : 'Log Out'}</span></button>
            <button type="button" className="icon-control workspace-notifications" aria-label={`Open notifications (${unreadCount} unread)`} onClick={async event => {
              event.currentTarget.focus();
              setNotifOpen(true);
              try { await reloadNotifications(); } catch (error) { showToast(error.message, 'error'); }
            }}><Bell size={20} />{unreadCount > 0 && <span className="notification-count" aria-hidden="true">{unreadCount}</span>}</button>
            <Link to={`/${role}/profile`} className="workspace-user" aria-label={`View profile for ${currentUser?.name}`}>
              <img src={currentUser?.avatar || DEFAULT_BLANK_AVATAR} alt="" width="40" height="40" />
              <span><strong>{currentUser?.name}</strong><small>{subtitle}</small></span>
            </Link>
          </div>
        </header>
        <main className="workspace-main">
          <Suspense fallback={<Skeleton height="400px" />}>
            <Outlet key={currentUser?.id} />
          </Suspense>
        </main>
      </div>
    </div>
    <Modal isOpen={menuOpen} onClose={() => setMenuOpen(false)} title="Navigation">{links}</Modal>
    <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    <Toast message={toast.message} type={toast.type} onClose={clearToast} />
  </div>;
}

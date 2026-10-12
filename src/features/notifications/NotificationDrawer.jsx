import { useEffect, useId, useRef, useState } from 'react';
import { X, Bell, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/context/AppContext';
import { Button } from '../../design-system/primitives/Button';

export function NotificationDrawer({ isOpen, onClose }) {
  const { notifications, currentUser, reloadNotifications } = useApp();
  const navigate = useNavigate();
  const dialog = useRef(null);
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  const handleKey = event => {
    if (event.key === 'Escape') onClose();
    if (event.key !== 'Tab') return;
    const buttons = dialog.current.querySelectorAll('button:not(:disabled)');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) {
      event.preventDefault();
      first.focus();
    }
  };

  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try { await reloadNotifications(); }
    catch { setError('Unable to refresh notifications. Try again.'); }
    finally { setBusy(false); }
  };

  if (!isOpen) return null;
  const visible = notifications.filter(notification => !notification.userId || notification.userId === currentUser?.id);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 32, 51, 0.4)', zIndex: 1500, display: 'flex', justifyContent: 'flex-end' }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onKeyDown={handleKey} onClick={event => event.stopPropagation()}
        style={{ width: '100%', maxWidth: '380px', backgroundColor: 'var(--color-surface)', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-modal)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 id={titleId} style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={18} /> Notifications</h2>
          <button aria-label="Close notifications" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button variant="secondary" size="sm" onClick={refresh} disabled={busy}>{busy ? 'Refreshing…' : 'Refresh Notifications'}</Button>
          {error && <p role="alert">{error}</p>}
          <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Read states are displayed as saved. Marking notifications as read is currently unavailable.</p>
          {currentUser?.role === 'provider' && <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Payment notices confirm customer payment. See Earnings for completed, pending, and held amounts.</p>}
          {visible.length === 0 && <p style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-muted)' }}>No notifications at the moment.</p>}
          {visible.map(notification => {
            const link = typeof notification.targetLink === 'string' && notification.targetLink.startsWith('/') && !notification.targetLink.startsWith('//');
            return (
              <button key={notification.id} type="button" disabled={!link} onClick={() => { navigate(notification.targetLink); onClose(); }}
                style={{ textAlign: 'left', padding: '12px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', backgroundColor: notification.read ? 'var(--color-surface)' : 'var(--color-primary-light)', cursor: link ? 'pointer' : 'default' }}>
                <span style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: 'var(--color-ink)' }}>{notification.title}</span>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-muted)' }}>{notification.createdAt} · {notification.read ? 'Read' : 'Unread'}</span>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)', margin: '8px 0' }}>{notification.message}</span>
                {link && <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>View details <ExternalLink size={12} /></span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

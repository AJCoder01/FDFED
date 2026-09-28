import React from 'react';
import { X, Bell, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/context/AppContext';

export function NotificationDrawer({ isOpen, onClose }) {
  const { notifications } = useApp();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 32, 51, 0.4)',
    zIndex: 1500,
    display: 'flex',
    justifyContent: 'flex-end',
  };

  const drawerStyle = {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: 'var(--color-surface)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-modal)',
  };

  const headerStyle = {
    padding: '16px 20px',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={drawerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '16px' }}>
            <Bell size={18} color="var(--color-primary)" /> Notifications
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-muted)', fontSize: '14px' }}>
              No notifications at the moment.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.targetLink) {
                    navigate(n.targetLink);
                    onClose();
                  }
                }}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: n.read ? 'var(--color-surface)' : 'var(--color-primary-light)',
                  cursor: n.targetLink ? 'pointer' : 'default',
                  transition: 'background 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--color-ink)' }}>{n.title}</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>{n.createdAt}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '8px' }}>{n.message}</p>
                {n.targetLink && (
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View details <ExternalLink size={12} />
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

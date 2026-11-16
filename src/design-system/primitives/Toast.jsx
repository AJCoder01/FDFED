import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgColors = {
    success: 'var(--color-success-action)',
    error: 'var(--color-danger-action)',
    warning: 'var(--color-warning-action)',
    info: 'var(--color-info-action)',
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
  };

  const Icon = icons[type] || Info;

  const style = {
    position: 'fixed',
    bottom: '24px',
    right: '16px',
    maxWidth: 'calc(100% - 32px)',
    overflowWrap: 'anywhere',
    backgroundColor: bgColors[type] || bgColors.info,
    color: '#FFFFFF',
    padding: '12px 18px',
    borderRadius: 'var(--radius-control)',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 2000,
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
  };

  return (
    <div role={type === 'error' ? 'alert' : 'status'} style={style}>
      <Icon size={18} />
      <span>{message}</span>
      <button
        aria-label="Dismiss notification"
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', marginLeft: '8px' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

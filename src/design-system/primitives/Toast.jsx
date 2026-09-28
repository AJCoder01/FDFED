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
    success: 'var(--color-success)',
    error: 'var(--color-danger)',
    warning: 'var(--color-warning)',
    info: 'var(--color-primary)',
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
    right: '24px',
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
    <div style={style}>
      <Icon size={18} />
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', marginLeft: '8px' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = '500px' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 32, 51, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--space-4)',
  };

  const modalStyle = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-panel)',
    boxShadow: 'var(--shadow-modal)',
    width: '100%',
    maxWidth: maxWidth,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-4) var(--space-6)',
    borderBottom: '1px solid var(--color-border)',
  };

  const titleStyle = {
    fontSize: 'var(--font-size-lg)',
    fontWeight: '700',
    color: 'var(--color-ink)',
  };

  const bodyStyle = {
    padding: 'var(--space-6)',
    overflowY: 'auto',
    flex: 1,
  };

  const footerStyle = {
    padding: 'var(--space-4) var(--space-6)',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-3)',
    backgroundColor: 'var(--color-page-bg)',
  };

  return (
    <div style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true">
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <div style={bodyStyle}>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
}

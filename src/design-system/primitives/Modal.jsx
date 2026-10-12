import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = '500px' }) {
  const panel = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key !== 'Tab') return;
      const controls = panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]');
      const first = controls[0];
      const last = controls[controls.length - 1];
      const outside = document.activeElement === panel.current || !panel.current.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current.focus();
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);
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
    <div style={overlayStyle} onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 id={titleId} style={titleStyle}>{title}</h3>
          <Button variant="ghost" size="sm" aria-label="Close dialog" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <div style={bodyStyle}>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirm Action', message = 'Are you sure?', confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const close = () => { if (!busy) { setError(''); onClose(); } };
  const confirm = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await onConfirm(); onClose(); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };
  return (
    <Modal isOpen={isOpen} onClose={close} title={title} footer={<><Button variant="secondary" disabled={busy} onClick={close}>{cancelLabel}</Button><Button variant={variant} disabled={busy} onClick={confirm}>{busy ? 'Saving…' : confirmLabel}</Button></>}>
      <p>{message}</p>
      {error && <p role="alert" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </Modal>
  );
}

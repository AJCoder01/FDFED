import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger'
}) {
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {cancelLabel}
      </Button>
      <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink)' }}>
        {message}
      </p>
    </Modal>
  );
}

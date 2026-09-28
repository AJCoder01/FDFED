import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  actionLabel,
  onAction,
  icon: Icon = Inbox
}) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-12) var(--space-6)',
    textAlign: 'center',
    backgroundColor: 'var(--color-surface)',
    border: '1px border-dashed var(--color-border)',
    borderRadius: 'var(--radius-card)',
  };

  const iconCircleStyle = {
    width: '56px',
    height: '56px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-page-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-muted)',
    marginBottom: 'var(--space-4)',
  };

  const titleStyle = {
    fontSize: 'var(--font-size-lg)',
    fontWeight: '700',
    color: 'var(--color-ink)',
    marginBottom: 'var(--space-2)',
  };

  const descStyle = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-muted)',
    maxWidth: '400px',
    marginBottom: 'var(--space-6)',
  };

  return (
    <div style={containerStyle}>
      <div style={iconCircleStyle}>
        <Icon size={28} />
      </div>
      <h3 style={titleStyle}>{title}</h3>
      <p style={descStyle}>{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

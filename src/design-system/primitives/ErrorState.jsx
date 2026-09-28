import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an unexpected error while loading data.',
  onRetry
}) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-8) var(--space-6)',
    textAlign: 'center',
    backgroundColor: 'var(--color-danger-bg)',
    border: '1px solid #FFCDD2',
    borderRadius: 'var(--radius-card)',
  };

  const titleStyle = {
    fontSize: 'var(--font-size-lg)',
    fontWeight: '700',
    color: 'var(--color-danger)',
    marginBottom: 'var(--space-2)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const descStyle = {
    fontSize: 'var(--font-size-sm)',
    color: '#8C1D18',
    marginBottom: 'var(--space-4)',
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>
        <AlertTriangle size={20} />
        {title}
      </h3>
      <p style={descStyle}>{description}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} icon={RefreshCw}>
          Retry Action
        </Button>
      )}
    </div>
  );
}

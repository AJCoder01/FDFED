

export function StatusBadge({ status = 'info', label }) {
  const statusConfig = {
    success: { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)', dot: '#10B981', border: '#A7F3D0' },
    approved: { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)', dot: '#10B981', border: '#A7F3D0' },
    completed: { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)', dot: '#10B981', border: '#A7F3D0' },
    published: { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)', dot: '#10B981', border: '#A7F3D0' },
    
    warning: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)', dot: '#F59E0B', border: '#FDE68A' },
    pending: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)', dot: '#F59E0B', border: '#FDE68A' },
    submitted: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)', dot: '#F59E0B', border: '#FDE68A' },
    changes_requested: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)', dot: '#F59E0B', border: '#FDE68A' },

    danger: { bg: 'var(--color-danger-bg)', text: 'var(--color-danger-text)', dot: '#EF4444', border: '#FECACA' },
    rejected: { bg: 'var(--color-danger-bg)', text: 'var(--color-danger-text)', dot: '#EF4444', border: '#FECACA' },
    cancelled: { bg: 'var(--color-danger-bg)', text: 'var(--color-danger-text)', dot: '#EF4444', border: '#FECACA' },
    suspended: { bg: 'var(--color-danger-bg)', text: 'var(--color-danger-text)', dot: '#EF4444', border: '#FECACA' },

    conflict: { bg: 'var(--color-conflict-bg)', text: 'var(--color-warning-text)', dot: '#D97706', border: '#FDE68A' },
    disputed: { bg: 'var(--color-conflict-bg)', text: 'var(--color-warning-text)', dot: '#D97706', border: '#FDE68A' },
    reschedule_proposed: { bg: 'var(--color-conflict-bg)', text: 'var(--color-warning-text)', dot: '#D97706', border: '#FDE68A' },

    info: { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)', dot: '#3B82F6', border: '#BFDBFE' },
    active: { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)', dot: '#3B82F6', border: '#BFDBFE' },
    in_progress: { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)', dot: '#3B82F6', border: '#BFDBFE' },
    draft: { bg: '#F1F5F9', text: 'var(--color-muted-text)', dot: '#94A3B8', border: '#E2E8F0' },
  };

  statusConfig.paused = statusConfig.draft;
  statusConfig.archived = statusConfig.draft;
  const key = (status || 'info').toLowerCase();
  const config = statusConfig[key] || statusConfig.info;

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '600',
    backgroundColor: config.bg,
    color: config.text,
    border: `1px solid ${config.border}`,
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
  };

  const displayLabel = label || status.replace(/_/g, ' ');

  return (
    <span style={style}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: config.dot, flexShrink: 0 }} />
      {displayLabel}
    </span>
  );
}


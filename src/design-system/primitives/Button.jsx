

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick, 
  type = 'button',
  fullWidth = false,
  icon: Icon,
  style: customStyle = {},
  ...props
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '600',
    borderRadius: 'var(--radius-control)',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    width: fullWidth ? '100%' : 'auto',
    letterSpacing: '-0.01em',
    userSelect: 'none',
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: '#FFFFFF',
      borderColor: 'var(--color-primary)',
      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
    },
    success: { backgroundColor: 'var(--color-success)', color: '#FFFFFF', borderColor: 'var(--color-success)' },
    secondary: {
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-ink)',
      borderColor: 'var(--color-border)',
      boxShadow: 'var(--shadow-xs)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary)',
      borderColor: 'var(--color-primary)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#FFFFFF',
      borderColor: 'var(--color-danger)',
      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-muted)',
      borderColor: 'transparent',
    }
  };

  const sizeStyles = {
    sm: { padding: '7px 14px', fontSize: 'var(--font-size-xs)', height: '34px' },
    md: { padding: '9px 18px', fontSize: 'var(--font-size-sm)', height: '40px' },
    lg: { padding: '12px 24px', fontSize: 'var(--font-size-base)', height: '48px' },
  };

  const style = {
    ...baseStyles,
    ...(variantStyles[variant] || variantStyles.primary),
    ...(sizeStyles[size] || sizeStyles.md),
    ...customStyle,
  };

  return (
    <button {...props} type={type} style={style} disabled={disabled} onClick={onClick}>
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
    </button>
  );
}


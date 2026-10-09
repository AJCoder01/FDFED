import React from 'react';

export function TextField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  error,
  helperText,
  required = false,
  disabled = false,
  multiline = false,
  rows = 3
}) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  };

  const labelStyle = {
    fontSize: 'var(--font-size-xs)',
    fontWeight: '700',
    color: 'var(--color-ink)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const inputBaseStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-control)',
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-ink)',
    backgroundColor: disabled ? 'var(--color-page-bg)' : 'var(--color-surface)',
    outline: 'none',
    boxShadow: 'var(--shadow-xs)',
    transition: 'all 0.15s ease',
  };

  const helperStyle = {
    fontSize: 'var(--font-size-xs)',
    color: error ? 'var(--color-danger)' : 'var(--color-muted)',
    marginTop: '2px',
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label htmlFor={name} style={labelStyle}>
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      {multiline ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          style={{ ...inputBaseStyle, resize: 'vertical' }}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          min={min}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={inputBaseStyle}
        />
      )}

      {(error || helperText) && (
        <span style={helperStyle}>{error || helperText}</span>
      )}
    </div>
  );
}

import React from 'react';

export function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = 'Select option...'
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

  const selectStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-control)',
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-ink)',
    backgroundColor: disabled ? 'var(--color-page-bg)' : 'var(--color-surface)',
    outline: 'none',
    boxShadow: 'var(--shadow-xs)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
  };

  const helperStyle = {
    fontSize: 'var(--font-size-xs)',
    color: error ? 'var(--color-danger)' : 'var(--color-muted)',
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label htmlFor={name} style={labelStyle}>
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={selectStyle}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {(error || helperText) && (
        <span style={helperStyle}>{error || helperText}</span>
      )}
    </div>
  );
}


import { useId } from 'react';

export function TextField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  max,
  step,
  error,
  helperText,
  required = false,
  disabled = false,
  multiline = false,
  rows = 3
}) {
  const fieldId = useId();
  const id = name || fieldId;
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
        <label htmlFor={id} style={labelStyle}>
          {label} {required && <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      {multiline ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          required={required}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          style={{ ...inputBaseStyle, resize: 'vertical' }}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-invalid={Boolean(error)}
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

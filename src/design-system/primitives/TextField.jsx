import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
  const isPasswordField = type === 'password';
  const [showPassword, setShowPassword] = useState(false);

  const resolvedType = isPasswordField
    ? (showPassword ? 'text' : 'password')
    : type;

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
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
          <input
            id={id}
            name={name}
            type={resolvedType}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            aria-invalid={Boolean(error)}
            disabled={disabled}
            style={{
              ...inputBaseStyle,
              paddingRight: isPasswordField ? '42px' : '14px'
            }}
          />
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={disabled}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: showPassword ? 'var(--color-primary)' : 'var(--color-muted)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                transition: 'color 0.15s ease'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      )}

      {(error || helperText) && (
        <span style={helperStyle}>{error || helperText}</span>
      )}
    </div>
  );
}

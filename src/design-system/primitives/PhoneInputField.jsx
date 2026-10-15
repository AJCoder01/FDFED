import { useId, useState, useEffect } from 'react';

/**
 * Parses raw phone string into country code (+91) and national 10-digit number.
 */
export function parsePhoneNumber(raw = '') {
  const str = String(raw || '').trim();
  if (!str) return { countryCode: '+91', phoneNumber: '' };
  const match = str.match(/^(\+\d{1,4})[\s\-.]*(.*)$/);
  if (match) {
    return {
      countryCode: '+91',
      phoneNumber: match[2].replace(/\D/g, ''),
    };
  }
  return {
    countryCode: '+91',
    phoneNumber: str.replace(/\D/g, ''),
  };
}

/**
 * Validates 10-digit Indian phone number:
 * - Predefined country code +91
 * - Must NOT start with 0
 * - Must NOT be below 10 digits
 * - Must NOT be above 10 digits
 */
export function validatePhoneNumber(raw = '') {
  const { phoneNumber } = parsePhoneNumber(raw);
  if (!phoneNumber) {
    return 'Please enter a valid 10-digit phone number.';
  }
  if (phoneNumber.startsWith('0')) {
    return 'Phone number cannot start with 0. Please enter a valid 10-digit phone number.';
  }
  if (phoneNumber.length < 10 || phoneNumber.length > 10) {
    return 'Please enter a valid 10-digit phone number.';
  }
  return null;
}

/**
 * PhoneInputField
 * Simple and direct: Predefined India country ID (+91) with 10-digit numeric input.
 * Prompts user if phone starts with 0, or is below or above 10 digits.
 */
export function PhoneInputField({
  label = 'Phone Number',
  name,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
}) {
  const fieldId = useId();
  const id = name || fieldId;

  const parsed = parsePhoneNumber(value);
  const [phoneNumber, setPhoneNumber] = useState(parsed.phoneNumber || '');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const next = parsePhoneNumber(value);
    setPhoneNumber(next.phoneNumber || '');
  }, [value]);

  const handlePhoneChange = (e) => {
    // Keep numbers only; allow typing/pasting up to 15 digits so user can be prompted if above 10
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
    setPhoneNumber(digitsOnly);
    setTouched(true);
    if (onChange) {
      onChange(digitsOnly ? `+91 ${digitsOnly}` : '');
    }
  };

  const handleBlur = () => {
    setTouched(true);
  };

  // Determine inline prompt/error
  let inlinePrompt = null;
  if (phoneNumber.length > 0) {
    if (phoneNumber.startsWith('0')) {
      inlinePrompt = 'Phone number cannot start with 0. Please enter a valid 10-digit phone number.';
    } else if (phoneNumber.length > 10) {
      inlinePrompt = 'Please enter a valid 10-digit phone number.';
    } else if (touched && phoneNumber.length < 10) {
      inlinePrompt = 'Please enter a valid 10-digit phone number.';
    }
  } else if (touched && required) {
    inlinePrompt = 'Please enter a valid 10-digit phone number.';
  }

  const activeError = error || inlinePrompt;
  const isValid = phoneNumber.length === 10 && !phoneNumber.startsWith('0');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: '700',
            color: 'var(--color-ink)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label} {required && <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      <div style={{ display: 'flex', width: '100%', alignItems: 'stretch' }}>
        {/* Predefined India Country ID */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-control) 0 0 var(--radius-control)',
            border: `1px solid ${activeError ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRight: 'none',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '700',
            color: 'var(--color-ink)',
            backgroundColor: 'var(--color-page-bg)',
            boxShadow: 'var(--shadow-xs)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            whiteSpace: 'nowrap',
          }}
          title="Predefined Country Code: India (+91)"
        >
          <span style={{ fontSize: '15px' }} aria-hidden="true">🇮🇳</span>
          <span>+91</span>
        </div>

        {/* 10-digit phone number input */}
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          value={phoneNumber}
          onChange={handlePhoneChange}
          onBlur={handleBlur}
          placeholder="10-digit mobile number"
          required={required}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '0 var(--radius-control) var(--radius-control) 0',
            border: `1px solid ${activeError ? 'var(--color-danger)' : (isValid ? 'var(--color-success)' : 'var(--color-border)')}`,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-ink)',
            backgroundColor: disabled ? 'var(--color-page-bg)' : 'var(--color-surface)',
            outline: 'none',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.15s ease',
          }}
        />
      </div>

      {/* Helper / Prompt Line */}
      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          color: activeError ? 'var(--color-danger)' : 'var(--color-muted)',
          marginTop: '2px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>
          {activeError || helperText || 'Predefined +91 (India) • Enter 10-digit mobile number'}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: isValid
              ? 'var(--color-success)'
              : (activeError ? 'var(--color-danger)' : 'var(--color-muted)'),
            fontWeight: '600',
            whiteSpace: 'nowrap',
            marginLeft: '8px',
          }}
        >
          {phoneNumber.length}/10 digits
        </span>
      </div>
    </div>
  );
}

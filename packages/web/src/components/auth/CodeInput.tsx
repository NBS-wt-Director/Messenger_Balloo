// CodeInput — ввод 6-значного кода (для 2FA, email verification)

import React, { useState, useRef, useEffect } from 'react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit?: (code: string) => void;
}

export function CodeInput({
  value,
  onChange,
  maxLength = 6,
  placeholder = '000 000',
  autoFocus = false,
  onSubmit,
}: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(autoFocus);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
    if (newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }
    onChange(newValue);

    // Auto-submit when full code entered
    if (newValue.length === maxLength && onSubmit) {
      onSubmit(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace to clear
    if (e.key === 'Backspace' && value.length === 0 && inputRef.current) {
      // Do nothing
    }
  };

  // Format with spaces for readability
  const formattedValue = value.length > 3
    ? value.slice(0, 3) + ' ' + value.slice(3)
    : value;

  return (
    <div className="form-group">
      <input
        ref={inputRef}
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={formattedValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          textAlign: 'center',
          fontSize: focused ? '24px' : '22px',
          letterSpacing: value.length > 3 ? '8px' : '6px',
          fontFamily: 'monospace',
          padding: focused ? '14px' : '12px',
          transition: 'all 0.2s',
        }}
        maxLength={maxLength + 1} // +1 for the space
      />
      {value.length > 0 && value.length < maxLength && (
        <p className="form-hint" style={{ textAlign: 'center', marginTop: '4px' }}>
          {value.length} из {maxLength}
        </p>
      )}
    </div>
  );
}

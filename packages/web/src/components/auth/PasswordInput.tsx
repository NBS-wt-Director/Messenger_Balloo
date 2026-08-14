// PasswordInput — поле ввода пароля с видимостью

import React, { useState } from 'react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  label,
  error,
  hint,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="form-group">
      {label && (
        <label className="form-label">{label}</label>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          className="form-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn btn--secondary btn--icon"
          onClick={() => setShowPassword(!showPassword)}
          title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          style={{ padding: '12px', fontSize: '16px' }}
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
      {hint && !error && (
        <p className="form-hint">{hint}</p>
      )}
      {error && (
        <p className="form-hint" style={{ color: 'var(--danger)' }}>{error}</p>
      )}
    </div>
  );
}

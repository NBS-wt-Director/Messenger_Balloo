// LegalCheckbox — чекбокс согласия с правилами и политикой конфиденциальности

import React from 'react';

interface LegalCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  rulesUrl?: string;
  privacyUrl?: string;
  label?: string;
  error?: string;
}

export function LegalCheckbox({
  checked,
  onChange,
  rulesUrl = 'rules.html',
  privacyUrl = 'rules.html',
  label,
  error,
}: LegalCheckboxProps) {
  const defaultLabel = (
    <>
      Я согласен с{' '}
      <a href={rulesUrl} className="text-accent" target="_blank" rel="noopener noreferrer">
        правилами
      </a>{' '}
      и{' '}
      <a href={privacyUrl} className="text-accent" target="_blank" rel="noopener noreferrer">
        политикой конфиденциальности
      </a>
    </>
  );

  return (
    <div className="form-group">
      <label className="form-checkbox" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="form-checkbox"
          style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
        />
        <span className="text-sm text-secondary" style={{ flex: 1 }}>
          {label || defaultLabel}
        </span>
      </label>
      {error && (
        <p className="form-hint" style={{ color: 'var(--danger)', marginTop: '4px' }}>
          {error}
        </p>
      )}
    </div>
  );
}

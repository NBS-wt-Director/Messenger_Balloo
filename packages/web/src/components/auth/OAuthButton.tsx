// OAuthButton — кнопка OAuth провайдера
// Цвета: Яндекс (#fc3f1d), Mail.ru (#005ff9), Rambler (#ffcc00)

import React from 'react';

interface OAuthButtonProps {
  provider: 'yandex' | 'mailru' | 'vk';
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const PROVIDER_STYLES: Record<string, { color: string; bgColor: string }> = {
  yandex: { color: '#fc3f1d', bgColor: 'var(--bg-tertiary)' },
  mailru: { color: '#005ff9', bgColor: 'var(--bg-tertiary)' },
  vk: { color: '#0077ff', bgColor: 'var(--bg-tertiary)' },
};

export function OAuthButton({ provider, label, icon, onClick, className }: OAuthButtonProps) {
  const styles = PROVIDER_STYLES[provider] || PROVIDER_STYLES.yandex;

  return (
    <button
      className={`auth-oauth-btn ${className || ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '12px',
        background: styles.bgColor,
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.15s',
        borderRadius: '0',
      }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = styles.bgColor)}
    >
      {icon ? (
        <span style={{ color: styles.color, fontWeight: 800 }}>{icon}</span>
      ) : (
        <span
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: styles.color,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 800,
          }}
        >
          {provider[0].toUpperCase()}
        </span>
      )}
      {label}
    </button>
  );
}

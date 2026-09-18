// OAuthGrid — сетка квадратов OAuth-провайдеров (P20/P21)
// Макет: mockups/balloo-su/login.html (.auth-oauth-grid)
// 4 квадрата сеткой 2×2: Яндекс, VK, Mail.ru, Rambler.
// При наведении выбранный квадрат растёт на 50% наружу относительно сетки
// (transform: scale(1.5) — CSS в design-system.css), не сдвигая соседей.

import React from 'react';
import { useI18n } from '@/components/providers/I18nProvider';

export type OAuthProvider = 'yandex' | 'vk' | 'mailru' | 'rambler';

interface OAuthGridProps {
  onProviderClick: (provider: OAuthProvider) => void;
}

// Провайдеры — как в макетах login.html/register.html (P20: добавлен VK)
const PROVIDERS: {
  provider: OAuthProvider;
  labelKey: string;
  fallbackLabel: string;
  icon: string;
  color: string;
}[] = [
  { provider: 'yandex', labelKey: 'oauth.yandex', fallbackLabel: 'Яндекс', icon: 'Y', color: '#fc3f1d' },
  { provider: 'vk', labelKey: '', fallbackLabel: 'VK', icon: 'VK', color: '#0077ff' },
  { provider: 'mailru', labelKey: '', fallbackLabel: 'Mail.ru', icon: '@', color: '#005ff9' },
  { provider: 'rambler', labelKey: '', fallbackLabel: 'Rambler', icon: 'R', color: '#ffcc00' },
];

export function OAuthGrid({ onProviderClick }: OAuthGridProps) {
  const { t } = useI18n();

  return (
    <div className="auth-oauth-grid">
      {PROVIDERS.map((p) => (
        <button
          key={p.provider}
          type="button"
          className="auth-oauth-tile"
          title={p.fallbackLabel}
          onClick={() => onProviderClick(p.provider)}
        >
          <span className="auth-oauth-tile__icon" style={{ color: p.color }}>
            {p.icon}
          </span>
          <span>{p.labelKey ? t(p.labelKey as any) : p.fallbackLabel}</span>
        </button>
      ))}
    </div>
  );
}

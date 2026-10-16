// OAuthGrid — сетка квадратов OAuth-провайдеров (P20/P21)
// Макет: mockups/balloo-su/login.html (.auth-oauth-grid)
// 6 провайдеров сеткой 3×2: Яндекс, VK, Mail.ru, Rambler, Max, Госуслуги.
// При наведении выбранный РАБОЧИЙ квадрат растёт на 50% наружу относительно сетки
// (transform: scale(1.5) — CSS в design-system.css), не сдвигая соседей.
//
// Неактивные провайдеры (Rambler/Max/Госуслуги) — серые, aria-disabled, при наведении
// и фокусе показывают подсказку oauth.validationNotice («Проходим валидацию…»).
// Rambler: решение владельца 1.2.6 = вариант (б) — OAuth-приложение заводит владелец,
// провайдера на сервере пишу после получения ключей; до этого плитка неактивна.
// Max/Госуслуги: OAuth-приложений нет.
//
// aria-disabled вместо disabled: браузер не отдаёт :hover на disabled-кнопке,
// а подсказка должна появляться и мышью, и с клавиатуры.

import React from 'react';
import { useI18n } from '@/components/providers/I18nProvider';

export type OAuthProvider = 'yandex' | 'vk' | 'mailru' | 'rambler' | 'max' | 'gosuslugi';

interface OAuthGridProps {
  onProviderClick: (provider: OAuthProvider) => void;
}

interface OAuthTile {
  provider: OAuthProvider;
  labelKey: string;
  fallbackLabel: string;
  icon: string;
  color: string;
  /** false → серая плитка, клик не уходит на сервер, показывается подсказка */
  configured: boolean;
}

// Провайдеры — как в макетах login.html/register.html (P20: добавлен VK;
// 16.10.2026 по решению владельца добавлены Max и Госуслуги как неактивные)
const PROVIDERS: OAuthTile[] = [
  { provider: 'yandex', labelKey: 'oauth.yandex', fallbackLabel: 'Яндекс', icon: 'Y', color: '#fc3f1d', configured: true },
  { provider: 'vk', labelKey: 'oauth.vk', fallbackLabel: 'VK', icon: 'VK', color: '#0077ff', configured: true },
  { provider: 'mailru', labelKey: 'oauth.mailru', fallbackLabel: 'Mail.ru', icon: '@', color: '#005ff9', configured: true },
  { provider: 'rambler', labelKey: 'oauth.rambler', fallbackLabel: 'Rambler', icon: 'R', color: '#ffcc00', configured: false },
  { provider: 'max', labelKey: 'oauth.max', fallbackLabel: 'MAX', icon: 'M', color: '#7b61ff', configured: false },
  { provider: 'gosuslugi', labelKey: 'oauth.gosuslugi', fallbackLabel: 'Госуслуги', icon: 'Г', color: '#0d4cd3', configured: false },
];

// Защита второго слоя: экраны не должны редиректить неактивный провайдер,
// даже если handleOAuth вызван не из сетки (например, deeplink/рефакторинг).
export const isOAuthConfigured = (provider: OAuthProvider): boolean =>
  PROVIDERS.find((p) => p.provider === provider)?.configured ?? false;

export function OAuthGrid({ onProviderClick }: OAuthGridProps) {
  const { t } = useI18n();
  const notice = t('oauth.validationNotice');

  return (
    <div className="auth-oauth-grid">
      {PROVIDERS.map((p) => {
        const label = p.labelKey ? t(p.labelKey as any) : p.fallbackLabel;
        if (!p.configured) {
          return (
            <button
              key={p.provider}
              type="button"
              className="auth-oauth-tile auth-oauth-tile--disabled"
              aria-disabled="true"
              aria-label={`${label}: ${notice}`}
              data-tooltip={notice}
              // Неактивный провайдер не порождает запрос на сервер
              onClick={(e) => e.preventDefault()}
            >
              <span className="auth-oauth-tile__icon" style={{ color: p.color }}>
                {p.icon}
              </span>
              <span>{label}</span>
            </button>
          );
        }
        return (
          <button
            key={p.provider}
            type="button"
            className="auth-oauth-tile"
            title={label}
            onClick={() => onProviderClick(p.provider)}
          >
            <span className="auth-oauth-tile__icon" style={{ color: p.color }}>
              {p.icon}
            </span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// BalanceScreen — экран «Баланс» (тикет 1795686329).
//
// MVP1: платных услуг нет — экран объясняет, что пополнять баланс не нужно,
// показывает текущее число баллов и предлагает поддержать проект.
// Баланс начисляется при регистрации (REGISTRATION_BONUS = 555).
// Значение баланса в шапке показывается только в частном правом меню.
//
// Тик. 1795721513: экран — child-маршрут MainLayout, который уже даёт единые
// шапку и подвал. Собственные AppTopbar/AppFooter убраны — они давали второй
// ряд шапки и второй подвал на скриншоте владельца.

import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/components/providers/I18nProvider';
import { mainSiteUrl } from '@balloo/ui';
import { pluralKeyFor, type TranslationKey } from '@balloo/shared';

export function BalanceScreen() {
  const { t, locale } = useI18n();
  const user = useAuthStore((s) => s.user);
  const balance = user?.balancePoints ?? 0;

  const donateHref = mainSiteUrl('/donat');

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div className="page-container page-container--narrow">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 12 }} aria-hidden="true">💰</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            {t('balance.title' as TranslationKey)}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {t('balance.yourBalance' as TranslationKey)}
          </p>
          <div style={{ fontSize: 44, fontWeight: 800, marginTop: 8 }}>
            {balance}{' '}
            <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t(pluralKeyFor(balance, locale))}
            </span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h2 className="card__title" style={{ marginBottom: 12 }}>
            {t('balance.noServicesTitle' as TranslationKey)}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            {t('balance.noServicesBody' as TranslationKey)}
          </p>
        </div>

        <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
          <h2 className="card__title" style={{ marginBottom: 8 }}>
            {t('balance.supportTitle' as TranslationKey)}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            {t('balance.supportBody' as TranslationKey)}
          </p>
          <a className="btn btn--primary" href={donateHref}>
            ❤️ {t('menu.donate' as TranslationKey)}
          </a>
        </div>
      </div>
    </div>
  );
}

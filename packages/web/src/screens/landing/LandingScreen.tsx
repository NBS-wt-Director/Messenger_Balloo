// Landing Screen — стартовая страница (placeholder)
// Full implementation in later tickets
// P35: единая шапка/подвал (@balloo/ui)
// Тексты — через useI18n: язык берётся из настроек браузера (см.
// getInitialLanguage в @balloo/ui), ручной выбор пользователя важнее.

import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';
import { useI18n } from '@/components/providers/I18nProvider';

function LandingScreen() {
  const { t } = useI18n();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      {/* P35: единая шапка */}
      <AppTopbar title={t('app.tagline')} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{t('app.name')}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {t('app.description')}
        </p>
        <a
          href="/login"
          style={{
            padding: '0.75rem 2rem',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: '600',
            borderRadius: '0',
          }}
        >
          {t('auth.login')}
        </a>
      </div>

      {/* P35: единый подвал */}
      <AppFooter />
    </div>
  );
}

export default LandingScreen;

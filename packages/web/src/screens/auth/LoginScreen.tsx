// Login Screen — экран авторизации
// Макет: mockups/balloo-su/login.html (+ login.md)
// JWT — httpOnly cookies (не localStorage); при needs2FA → /two-factor
// P20–P23 (2026-09-18): OAuth-сетка квадратов (Яндекс/VK/Mail.ru/Rambler),
// левое меню-дропдаун в лого (TopbarMenu), i18n через useI18n, дружелюбная
// ошибка OAuth (сервер редиректит на /#/login?oauth_error=...).

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { OAuthGrid, type OAuthProvider } from '@/components/auth/OAuthGrid';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';
import { useI18n } from '@/components/providers/I18nProvider';

function LoginScreen() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const { t } = useI18n();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Дружелюбная OAuth-ошибка вместо JSON 404 (P21):
  // сервер редиректит на /#/login?oauth_error=not_configured&provider=<name>
  const oauthError = searchParams.get('oauth_error');
  const oauthProvider = searchParams.get('provider');
  const [oauthErrorShown, setOauthErrorShown] = useState<string | null>(oauthError);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('auth.errorEmailRequired'));
      return;
    }
    if (!password) {
      setError(t('auth.errorPasswordRequired'));
      return;
    }

    setLoading(true);
    try {
      // Сервер установит httpOnly cookie при успехе
      const resp = await api.login(email.trim(), password);

      if (resp?.user?.needs2FA) {
        // 2FA: токены не устанавливаются, вводим код отдельно
        navigate('/two-factor', { state: { email: email.trim() }, replace: true });
        return;
      }

      const user = await api.getMe();
      setUser(user);
      navigate('/chat', { replace: true });
    } catch (err: any) {
      setError(err?.message || t('auth.errorInvalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: OAuthProvider) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3100';
    // GET-редирект на сервер: 302 на authorize URL провайдера (P21)
    window.location.href = `${apiBase}/api/auth/oauth/${provider}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto',
        // P27: фон не задаём — тема russian рисует градиент флага на body,
        // непрозрачный var(--bg-primary) здесь его полностью закрывал
      }}
    >
      {/* Единая шапка (@balloo/ui, P35) — как в макете login.html */}
      <AppTopbar
        title={t('auth.loginPage')}
        right={<div className="mascot">🦊</div>}
      />

      {/* Auth card */}
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">{t('auth.loginTitle')}</h1>
          <p className="auth-subtitle">{t('auth.loginSubtitle')}</p>

          {/* OAuth: сетка квадратов (P20/P21) */}
          <OAuthGrid onProviderClick={handleOAuth} />

          <div className="auth-divider">{t('auth.or')}</div>

          {/* Email form */}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">{t('auth.email')}</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="ivan@example.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <PasswordInput
                label={t('auth.password')}
                value={password}
                onChange={setPassword}
              />
              <div style={{ textAlign: 'right', marginTop: '4px' }}>
                <Link
                  to="/reset-password"
                  style={{ color: 'var(--accent)', fontSize: '13px' }}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>

            {error && (
              <p
                className="text-sm text-danger"
                style={{ marginBottom: '12px', textAlign: 'center' }}
              >
                {error}
              </p>
            )}

            {oauthErrorShown && (
              <p
                className="text-sm"
                style={{ color: 'var(--warning, #f59e0b)', marginBottom: '12px', textAlign: 'center' }}
              >
                {/* not_configured — вход не настроен; account_inactive — аккаунт с
                    этим email неактивен (P33); callback_failed/authorize_failed/no_code —
                    попытка не удалась (вход настроен). Тексты разные, чтобы не путать пользователя */}
                {oauthErrorShown === 'not_configured'
                  ? t('oauth.notConfigured', { provider: oauthProvider || oauthErrorShown })
                  : oauthErrorShown === 'account_inactive'
                    ? t('oauth.accountInactive', { provider: oauthProvider || oauthErrorShown })
                    : t('oauth.failed', { provider: oauthProvider || oauthErrorShown })}
              </p>
            )}

            <button
              type="submit"
              className="btn btn--primary btn--block mb-4"
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? t('auth.signingIn') : t('auth.login')}
            </button>
          </form>

          <div className="divider" />

          {/* Login via another device (QR) */}
          <div className="text-center mb-4">
            <p className="text-sm text-secondary mb-3">
              {t('auth.qrHint')}
            </p>
            <button
              type="button"
              className="btn btn--secondary btn--block"
              onClick={() => navigate('/add-device')}
            >
              📱 {t('auth.qrButton')}
            </button>
            <p className="text-xs text-muted mt-2">
              {t('auth.qrSubtext')}
            </p>
          </div>

          <div className="divider" />

          <p className="text-center text-sm text-secondary">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-accent">
              {t('auth.signUp')}
            </Link>
          </p>

          <div className="divider" />
          <p className="text-center text-xs text-muted">
            {t('auth.v2Note')}
          </p>
        </div>
      </div>

      {/* Единый подвал (@balloo/ui, P35) — юридические ссылки */}
      <AppFooter />
    </div>
  );
}

export default LoginScreen;

// Register Screen — экран регистрации
// Макет: mockups/balloo-su/register.html
// JWT tokens stored in httpOnly cookies (not localStorage)
// P20–P22 (2026-09-18): topbar + footer как в макете (P25), OAuth-сетка
// квадратов (Яндекс/VK/Mail.ru/Rambler), i18n через useI18n.

import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { OAuthGrid, type OAuthProvider } from '@/components/auth/OAuthGrid';
import { LegalCheckbox } from '@/components/auth/LegalCheckbox';
import { ThemeSwitcher } from '@/components/topbar/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/topbar/LanguageSwitcher';
import { TopbarMenu } from '@/components/topbar/TopbarMenu';
import { useI18n } from '@/components/providers/I18nProvider';

function RegisterScreen() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const { t } = useI18n();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCodeStep, setShowCodeStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate avatar preview from name
  const updateAvatarPreview = (name: string) => {
    setDisplayName(name);
    if (name.trim()) {
      const initials = name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      // Random gradient
      const gradients = [
        'linear-gradient(135deg, #2db84d, #1e9e3e)',
        'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        'linear-gradient(135deg, #f59e0b, #d97706)',
        'linear-gradient(135deg, #ef4444, #b91c1c)',
        'linear-gradient(135deg, #06b6d4, #0891b2)',
      ];
      const gradient = gradients[Math.floor(Math.random() * gradients.length)];
      setAvatarPreview(`${initials}|${gradient}`);
    } else {
      setAvatarPreview(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate random captcha
  const [captcha, setCaptcha] = useState('');
  const generateCaptcha = () => {
    const chars = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptcha(result);
  };

  React.useEffect(() => {
    generateCaptcha();
  }, []);

  // Resend timer
  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!displayName.trim()) {
      setError(t('auth.errorNameRequired'));
      return;
    }
    if (!email.trim()) {
      setError(t('auth.errorEmailRequired'));
      return;
    }
    if (!password.trim() || password.length < 8) {
      setError(t('auth.errorPasswordShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.errorPasswordMismatch'));
      return;
    }
    if (!agreed) {
      setError(t('auth.errorAgreeRequired'));
      return;
    }
    if (captchaCode.toUpperCase() !== captcha.toUpperCase()) {
      setError(t('auth.errorCaptcha'));
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      // Сервер установит httpOnly cookie автоматически
      await api.register({
        email,
        password,
        username: email.split('@')[0],
        displayName,
      });

      // Получаем текущего пользователя (cookie уже установлены)
      const user = await api.getMe();
      setUser(user);

      // Show email verification step
      setShowCodeStep(true);
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || t('auth.errorRegister'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (verificationCode.length !== 6) {
      setError(t('auth.codePlaceholder'));
      return;
    }
    try {
      await api.verifyEmail(verificationCode);
      navigate('/chat', { replace: true });
    } catch (err: any) {
      setError(err.message || t('auth.errorCaptcha'));
    }
  };

  const handleResendCode = () => {
    if (resendTimer === 0) {
      setResendTimer(60);
      // In real app, call API to resend
    }
  };

  // OAuth handler: GET-редирект на сервер (302 на authorize URL, P21)
  const handleOAuth = (provider: OAuthProvider) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3100';
    window.location.href = `${apiBase}/api/auth/oauth/${provider}`;
  };

  // Переведённая строка согласия с ссылками (LegalCheckbox)
  const agreeLabel = (
    <>
      {t('auth.agreePrefix')}{' '}
      <a href="/rules" className="text-accent" target="_blank" rel="noopener noreferrer">
        {t('auth.rulesLink')}
      </a>{' '}
      {t('auth.andPrivacy')}{' '}
      <a href="/privacy" className="text-accent" target="_blank" rel="noopener noreferrer">
        {t('auth.privacyLink')}
      </a>
    </>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Topbar — как в макете register.html (P25: шапка обязательна) */}
      <div className="topbar">
        <TopbarMenu />
        <div className="topbar__title">{t('auth.register')}</div>
        <div className="topbar__right">
          <div className="mascot">🦊</div>
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>

      {/* Auth */}
      <div className="auth-container">
        <div className="auth-card">
          {/* Title */}
          <h1 className="auth-title">{t('auth.createAccount')}</h1>
          <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>

          {/* OAuth: сетка квадратов (P20/P21) */}
          <OAuthGrid onProviderClick={handleOAuth} />

          <div className="auth-divider">{t('auth.orEmail')}</div>

          {/* Registration form */}
          {!showCodeStep ? (
            <form onSubmit={handleRegister}>
              {/* Name */}
              <div className="form-group">
                <label className="form-label">{t('auth.name')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('auth.namePlaceholder')}
                  value={displayName}
                  onChange={(e) => updateAvatarPreview(e.target.value)}
                />
              </div>

              {/* Avatar preview */}
              <div className="form-group">
                <label className="form-label">{t('auth.avatar')}</label>
                <div className="flex items-center gap-3">
                  <div
                    className="avatar avatar--lg avatar--bordered"
                    style={{
                      background: avatarPreview?.includes('linear-gradient')
                        ? avatarPreview.replace('|', ' ')
                        : 'linear-gradient(135deg, #2db84d, #1e9e3e)',
                      clipPath: 'var(--octagon-clip)',
                    }}
                  >
                    <div className="avatar__inner">
                      <span style={{ fontSize: '28px', color: '#fff', fontWeight: 700 }}>
                        {avatarPreview?.split('|')[0] || 'ИИ'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-secondary mb-2">
                      {t('auth.avatarHint')}
                    </p>
                    <button
                      type="button"
                      className="btn btn--tertiary btn--sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📷 {t('auth.uploadAvatar')}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">{t('auth.email')}</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="ivan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">{t('auth.password')}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="form-hint">{t('auth.passwordHint')}</p>
              </div>

              {/* Confirm password */}
              <div className="form-group">
                <label className="form-label">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {/* Legal checkbox */}
              <LegalCheckbox
                checked={agreed}
                onChange={setAgreed}
                label={agreeLabel}
              />

              {/* Captcha */}
              <div className="card mb-4" style={{ padding: '12px' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    style={{
                      width: '120px',
                      height: '40px',
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 700,
                      letterSpacing: '4px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace',
                      userSelect: 'none',
                    }}
                  >
                    {captcha}
                  </div>
                  <button
                    type="button"
                    className="btn btn--tertiary btn--sm"
                    title="Обновить"
                    onClick={generateCaptcha}
                  >
                    🔄
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('auth.captchaPlaceholder')}
                  value={captchaCode}
                  onChange={(e) => setCaptchaCode(e.target.value)}
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm" style={{ color: 'var(--danger)', marginBottom: '12px', textAlign: 'center' }}>
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn btn--primary btn--block mb-4"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? t('auth.signingUp') : t('auth.signUp')}
              </button>
            </form>
          ) : (
            /* Email verification code step */
            <div>
              <div className="card mb-4" style={{ padding: '16px', borderLeft: '4px solid var(--accent)' }}>
                <p className="text-sm text-secondary mb-3">
                  📨 {t('auth.codeSent')}
                </p>
                <div className="form-group mb-3">
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('auth.codePlaceholder')}
                    maxLength={6}
                    style={{
                      textAlign: 'center',
                      fontSize: '20px',
                      letterSpacing: '8px',
                      fontFamily: 'monospace',
                    }}
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                    }
                  />
                </div>
                <button
                  className="btn btn--primary btn--block mb-2"
                  onClick={handleVerifyEmail}
                >
                  {t('auth.confirmCode')}
                </button>
                <p className="text-xs text-muted text-center">
                  {t('auth.noCode')}{' '}
                  <a
                    href="#"
                    className="text-accent"
                    onClick={(e) => {
                      e.preventDefault();
                      handleResendCode();
                    }}
                  >
                    {resendTimer > 0 ? t('auth.resendIn', { n: resendTimer }) : t('auth.resend')}
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Login link */}
          <p className="text-center text-sm text-secondary">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-accent">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>

      {/* Footer — юридические ссылки (P25: как на странице входа) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          padding: '16px',
          fontSize: '13px',
        }}
      >
        <Link to="/rules" className="text-secondary" style={{ textDecoration: 'none' }}>
          {t('footer.rules')}
        </Link>
        <Link to="/privacy" className="text-secondary" style={{ textDecoration: 'none' }}>
          {t('footer.privacy')}
        </Link>
        <Link to="/cookies" className="text-secondary" style={{ textDecoration: 'none' }}>
          {t('footer.cookies')}
        </Link>
      </div>
    </div>
  );
}

export default RegisterScreen;

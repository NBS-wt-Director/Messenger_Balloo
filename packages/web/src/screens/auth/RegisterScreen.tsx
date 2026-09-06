// Register Screen — экран регистрации
// Макет: mockups/balloo-su/register.html
// JWT tokens stored in httpOnly cookies (not localStorage)

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { OAuthButton } from '@/components/auth/OAuthButton';
import { LegalCheckbox } from '@/components/auth/LegalCheckbox';

function RegisterScreen() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

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
      setError('Введите ваше имя');
      return;
    }
    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    if (!password.trim() || password.length < 8) {
      setError('Пароль минимум 8 символов');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (!agreed) {
      setError('Необходимо согласие с правилами');
      return;
    }
    if (captchaCode.toUpperCase() !== captcha.toUpperCase()) {
      setError('Неверный код с картинки');
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
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (verificationCode.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }
    try {
      await api.verifyEmail(verificationCode);
      navigate('/chat', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Неверный код');
    }
  };

  const handleResendCode = () => {
    if (resendTimer === 0) {
      setResendTimer(60);
      // In real app, call API to resend
    }
  };

  // OAuth handler
  const handleOAuth = async (provider: string) => {
    try {
      const oauthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3100'}/api/auth/oauth/${provider}`;
      window.location.href = oauthUrl;
    } catch (err: any) {
      setError(err.message || 'Ошибка OAuth');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Title */}
        <h1 className="auth-title">Создать аккаунт</h1>
        <p className="auth-subtitle">Зарегистрируйтесь в Balloo Messenger</p>

        {/* OAuth buttons */}
        <div className="auth-oauth">
          <OAuthButton
            provider="yandex"
            label="Через Яндекс"
            icon={<span style={{ color: '#fc3f1d' }}>Y</span>}
            onClick={() => handleOAuth('yandex')}
          />
          <OAuthButton
            provider="vk"
            label="Через VK"
            icon={<span style={{ color: '#0077FF' }}>VK</span>}
            onClick={() => handleOAuth('vk')}
          />
          <OAuthButton
            provider="yandex"
            label="Через Yandex (дубль)"
            icon={<span style={{ color: '#fc3f1d' }}>Y</span>}
            onClick={() => handleOAuth('yandex')}
          />
          <OAuthButton
            provider="mailru"
            label="Через Mail.ru"
            icon={<span style={{ color: '#005ff9' }}>@</span>}
            onClick={() => handleOAuth('mailru')}
          />
        </div>

        <div className="auth-divider">или email</div>

        {/* Registration form */}
        {!showCodeStep ? (
          <form onSubmit={handleRegister}>
            {/* Name */}
            <div className="form-group">
              <label className="form-label">Имя</label>
              <input
                type="text"
                className="form-input"
                placeholder="Иван Иванов"
                value={displayName}
                onChange={(e) => updateAvatarPreview(e.target.value)}
              />
            </div>

            {/* Avatar preview */}
            <div className="form-group">
              <label className="form-label">Аватарка</label>
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
                    Автоаватар генерируется из имени со случайным градиентом фона
                  </p>
                  <button
                    type="button"
                    className="btn btn--tertiary btn--sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📷 Загрузить свою
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
              <label className="form-label">Email</label>
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
              <label className="form-label">Пароль</label>
              <input
                type="password"
                className="form-input"
                placeholder="Минимум 8 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="form-hint">Латиница, кириллица, цифры и спецсимволы</p>
            </div>

            {/* Confirm password */}
            <div className="form-group">
              <label className="form-label">Повторите пароль</label>
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
                placeholder="Введите код с картинки"
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
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
        ) : (
          /* Email verification code step */
          <div>
            <div className="card mb-4" style={{ padding: '16px', borderLeft: '4px solid var(--accent)' }}>
              <p className="text-sm text-secondary mb-3">
                📨 На ваш email отправлен код подтверждения. Введите его ниже:
              </p>
              <div className="form-group mb-3">
                <input
                  type="text"
                  className="form-input"
                  placeholder="6-значный код"
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
                Подтвердить
              </button>
              <p className="text-xs text-muted text-center">
                Не пришёл код?{' '}
                <a
                  href="#"
                  className="text-accent"
                  onClick={(e) => {
                    e.preventDefault();
                    handleResendCode();
                  }}
                >
                  {resendTimer > 0 ? `Отправить снова (через ${resendTimer} сек)` : 'Отправить снова'}
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Login link */}
        <p className="text-center text-sm text-secondary">
          Уже есть аккаунт?{' '}
          <a href="/login" className="text-accent">
            Войти
          </a>
        </p>
      </div>
    </div>
  );
}

export default RegisterScreen;
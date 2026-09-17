// Login Screen — экран авторизации
// Макет: mockups/balloo-su/login.html (+ login.md)
// JWT — httpOnly cookies (не localStorage); при needs2FA → /two-factor

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { OAuthButton } from '@/components/auth/OAuthButton';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { ThemeSwitcher } from '@/components/topbar/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/topbar/LanguageSwitcher';

function LoginScreen() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    if (!password) {
      setError('Введите пароль');
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
      setError(err?.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3100';
    window.location.href = `${apiBase}/api/auth/oauth/${provider}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Topbar — как в макете login.html */}
      <div className="topbar">
        <div className="topbar__logo" onClick={() => navigate('/')}>
          <div className="topbar__logo-icon">B</div>
          <span>Balloo</span>
        </div>
        <div className="topbar__title">Вход</div>
        <div className="topbar__right">
          <div className="mascot">🦊</div>
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>

      {/* Auth card */}
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">С возвращением!</h1>
          <p className="auth-subtitle">Войдите в свой аккаунт Balloo</p>

          {/* OAuth */}
          <div className="auth-oauth">
            <OAuthButton
              provider="yandex"
              label="Войти через Яндекс"
              icon={<span>Y</span>}
              onClick={() => handleOAuth('yandex')}
            />
            <OAuthButton
              provider="mailru"
              label="Войти через Mail.ru"
              icon={<span>@</span>}
              onClick={() => handleOAuth('mailru')}
            />
            <OAuthButton
              provider="rambler"
              label="Войти через Rambler"
              icon={<span>R</span>}
              onClick={() => handleOAuth('rambler')}
            />
          </div>

          <div className="auth-divider">или</div>

          {/* Email form */}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
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
                label="Пароль"
                value={password}
                onChange={setPassword}
              />
              <div style={{ textAlign: 'right', marginTop: '4px' }}>
                <Link
                  to="/reset-password"
                  style={{ color: 'var(--accent)', fontSize: '13px' }}
                >
                  Забыли пароль?
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

            <button
              type="submit"
              className="btn btn--primary btn--block mb-4"
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </form>

          <div className="divider" />

          {/* Login via another device (QR) */}
          <div className="text-center mb-4">
            <p className="text-sm text-secondary mb-3">
              Уже вошли на другом устройстве?
            </p>
            <button
              type="button"
              className="btn btn--secondary btn--block"
              onClick={() => navigate('/add-device')}
            >
              📱 Войти через другое устройство (QR)
            </button>
            <p className="text-xs text-muted mt-2">
              Отсканируйте QR-код с экрана авторизованного устройства
            </p>
          </div>

          <div className="divider" />

          <p className="text-center text-sm text-secondary">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-accent">
              Зарегистрироваться
            </Link>
          </p>

          <div className="divider" />
          <p className="text-center text-xs text-muted">
            v2: Вход через Госуслуги и SMS-код (3 цифры)
          </p>
        </div>
      </div>

      {/* Footer — юридические ссылки */}
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
          Правила
        </Link>
        <Link to="/privacy" className="text-secondary" style={{ textDecoration: 'none' }}>
          Конфиденциальность
        </Link>
        <Link to="/cookies" className="text-secondary" style={{ textDecoration: 'none' }}>
          Cookies
        </Link>
      </div>
    </div>
  );
}

export default LoginScreen;

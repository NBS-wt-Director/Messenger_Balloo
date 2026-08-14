// Two Factor Screen — экран двухфакторной аутентификации
// Макет: mockups/balloo-su/two-factor.html
// Два сценария:
// 1. Вход с 2FA (ввод TOTP кода после логина)
// 2. Настройка 2FA в настройках (QR + verification + backup codes)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { CodeInput } from '@/components/auth/CodeInput';

type TwoFactorMode = 'login' | 'setup' | 'disable';

interface TwoFactorScreenProps {
  mode?: TwoFactorMode;
}

function TwoFactorScreen({ mode = 'login' }: TwoFactorScreenProps) {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Setup mode state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Disable mode state
  const [disablePassword, setDisablePassword] = useState('');

  // Generate QR code placeholder (in real app, use QR library)
  const generateQRPlaceholder = () => {
    // In production, this would be a real QR code image
    // For now, use a data URL with a simple QR-like pattern
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#000000';

      // Simple grid pattern to simulate QR
      const size = 8;
      for (let x = 0; x < 200; x += size) {
        for (let y = 0; y < 200; y += size) {
          if (Math.random() > 0.5) {
            ctx.fillRect(x, y, size, size);
          }
        }
      }

      // Corner markers
      ctx.fillRect(10, 10, 50, 50);
      ctx.fillRect(140, 10, 50, 50);
      ctx.fillRect(10, 140, 50, 50);
      ctx.clearRect(18, 18, 34, 34);
      ctx.clearRect(148, 18, 34, 34);
      ctx.clearRect(18, 148, 34, 34);
    }
    return canvas.toDataURL();
  };

  // Setup 2FA
  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.enable2FA();
      setQrCode(data.qrCode || generateQRPlaceholder());
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Ошибка включения 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Verify 2FA code
  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.verify2FA(code);

      if (mode === 'login') {
        // After login 2FA verification, go to main chat
        navigate('/chat', { replace: true });
      } else if (mode === 'setup') {
        // After setup verification, show backup codes
        if (data.backupCodes) {
          setBackupCodes(data.backupCodes);
        }
        setStep(4);
      }
    } catch (err: any) {
      setError(err.message || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!disablePassword.trim()) {
      setError('Введите пароль для подтверждения');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.disable2FA(disablePassword);
      updateUser({ isTwoFAEnabled: false });
      setSuccess('2FA отключена');
      setTimeout(() => navigate('/settings', { replace: true }), 1500);
    } catch (err: any) {
      setError(err.message || 'Ошибка отключения 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate backup codes
  const handleRegenerateCodes = () => {
    // In real app, call API
    const newCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 6).toUpperCase() +
      '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase()
    );
    setBackupCodes(newCodes);
  };

  // Copy backup code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (mode === 'login') {
    // Login 2FA screen — simple TOTP input
    return (
      <div className="auth-container">
        <div className="auth-card">
          {/* Title */}
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              clipPath: 'var(--octagon-clip)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            🔐
          </div>
          <h1 className="auth-title">Двухфакторная аутентификация</h1>
          <p className="auth-subtitle">
            Введите код из вашего приложения-аутентификатора
          </p>

          {/* Code input */}
          <div className="form-group">
            <label className="form-label">6-значный код</label>
            <input
              type="text"
              className="form-input"
              placeholder="000 000"
              maxLength={7}
              style={{
                textAlign: 'center',
                fontSize: '22px',
                letterSpacing: '6px',
                fontFamily: 'monospace',
              }}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\s/g, '').replace(/[^0-9]/g, '').slice(0, 6))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerify();
              }}
              autoFocus
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
            className="btn btn--primary btn--block"
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            style={{ opacity: loading || code.length !== 6 ? 0.6 : 1 }}
          >
            {loading ? 'Проверка...' : 'Подтвердить'}
          </button>

          <div className="divider" />

          {/* Backup code */}
          <p className="text-center text-sm text-secondary mb-3">
            Нет доступа к коду?
          </p>
          <button
            className="btn btn--secondary btn--block"
            onClick={() => {
              // Navigate to backup code input
              alert('Введите backup-код');
            }}
          >
            Использовать backup-код
          </button>

          <div className="divider" />

          {/* SMS fallback */}
          <p className="text-center text-xs text-muted">
            <a href="#" className="text-accent" onClick={(e) => { e.preventDefault(); alert('Код отправлен по SMS'); }}>
              Отправить код по SMS
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'disable') {
    // Disable 2FA screen
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title" style={{ color: 'var(--danger)' }}>Отключение 2FA</h1>
          <p className="auth-subtitle">
            Отключение 2FA снизит безопасность аккаунта
          </p>

          <div className="form-group">
            <label className="form-label">Пароль для подтверждения</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--danger)', marginBottom: '12px' }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm" style={{ color: 'var(--accent)', marginBottom: '12px' }}>
              {success}
            </p>
          )}

          <button
            className="btn btn--danger btn--block"
            onClick={handleDisable2FA}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Отключение...' : 'Отключить 2FA'}
          </button>

          <div className="divider" />

          <button
            className="btn btn--tertiary btn--block"
            onClick={() => navigate('/settings')}
          >
            ← Назад к настройкам
          </button>
        </div>
      </div>
    );
  }

  // Setup 2FA screen (in settings)
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <h1 className="auth-title">🔐 Двухфакторная аутентификация</h1>
        <p className="auth-subtitle">
          Защитите аккаунт с помощью TOTP-кода из приложения-аутентификатора
        </p>

        {/* Status card */}
        <div
          className="card mb-6"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(var(--blur))',
            border: '1px solid var(--border-color)',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              clipPath: 'var(--octagon-clip)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            🔐
          </div>
          <div style={{ flex: 1 }}>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {step >= 4 ? '2FA включена' : 'Настройка 2FA'}
            </div>
            <div className="text-sm text-secondary">
              Коды обновляются каждые 30 секунд
            </div>
          </div>
          <span
            className="chip chip--accent"
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              borderRadius: '4px',
              background: step >= 4 ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: step >= 4 ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {step >= 4 ? 'Активна' : 'Не активна'}
          </span>
        </div>

        {/* Step 1: Enable 2FA */}
        {step === 1 && (
          <div>
            <div className="section-title">Шаг 1. Включите двухфакторную аутентификацию</div>
            <div className="card mb-6" style={{ padding: '16px' }}>
              <p className="text-sm text-secondary mb-4">
                Нажмите кнопку ниже, чтобы создать QR-код и секретный ключ
              </p>
              <button
                className="btn btn--primary btn--block"
                onClick={handleEnable2FA}
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Создание...' : 'Создать QR-код'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: QR Code */}
        {step === 2 && qrCode && (
          <div>
            <div className="section-title">Шаг 2. Отсканируйте QR-код</div>
            <div className="card mb-6" style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  margin: '0 auto 16px',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                }}
              >
                <img
                  src={qrCode}
                  alt="QR Code"
                  style={{ width: '180px', height: '180px' }}
                />
              </div>
              {secret && (
                <>
                  <div className="text-sm text-secondary mb-2">
                    Или введите секрет вручную:
                  </div>
                  <code
                    style={{
                      display: 'block',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--accent)',
                      fontSize: '13px',
                      letterSpacing: '1px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {secret}
                  </code>
                </>
              )}
            </div>
            <button
              className="btn btn--primary btn--block mb-4"
              onClick={() => setStep(3)}
            >
              Далее →
            </button>
          </div>
        )}

        {/* Step 3: Verify code */}
        {step === 3 && (
          <div>
            <div className="section-title">Шаг 3. Введите код из приложения</div>
            <div className="card mb-6">
              <CodeInput
                value={code}
                onChange={setCode}
                maxLength={6}
                placeholder="000 000"
                autoFocus
              />
              {error && (
                <p className="text-sm" style={{ color: 'var(--danger)', marginTop: '8px', textAlign: 'center' }}>
                  {error}
                </p>
              )}
              <button
                className="btn btn--primary btn--block mt-4"
                onClick={handleVerify}
                disabled={loading || code.length !== 6}
                style={{ opacity: loading || code.length !== 6 ? 0.6 : 1 }}
              >
                {loading ? 'Проверка...' : 'Подтвердить'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Backup codes */}
        {step === 4 && (
          <div>
            <div className="section-title">Шаг 4. Backup-коды</div>
            <div className="card mb-6">
              <div className="text-sm text-secondary mb-4">
                Сохраните эти коды в надёжном месте. Каждый можно использовать один раз.
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontFamily: 'monospace',
                  marginBottom: '16px',
                }}
              >
                {backupCodes.slice(0, 6).map((bc, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleCopyCode(bc)}
                    title="Нажмите, чтобы скопировать"
                  >
                    <span>{bc}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📋</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted mt-4">
                Сохраните все 10 кодов в безопасном месте
              </div>
              <button
                className="btn btn--secondary btn--sm mt-4"
                onClick={handleRegenerateCodes}
              >
                🔄 Перегенерировать коды
              </button>
            </div>

            {/* Done */}
            <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent)' }}>
              <p className="text-sm" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                ✅ 2FA успешно включена!
              </p>
              <button
                className="btn btn--primary btn--block mt-4"
                onClick={() => navigate('/settings', { replace: true })}
              >
                Готово
              </button>
            </div>
          </div>
        )}

        {/* Disable section */}
        {step >= 4 && (
          <>
            <div className="divider mt-6" />
            <div className="section-title" style={{ color: 'var(--danger)' }}>
              Отключение
            </div>
            <div
              className="card"
              style={{
                border: '1px solid var(--danger)',
                padding: '16px',
              }}
            >
              <div className="text-sm text-secondary mb-4">
                Отключение 2FA снизит безопасность аккаунта.
              </div>
              <button
                className="btn btn--danger btn--block"
                onClick={() => navigate('/settings/2fa/disable')}
              >
                Отключить 2FA
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TwoFactorScreen;

// DesktopPasswordChangeScreen — форма смены пароля из настроек
// Вызывается из DesktopSettingsScreen (раздел "Безопасность")

import React, { useState } from 'react';
import { api } from '@balloo/web/services/api';

export function DesktopPasswordChangeScreen({ onBack }: { onBack: () => void }) {
  const [codeSent, setCodeSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    setSending(true);
    setError(null);
    try {
      await api.sendPasswordChangeCode();
      setCodeSent(true);
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки кода');
    } finally {
      setSending(false);
    }
  };

  const handleChange = async () => {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }
    setChanging(true);
    try {
      await api.changePassword(code, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Ошибка смены пароля');
    } finally {
      setChanging(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: 48, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%' }}>
        <div style={{ width: 420, padding: 32, background: 'var(--bg-secondary, #1e1e2e)', border: '1px solid var(--border-color, #333)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, color: 'var(--text-primary, #fff)' }}>Пароль изменён</h2>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary, #8a8aa0)' }}>Все прочие сессии завершены</p>
          <button onClick={onBack} style={{ padding: '10px 24px', background: 'var(--accent, #2db84d)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 6 }}>
            Готово
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 48, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%' }}>
      <div style={{ width: 420, padding: 32, background: 'var(--bg-secondary, #1e1e2e)', border: '1px solid var(--border-color, #333)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary, #8a8aa0)', cursor: 'pointer', fontSize: 18, padding: 4 }}>&larr;</button>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary, #fff)' }}>🔐 Смена пароля</h2>
        </div>

        {!codeSent ? (
          <div>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-secondary, #8a8aa0)' }}>
              Код подтверждения будет отправлен на вашу почту
            </p>
            {error && <div style={{ color: '#e53e3e', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button onClick={handleSendCode} disabled={sending} style={{ width: '100%', padding: '10px 20px', background: sending ? 'var(--bg-tertiary, #2a2a3a)' : 'var(--accent, #2db84d)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 6 }}>
              {sending ? 'Отправка...' : '📧 Отправить код на email'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary, #8a8aa0)', marginBottom: 4 }}>Код из письма</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-значный код"
                maxLength={6}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary, #2a2a3a)', border: '1px solid var(--border-color, #333)', color: 'var(--text-primary, #fff)', fontSize: 14, outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: 6, fontFamily: "'JetBrains Mono', monospace", borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary, #8a8aa0)', marginBottom: 4 }}>Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary, #2a2a3a)', border: '1px solid var(--border-color, #333)', color: 'var(--text-primary, #fff)', fontSize: 14, outline: 'none', boxSizing: 'border-box', borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary, #8a8aa0)', marginBottom: 4 }}>Подтверждение пароля</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary, #2a2a3a)', border: '1px solid var(--border-color, #333)', color: 'var(--text-primary, #fff)', fontSize: 14, outline: 'none', boxSizing: 'border-box', borderRadius: 4 }}
              />
            </div>
            {error && <div style={{ color: '#e53e3e', fontSize: 13, marginBottom: 4 }}>{error}</div>}
            <button onClick={handleChange} disabled={changing || code.length !== 6} style={{ width: '100%', padding: '10px 20px', background: (changing || code.length !== 6) ? 'var(--bg-tertiary, #2a2a3a)' : 'var(--accent, #2db84d)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: (changing || code.length !== 6) ? 'not-allowed' : 'pointer', borderRadius: 6, marginTop: 4 }}>
              {changing ? 'Смена...' : 'Сменить пароль'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

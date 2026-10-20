// DesktopPasswordResetScreen — desktop wrapper for password reset
// Mockup: mockups/desktop/password-reset.html (1_09_08)
// Обновлено: добавлен блок подтверждения email (тикет 1792477132-03)

import React, { useState } from 'react';
import { api } from '@balloo/web/services/api';

export function DesktopPasswordResetScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      await api.requestPasswordReset(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  const emailBlock = (
    <div style={{ marginTop: 20, padding: 16, background: 'rgba(59,158,255,0.08)', border: '1px solid var(--info, #3b9eff)', borderRadius: 6, textAlign: 'left' }}>
      <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--info, #3b9eff)' }}>📧 Подтверждение email</p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary, #8a8aa0)' }}>
        Если email не подтверждён, функции ограничены.{' '}
        <a href="#" style={{ color: 'var(--accent, #2db84d)' }} onClick={(e) => e.preventDefault()}>Отправить письмо подтверждения</a>
      </p>
    </div>
  );

  if (sent) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={styles.title}>Письмо отправлено</h2>
          <p style={styles.subtitle}>
            Если аккаунт с адресом {email} существует, мы отправили ссылку для сброса пароля.
          </p>
          {emailBlock}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Восстановление пароля</h2>
        <p style={styles.subtitle}>Введите email — мы отправим ссылку для сброса</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            style={styles.input}
            required
          />
          {error && <div style={{ color: 'var(--danger, #e53e3e)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Отправка…' : 'Отправить ссылку'}
          </button>
        </form>
        {emailBlock}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 48, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%' },
  card: { width: 400, padding: 32, background: 'var(--bg-secondary, #1e1e2e)', border: '1px solid var(--border-color, #333)', textAlign: 'center' },
  title: { margin: '0 0 8px', fontSize: 20, color: 'var(--text-primary, #fff)' },
  subtitle: { margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary, #8a8aa0)' },
  input: { width: '100%', padding: '10px 14px', marginBottom: 16, background: 'var(--bg-tertiary, #2a2a3a)', border: '1px solid var(--border-color, #333)', color: 'var(--text-primary, #fff)', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px 20px', background: 'var(--accent, #2db84d)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

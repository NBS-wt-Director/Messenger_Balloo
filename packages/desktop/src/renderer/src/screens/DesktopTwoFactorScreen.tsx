// DesktopTwoFactorScreen — 2FA verification
// Mockup: mockups/desktop/two-factor.html (1_09_09)

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@balloo/web/services/api';

export function DesktopTwoFactorScreen({ onSuccess }: { onSuccess?: () => void }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setCode(text.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async () => {
    const token = code.join('');
    if (token.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      await api.verify2FA(token);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Неверный код');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <h2 style={styles.title}>Двухфакторная аутентификация</h2>
        <p style={styles.subtitle}>Введите 6-значный код из приложения-аутентификатора</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={styles.codeInput}
            />
          ))}
        </div>
        {error && <div style={{ color: 'var(--danger, #e53e3e)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading || code.join('').length < 6} style={styles.button}>
          {loading ? 'Проверка…' : 'Подтвердить'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 48, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%' },
  card: { width: 400, padding: 32, background: 'var(--bg-secondary, #1e1e2e)', border: '1px solid var(--border-color, #333)', textAlign: 'center' },
  title: { margin: '0 0 8px', fontSize: 20, color: 'var(--text-primary, #fff)' },
  subtitle: { margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary, #8a8aa0)' },
  codeInput: { width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 700, background: 'var(--bg-tertiary, #2a2a3a)', border: '1px solid var(--border-color, #333)', color: 'var(--text-primary, #fff)', outline: 'none' },
  button: { width: '100%', padding: '10px 20px', background: 'var(--accent, #2db84d)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

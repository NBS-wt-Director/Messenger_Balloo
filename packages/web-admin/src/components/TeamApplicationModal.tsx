// TeamApplicationModal — форма заявки в команду Balloo (тик. 1795888510).
//
// Открывается с экрана отказа админки. Показывает id Balloo (username), чтобы
// заявку можно было узнать в админке, и отправляет её на POST /api/team-applications.
// Заявка хранится на сервере и обрабатывается в разделе «Заявки в команду».

import { useState } from 'react';
import { adminApi, AdminApiError } from '../api';

interface TeamApplicationModalProps {
  /** id Balloo текущего пользователя (username или id) — показывается в форме. */
  ballooId: string;
  onClose: () => void;
  /** Вызывается после успешной отправки — экран отказа показывает статус. */
  onSubmitted: () => void;
}

export function TeamApplicationModal({ ballooId, onClose, onSubmitted }: TeamApplicationModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (sending) return;
    try {
      setSending(true);
      setError(null);
      await adminApi.submitTeamApplication(message.trim() || undefined);
      onSubmitted();
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Не удалось отправить заявку');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
      />
      <div
        role="dialog"
        aria-label="Заявка в команду Balloo"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxWidth: 520,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          zIndex: 1001,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            📨 Заявка в команду Balloo
          </span>
          <button className="btn btn--tertiary btn--sm" onClick={onClose} title="Закрыть">
            ✕
          </button>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Ваш id Balloo: <strong style={{ color: 'var(--text-primary)' }}>{ballooId}</strong> —
            он сохранится в заявке, чтобы команда могла связаться с вами.
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>
          )}

          <label
            htmlFor="team-application-message"
            style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'var(--text-primary)' }}
          >
            Расскажите о себе (необязательно)
          </label>
          <textarea
            id="team-application-message"
            className="form-input"
            rows={5}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Чем хотите помочь проекту, опыт, ссылки на профиль…"
            style={{ width: '100%', resize: 'vertical' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button className="btn btn--tertiary" onClick={onClose}>
              Отмена
            </button>
            <button className="btn btn--primary" onClick={submit} disabled={sending}>
              {sending ? 'Отправка…' : 'Отправить заявку'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

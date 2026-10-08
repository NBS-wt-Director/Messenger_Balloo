// FeedbackModal — глобальная модалка обратной связи (задание 04)
// Кнопка «💬 Обратная связь» в шапке и в мобильном меню → POST /feedback
// Типы: баг / предложение / вопрос / идея / жалоба. Авторизованные пользователи
// отправляют от своего имени (связь с users), анонимные — без привязки.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';

interface FeedbackModalProps {
  onClose: () => void;
}

const FEEDBACK_TYPES = [
  { value: 'bug', label: '🐛 Баг' },
  { value: 'feature', label: '💡 Предложение' },
  { value: 'question', label: '❓ Вопрос' },
  { value: 'idea', label: '✨ Идея' },
  { value: 'complaint', label: '⚠️ Жалоба' },
] as const;

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [type, setType] = useState<string>('bug');
  const [text, setText] = useState('');
  const [contact, setContact] = useState('');
  const [pageUrl, setPageUrl] = useState(() => window.location.pathname);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    onClose();
    navigate('/');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 10) {
      setError('Опишите подробнее — минимум 10 символов.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/feedback', {
        method: 'POST',
        body: JSON.stringify({
          type,
          text: text.trim(),
          contact: contact.trim() || undefined,
          pageUrl: pageUrl.trim() || undefined,
        }),
      });
      setDone(true);
    } catch {
      setError('Не удалось отправить. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={close}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-card, #16181f)',
          border: '1px solid var(--border, #2a2d37)',
          borderRadius: 14,
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 40 }}>✅</div>
            <h3 style={{ margin: '12px 0 6px' }}>Спасибо за обратную связь!</h3>
            <p style={{ color: 'var(--text-secondary, #9aa0ae)', fontSize: 14 }}>
              {isAuthenticated
                ? 'Мы ответим вам в личные сообщения.'
                : 'Мы разберём обращение и при необходимости свяжемся с вами.'}
            </p>
            <button
              onClick={close}
              style={{
                marginTop: 16,
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent, #6c5ce7)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18 }}>💬 Обратная связь</h3>
              <button
                type="button"
                onClick={close}
                aria-label="Закрыть"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #9aa0ae)',
                  fontSize: 20,
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {FEEDBACK_TYPES.map((t) => (
                <label
                  key={t.value}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontSize: 13,
                    cursor: 'pointer',
                    border:
                      type === t.value
                        ? '1px solid var(--accent, #6c5ce7)'
                        : '1px solid var(--border, #2a2d37)',
                    background:
                      type === t.value ? 'rgba(108,92,231,0.12)' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="feedback-type"
                    value={t.value}
                    checked={type === t.value}
                    onChange={() => setType(t.value)}
                  />
                  {t.label}
                </label>
              ))}
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder="Опишите, что произошло, что не работает или что можно улучшить…"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 10,
                borderRadius: 8,
                border: '1px solid var(--border, #2a2d37)',
                background: 'var(--bg, #0f1116)',
                color: 'var(--text, #e6e8ee)',
                fontSize: 14,
                resize: 'vertical',
                marginBottom: 10,
              }}
            />

            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={200}
              placeholder={isAuthenticated ? 'Контакт для ответа (необязательно)' : 'Email или @telegram для ответа (необязательно)'}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 10,
                borderRadius: 8,
                border: '1px solid var(--border, #2a2d37)',
                background: 'var(--bg, #0f1116)',
                color: 'var(--text, #e6e8ee)',
                fontSize: 14,
                marginBottom: 10,
              }}
            />

            <input
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              maxLength={500}
              placeholder="Страница, к которой относится обращение"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 10,
                borderRadius: 8,
                border: '1px solid var(--border, #2a2d37)',
                background: 'var(--bg, #0f1116)',
                color: 'var(--text, #e6e8ee)',
                fontSize: 13,
                marginBottom: 12,
              }}
            />

            {!isAuthenticated && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary, #9aa0ae)', margin: '0 0 12px' }}>
                Вы отправляете обращение анонимно.{' '}
                <a href="/login" style={{ color: 'var(--accent, #6c5ce7)' }}>
                  Войдите
                </a>
                , чтобы мы могли ответить вам в мессенджере.
              </p>
            )}

            {error && (
              <p style={{ fontSize: 13, color: '#e74c3c', margin: '0 0 12px' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={close}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #2a2d37)',
                  background: 'transparent',
                  color: 'var(--text, #e6e8ee)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting || text.trim().length < 10}
                style={{
                  padding: '10px 22px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--accent, #6c5ce7)',
                  color: '#fff',
                  cursor: submitting ? 'wait' : 'pointer',
                  fontSize: 14,
                  opacity: submitting || text.trim().length < 10 ? 0.6 : 1,
                }}
              >
                {submitting ? 'Отправка…' : 'Отправить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

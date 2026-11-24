// SupportScreen — чат с техподдержкой (/support), тикет 1790572800-01
// ТЗ: mockups/balloo-su/support.md, макет mockups/balloo-su/support.html
//
// Доступен всем (тик. 1795497139-support-access-faq): гость видит FAQ +
// кнопку написать на почту; авторизованный — чат с поддержкой.
//
// Структура по макету: topbar (AppTopbar, title «Чат с поддержкой») →
// chat header (октагон-аватар 🦊, «Техподдержка Balloo», онлайн + среднее время
// ответа, chip приоритета) → лента сообщений (пузыри sender/receiver, тег
// «⚙ Автоответ» у бота) → input area (📎, textarea, ➤).
//
// Однопанельный экран без sidebar (ТЗ §Адаптивность: «Desktop: content без
// sidebar»), поэтому живёт отдельным top-level маршрутом.

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const SUPPORT_EMAIL = 'help@balloo.su';

const FAQ_ITEMS = [
  {
    q: 'Как восстановить пароль?',
    a: 'На экране входа нажмите «Забыли пароль?» и следуйте инструкциям — код придёт на email или push.',
  },
  {
    q: 'Как удалить аккаунт?',
    a: 'Настройки → Безопасность → Удалить аккаунт. Действие необратимо.',
  },
  {
    q: 'Не приходят уведомления',
    a: 'Проверьте настройки уведомлений (Настройки → Уведомления) и разрешения браузера.',
  },
  {
    q: 'Как связаться с оператором?',
    a: `Отправьте сообщение в этот чат или напишите на ${SUPPORT_EMAIL}.`,
  },
];

interface SupportMessage {
  id: string;
  text: string;
  authorId: string;
  isBot: boolean;
  createdAt: number;
}

interface SupportStatus {
  online: boolean;
  avgResponseMinutes: number;
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Низкий',
  normal: 'Обычный',
  high: 'Повышенный',
  urgent: 'Срочный',
};

function timeOf(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function SupportScreen() {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [status, setStatus] = useState<SupportStatus | null>(null);
  const [priority, setPriority] = useState('normal');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return; // гость — чат недоступен, рендерим FAQ
    try {
      const chat = await api.getSupportChat();
      setMessages(chat.messages ?? []);
      setPriority(chat.ticket?.priority ?? 'normal');
      setError(null);
    } catch {
      setError('Не удалось загрузить чат поддержки');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    api.getSupportStatus().then(setStatus).catch(() => setStatus(null));
  }, [load]);

  useEffect(() => {
    // jsdom (тесты) не реализует scrollIntoView — проверка на функцию.
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const clean = text.trim();
    if (!clean || sending) return;
    setSending(true);
    try {
      const created = await api.sendSupportMessage(clean);
      setText('');
      setMessages((prev) => [...prev, { ...created, isBot: false }]);
    } catch {
      setError('Сообщение не отправлено — попробуйте ещё раз');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Гость: FAQ + почта (тик. 1795497139-support-access-faq)
  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppTopbar title="Поддержка" />
        <div style={{ flex: 1, padding: '24px 16px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>Часто задаваемые вопросы</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ_ITEMS.map((item, i) => (
              <details key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '12px 16px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.q}
                </summary>
                <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>{item.a}</p>
              </details>
            ))}
          </div>
          <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
            <p style={{ color: 'var(--text-primary)', margin: '0 0 12px' }}>
              Не нашли ответ? Напишите нам — ответим в течение 24 часов.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
            >
              ✉ {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppTopbar title="Чат с поддержкой" />

      {/* Chat header — по макету support.html:19-23 */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--bg-secondary)',
        }}
      >
        <div className="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-new">
          <div className="avatar__inner">
            <img className="support-mascot" src="/assets/logos/mascot.png" alt="Маскот Balloo — медведь Борис" />
          </div>
        </div>
        <div className="flex-1">
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Техподдержка Balloo
          </div>
          <div className="text-xs text-muted">
            {status?.online === false ? '🔴 Офлайн' : '🟢 Онлайн'}
            {status ? ` • Среднее время ответа: ${status.avgResponseMinutes} мин` : ''}
          </div>
        </div>
        <span className="chip chip--accent">Приоритет: {PRIORITY_LABEL[priority] ?? 'Обычный'}</span>
      </div>

      {/* Messages */}
      <div className="messages" style={{ flex: 1, overflowY: 'auto' }}>
        {loading && (
          <div className="text-center text-muted" style={{ padding: 24 }}>
            Загрузка…
          </div>
        )}
        {!loading && error && (
          <div className="text-center text-muted" style={{ padding: 24 }}>
            {error}
          </div>
        )}
        {!loading &&
          !error &&
          messages.map((m) => {
            const isOwn = m.authorId === user?.id && !m.isBot;
            return (
              <div key={m.id} className={`message ${isOwn ? 'message--sender' : 'message--receiver'}`}>
                <div className="message__bubble">
                  <div className="message__header">
                    <span>{timeOf(m.createdAt)}</span>
                    {m.isBot && (
                      <span className="message__header-tag message__header-tag--auto">⚙ Автоответ</span>
                    )}
                  </div>
                  <div className="message__body" style={{ whiteSpace: 'pre-wrap' }}>
                    {m.text}
                  </div>
                  {!isOwn && !m.isBot && (
                    <div className="message__actions">
                      <button
                        className="message__action-btn"
                        title="Копировать"
                        onClick={() => navigator.clipboard.writeText(m.text)}
                      >
                        📋
                      </button>
                      <button className="message__action-btn" title="Спасибо">😊</button>
                    </div>
                  )}
                </div>
                {isOwn && (
                  <div className="msg-ticks msg-ticks--read">✓✓</div>
                )}
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>

      {/* Input area — по макету support.html:47-51 */}
      <div className="input-area">
        <button className="input-area__btn" title="Прикрепить файл" type="button">
          📎
        </button>
        <textarea
          className="input-area__field"
          placeholder="Опишите проблему..."
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          className="input-area__btn input-area__btn--send"
          onClick={send}
          disabled={sending || !text.trim()}
          title="Отправить"
          type="button"
        >
          ➤
        </button>
      </div>

      {/* Единый подвал (тик. 1795292000) */}
      <AppFooter />
    </div>
  );
}

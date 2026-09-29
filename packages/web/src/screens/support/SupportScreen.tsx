// SupportScreen — чат с техподдержкой (/support), тикет 1790572800-01
// ТЗ: mockups/balloo-su/support.md, макет mockups/balloo-su/support.html
//
// Структура по макету: topbar (AppTopbar, title «Чат с поддержкой») →
// chat header (октагон-аватар 🦊, «Техподдержка Balloo», онлайн + среднее время
// ответа, chip приоритета) → лента сообщений (пузыри sender/receiver, тег
// «⚙ Автоответ» у бота) → input area (📎, textarea, ➤).
//
// Однопанельный экран без sidebar (ТЗ §Адаптивность: «Desktop: content без
// sidebar»), поэтому живёт отдельным top-level защищённым маршрутом.

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppTopbar } from '@/components/chrome/AppTopbar';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

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
  }, []);

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
            <span>🦊</span>
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
    </div>
  );
}

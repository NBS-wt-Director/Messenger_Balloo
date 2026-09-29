// AdminSupportScreen — раздел «Поддержка» в дашборде админки (ответ В-33).
//
// Тикет 1790572800-01, пункт «страница в дашборде в админке»:
// список тикетов поддержки (статус, приоритет, пользователь, число сообщений),
// открытие тикета с перепиской и ответ администратора (обычный / внутренняя заметка).
//
// API: GET /api/admin/support/tickets, GET /api/admin/support/tickets/:id,
//      POST /api/admin/support/tickets/:id/reply

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/services/api';

interface TicketUser {
  id: string;
  username?: string | null;
  displayName?: string | null;
  email?: string | null;
}

interface TicketEntry {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: number;
  updatedAt: number;
  messagesCount: number;
  user: TicketUser;
}

interface TicketMessage {
  id: string;
  text: string;
  authorId: string;
  isInternal: boolean;
  createdAt: number;
}

interface TicketDetail {
  id: string;
  subject: string;
  status: string;
  priority: string;
  user: TicketUser;
  messages: TicketMessage[];
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Низкий',
  normal: 'Обычный',
  high: 'Повышенный',
  urgent: 'Срочный',
};

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '', label: 'Все' },
  { key: 'open', label: 'Открытые' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'resolved', label: 'Решённые' },
];

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminSupportScreen() {
  const [tickets, setTickets] = useState<TicketEntry[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSupportTickets(status ? { status } : undefined);
      setTickets(res.tickets ?? []);
      setError(null);
    } catch {
      setError('Не удалось загрузить тикеты поддержки');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openTicket = async (id: string) => {
    try {
      setSelected(await api.getSupportTicket(id));
    } catch {
      setError('Не удалось открыть тикет');
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    try {
      await api.replySupportTicket(selected.id, reply.trim(), internal);
      setReply('');
      setInternal(false);
      setSelected(await api.getSupportTicket(selected.id));
      await loadTickets();
    } catch {
      setError('Ответ не отправлен');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>🛠️ Поддержка</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
        Обращения пользователей в техподдержку Balloo.
      </p>

      {/* Табы статуса */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key || 'all'}
            type="button"
            className={`btn ${status === tab.key ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setStatus(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.2fr' : '1fr', gap: 16 }}>
        {/* Список тикетов */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Загрузка…</div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Обращений нет</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px' }}>Пользователь</th>
                  <th style={{ padding: '10px 12px' }}>Статус</th>
                  <th style={{ padding: '10px 12px' }}>Приоритет</th>
                  <th style={{ padding: '10px 12px' }}>Сообщений</th>
                  <th style={{ padding: '10px 12px' }}>Обновлён</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openTicket(t.id)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      background: selected?.id === t.id ? 'var(--bg-tertiary)' : undefined,
                    }}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      {t.user.displayName || t.user.username || t.user.email || t.user.id}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="chip">{STATUS_LABELS[t.status] ?? t.status}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`chip${t.priority === 'high' || t.priority === 'urgent' ? ' chip--accent' : ''}`}>
                        {PRIORITY_LABELS[t.priority] ?? t.priority}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{t.messagesCount}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {formatDate(t.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Переписка и ответ */}
        {selected && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="font-semibold">
                  {selected.user.displayName || selected.user.username || selected.user.email}
                </div>
                <div className="text-xs text-muted">
                  {STATUS_LABELS[selected.status] ?? selected.status} •{' '}
                  {PRIORITY_LABELS[selected.priority] ?? selected.priority}
                </div>
              </div>
              <button type="button" className="btn btn--secondary" onClick={() => setSelected(null)}>
                Закрыть
              </button>
            </div>

            <div style={{ flex: 1, maxHeight: 360, overflowY: 'auto', marginBottom: 12 }}>
              {selected.messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '8px 12px',
                    marginBottom: 8,
                    background: m.isInternal ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-tertiary)',
                    borderLeft: m.isInternal ? '3px solid var(--warning)' : undefined,
                  }}
                >
                  <div className="text-xs text-muted" style={{ marginBottom: 4 }}>
                    {formatDate(m.createdAt)}
                    {m.isInternal && ' • внутренняя заметка'}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                </div>
              ))}
            </div>

            <textarea
              className="input-area__field"
              placeholder="Ответ пользователю…"
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                Внутренняя заметка
              </label>
              <button
                type="button"
                className="btn btn--primary"
                onClick={sendReply}
                disabled={sending || !reply.trim()}
              >
                Отправить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

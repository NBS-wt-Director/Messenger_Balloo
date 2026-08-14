// WebSocketSection — секция WebSocket событий
// Тикет №58 — Docs: API документация

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface WsEvent {
  event: string;
  payload: string;
  description: string;
}

export function WebSocketSection() {
  const [clientEvents, setClientEvents] = useState<WsEvent[]>([]);
  const [serverEvents, setServerEvents] = useState<WsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDocsWebSocket()
      .then((data) => {
        setClientEvents(data.clientToServer || []);
        setServerEvents(data.serverToClient || []);
      })
      .catch((err) => console.error('Ошибка загрузки WS events:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* URL подключения */}
      <div className="card mb-6">
        <h3 className="card__title">Подключение</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <code
            style={{
              background: 'var(--bg-tertiary)',
              padding: '4px 12px',
              fontFamily: "'Fira Code', monospace",
              color: 'var(--warning)',
              fontSize: '14px',
            }}
          >
            wss://balloo.su/ws?token=&lt;JWT&gt;
          </code>
          <span className="chip chip--info">WebSocket</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
          Для подключения передайте JWT access token в query-параметре <code style={{ color: 'var(--accent)' }}>token</code>.
          Heartbeat (ping/pong) каждые 30 секунд.
        </p>
      </div>

      {/* Client → Server */}
      <div className="section-title">📤 Client → Server</div>
      <div className="card mb-6">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Event</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Payload</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Описание</th>
            </tr>
          </thead>
          <tbody>
            {clientEvents.map((e, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
                <td style={{ padding: '8px 12px', fontFamily: "'Fira Code', monospace", color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                  {e.event}
                </td>
                <td style={{ padding: '8px 12px', fontFamily: "'Fira Code', monospace", color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {e.payload}
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{e.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Server → Client */}
      <div className="section-title">📥 Server → Client</div>
      <div className="card mb-6">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Event</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Payload</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Описание</th>
            </tr>
          </thead>
          <tbody>
            {serverEvents.map((e, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
                <td style={{ padding: '8px 12px', fontFamily: "'Fira Code', monospace", color: 'var(--info)', whiteSpace: 'nowrap' }}>
                  {e.event}
                </td>
                <td style={{ padding: '8px 12px', fontFamily: "'Fira Code', monospace", color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {e.payload}
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{e.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

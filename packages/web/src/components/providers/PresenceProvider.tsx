// PresenceProvider — глобальный слушатель WS presence (тикет 1795560001)
//
// Сервер рассылает `presence.update.broadcast` всем подключённым
// (packages/server/src/ws/handlers.ts:362-378). ChatViewScreen слушает WS
// только пока открыт конкретный чат, а статус «онлайн» нужен и на /contacts,
// и в шапке, и в публичном профиле. Поэтому держим отдельный сокет на всё
// приложение и пишем presence в usePresenceStore.
//
// Сокет не отправляет chat.join — только слушает broadcast-события.

import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { usePresenceStore } from '@/store/presenceStore';
import { useFooterTickerStore } from '@balloo/ui';

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuth().isAuthenticated;

  useEffect(() => {
    if (!isAuthenticated) return;

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3100';
    let ws: WebSocket | null = null;
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      if (cancelled) return;
      try {
        const response = await fetch(`${API_BASE}/api/auth/ws-token`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok || cancelled) return;
        const { token } = await response.json();
        const wsUrl = `${API_BASE.replace('http', 'ws')}/ws/?token=${token}`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'presence.update.broadcast' && data.userId) {
              const status =
                data.status === 'online' ? 'online'
                : data.status === 'away' ? 'away'
                : 'offline';
              usePresenceStore.getState().setPresence(data.userId, status);
            }

            // Уведомление → морзе-тикер подвала (тик. 1795677854).
            // Приоритеты (emergency > update > notification) — в store.
            if (data.type === 'notification.new' && data.source && data.body) {
              const ticker = useFooterTickerStore.getState();
              if (data.priority === 'emergency') {
                ticker.setEmergency({ left: data.source, right: data.body });
              } else if (data.priority === 'update') {
                ticker.setUpdate({ left: data.source, right: data.body });
              } else {
                ticker.setNotification({ source: data.source, body: data.body });
              }
            }
          } catch {
            /* игнорируем битые кадры */
          }
        };

        ws.onclose = () => {
          // Переподключение с экспоненциальной задержкой (max 30 с)
          if (!cancelled) {
            reconnectTimer = setTimeout(connect, Math.min(30_000, 2_000));
          }
        };
      } catch {
        /* нет токена / сети — молча выходим, presence останется из REST */
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}

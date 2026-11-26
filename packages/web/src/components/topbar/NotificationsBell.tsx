// NotificationsBell — колокольчик уведомлений (тик. 1795677854).
//
// Раньше это была заглушка («Тестовое уведомление»), потому что у модели
// Notification не было REST. Теперь данные настоящие: GET /api/notifications
// (список + unread), POST /api/notifications/:id/read.
//
// Если проп `count` передан явно (легаси-использование из TopBar.tsx),
// используется он; иначе колокольчик сам запрашивает сервер.

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/components/providers/I18nProvider';
import type { TranslationKey } from '@balloo/shared';

interface NotificationItem {
  id: string;
  type: string;
  preview: string;
  isRead: boolean;
  createdAt: number;
}

interface NotificationsBellProps {
  /** Внешний счётчик (легаси). Не задан — считаем сами по серверу. */
  count?: number;
  onClick?: () => void;
}

const POLL_MS = 60_000;

export function NotificationsBell({ count, onClick }: NotificationsBellProps) {
  const { t } = useI18n();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  const externalCount = typeof count === 'number';
  const badge = externalCount ? count : unread;

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getNotifications(30);
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // Сеть/сессия — не показываем ложную ошибку, оставляем прошлое состояние.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || externalCount) return;
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [isAuthenticated, externalCount, load]);

  const open = () => {
    const next = !isOpen;
    setIsOpen(next);
    onClick?.();
    if (next && !externalCount) load();
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (item.isRead) return;
    // Оптимистично: сразу гасим бейдж, ошибку не показываем.
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await api.readNotification(item.id);
    } catch {
      /* повторим при следующем открытии */
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={open}
        aria-label={t('notifications.title' as TranslationKey)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '20px',
          padding: '4px 8px',
          position: 'relative',
          color: 'var(--text-primary)',
        }}
      >
        🔔
        {badge > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: '#e53e3e',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '0',
              minWidth: '16px',
              textAlign: 'center',
            }}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            width: '300px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--text-primary)',
            }}
          >
            {t('notifications.title' as TranslationKey)}
            {unread > 0 && !externalCount && (
              <span style={{ float: 'right', color: 'var(--accent)', fontSize: '12px' }}>
                {t('notifications.unread' as TranslationKey)}: {unread}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              {t('notifications.empty' as TranslationKey)}
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    border: 'none',
                    borderBottom: '1px solid var(--border-color)',
                    background: item.isRead ? 'transparent' : 'var(--bg-hover)',
                    cursor: item.isRead ? 'default' : 'pointer',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div style={{ fontWeight: item.isRead ? 400 : 600 }}>{item.preview}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: 4 }}>
                    {new Date(Number(item.createdAt) * 1000).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

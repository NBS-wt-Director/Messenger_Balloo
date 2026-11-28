// ChatItem — один чат в списке (P34: редизайн по mockups/balloo-su/chats.html)
// Классы дизайн-системы: list__item, avatar--md октагон с двойной рамкой,
// badge (число / badge--dots / badge--square-dot / badge--square-filled),
// typing-индикатор в подзаголовке активного чата.
// Оптимизация: React.memo для предотвращения лишних ре-рендеров (тикет №64)

import React, { useMemo } from 'react';
import type { UserChat } from '@/store/chatStore';
import { usePresenceStore } from '@/store/presenceStore';
import { displayNameOf } from '@/utils/display';

interface ChatItemProps {
  chat: UserChat;
  active?: boolean;
  onClick: () => void;
}

// Utilities — вынесены перед компонентом для доступа из React.memo
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

// Инициалы (первые буквы двух слов, как в макете: «МА», «РД»)
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

// Контекст-рамка аватара по типу чата (common.css: avatar--ctx-*)
function getAvatarCtx(type: string): string {
  if (type === 'group') return 'avatar--ctx-new';
  if (type === 'channel') return 'avatar--ctx-new';
  if (type === 'family') return 'avatar--ctx-family';
  if (type === 'blocked') return 'avatar--ctx-blocked';
  return 'avatar--ctx-contact';
}

// Badge непрочитанных по макету: 1–9 число, >9 точки, >99 квадрат с точкой, >999 залитый квадрат
function UnreadBadge({ count }: { count: number }) {
  if (count >= 1000) return <span className="badge badge--square-filled" />;
  if (count > 99) return <span className="badge badge--square-dot" />;
  if (count > 9) return <span className="badge badge--dots">•••</span>;
  return <span className="badge">{count}</span>;
}

// Memoized — не перерисовывать при изменениях в других чатах
export const ChatItem = React.memo<ChatItemProps>(({ chat, active = false, onClick }) => {
  const lastMsg = chat.lastMessage;

  // Кэшируем вычисления
  const lastTime = useMemo(
    () => (lastMsg?.createdAt ? formatTime(lastMsg.createdAt) : ''),
    [lastMsg?.createdAt]
  );
  // Имя direct-чата = собеседник (тик. 1795369072): у direct-чата нет chat.name,
  // сервер отдаёт peer {username, displayName}.
  const displayName = useMemo(
    () => chat.name || (chat.peer ? displayNameOf(chat.peer) : '') || 'Чат',
    [chat.name, chat.peer]
  );
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const avatarCtx = useMemo(() => getAvatarCtx(chat.type), [chat.type]);

  // Тикет 1795560001: presence собеседника direct-чата.
  // Раньше класс avatar--status-online был захардкожен — все чаты выглядели
  // зелёными даже когда собеседник офлайн.
  const peerId = chat.type === 'direct' ? chat.peer?.id ?? null : null;
  const peerPresence = usePresenceStore((s) => (peerId ? s.byUser[peerId] : undefined));
  const peerOnline = peerPresence === 'online' || peerPresence === 'away';
  const statusClass = peerOnline ? 'avatar--status-online' : 'avatar--status-offline';

  // Подзаголовок: «Автор: текст» для групп, текст — для личных.
  // Тикет 1795560003: медиа-сообщения (без content) показывают тип вложения.
  const subtitle = useMemo(() => {
    const authorName = lastMsg?.sender?.displayName || lastMsg?.sender?.username;
    const text = (() => {
      if (!lastMsg) return 'Нет сообщений';
      if (lastMsg.content && lastMsg.content.trim()) return lastMsg.content;
      const att = (lastMsg as any).attachments?.[0];
      const t = lastMsg.type ?? att?.type;
      if (t === 'image') return '📷 Фото';
      if (t === 'video') return '🎥 Видео';
      if (t === 'voice') return '🎤 Голосовое';
      if (t === 'file') return `📄 ${att?.name || 'Файл'}`;
      if (t === 'poll') return '📊 Опрос';
      if (t === 'quiz') return '🎯 Квиз';
      if (t === 'list_active') return '☑️ Активный список';
      if (t === 'list_passive') return '📋 Пассивный список';
      if (t === 'personali') return '🙋 Персонали';
      if (t === 'text') return 'Текст';
      return 'Сообщение';
    })();
    if (chat.type === 'group' && authorName) {
      return `${authorName}: ${text}`;
    }
    return text;
  }, [chat.type, lastMsg]);

  // Тип чата: chip в заголовке (СМИ / КОРП / КАНАЛ) — как в макете
  const typeChip =
    chat.type === 'channel' ? (
      <span className="chip chip--info" style={{ fontSize: '9px', marginLeft: '4px' }}>СМИ</span>
    ) : chat.type === 'group' ? (
      <span className="chip chip--warning" style={{ fontSize: '9px', marginLeft: '4px' }}>КОРП</span>
    ) : null;

  return (
    <div
      className={`list__item${active ? ' list__item--active' : ''}`}
      onClick={onClick}
    >
      {/* Аватар-октагон с двойной рамкой (контекст + статус) */}
      <div className={`avatar avatar--md avatar--bordered ${statusClass} ${avatarCtx}`}>
        <div className="avatar__inner">
          {chat.avatarUrl ? <img src={chat.avatarUrl} alt={displayName} /> : <span>{initials}</span>}
        </div>
      </div>

      {/* Тело: имя + последнее сообщение */}
      <div className="list__item-body">
        <div className="list__item-title">
          {displayName}
          {typeChip}
        </div>
        <div className="list__item-subtitle">{subtitle}</div>
      </div>

      {/* Мета: время + badge непрочитанных */}
      <div className="list__item-meta">
        {lastTime && <span className="list__item-time">{lastTime}</span>}
        {chat.unreadCount > 0 && <UnreadBadge count={chat.unreadCount} />}
      </div>
    </div>
  );
}); // React.memo

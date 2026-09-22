// ChatHeader — шапка окна чата (P34: по макету chats.html)
// Аватар-октагон с двойной рамкой, имя + статус, кнопки 📎 📞 📹 ⋮,
// dropdown-меню чата: вложения, закрепить, заглушить, архив, экспорт PDF, блокировка.

import React, { useState, useRef, useEffect } from 'react';
import type { UserChat } from '@/store/chatStore';

interface ChatHeaderProps {
  chat: UserChat;
  onlineStatus?: string;
  onCall?: (type: 'audio' | 'video') => void;
  onAttachments?: () => void;
  onMenu?: () => void;
  onPin?: () => void;
  onMute?: () => void;
  onArchive?: () => void;
  onExport?: () => void;
  onBlock?: () => void;
}

function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );
}

function getAvatarCtx(type: string): string {
  if (type === 'group' || type === 'channel') return 'avatar--ctx-new';
  if (type === 'family') return 'avatar--ctx-family';
  return 'avatar--ctx-contact';
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  onlineStatus = 'в сети',
  onCall,
  onAttachments,
  onMenu,
  onPin,
  onMute,
  onArchive,
  onExport,
  onBlock,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрытие меню по клику вне
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const displayName = chat.name || 'Чат';
  const initials = getInitials(displayName);
  const avatarCtx = getAvatarCtx(chat.type);

  const menuItems: { label: string; action?: () => void; danger?: boolean }[] = [
    { label: '📎 Вложения чата', action: onAttachments },
    { label: chat.pinned ? '📌 Открепить чат' : '📌 Закрепить чат', action: onPin },
    { label: chat.muted ? '🔇 Включить уведомления' : '🔇 Заглушить', action: onMute },
    { label: '📦 В архив', action: onArchive },
    { label: '📤 Экспорт в PDF', action: onExport },
    { label: '🚫 Заблокировать', action: onBlock, danger: true },
  ];

  return (
    <div className="chat-header">
      {/* Аватар-октагон с двойной рамкой (контекст + статус) */}
      <div className={`avatar avatar--sm avatar--bordered avatar--status-online ${avatarCtx}`}>
        <div className="avatar__inner">
          {chat.avatarUrl ? <img src={chat.avatarUrl} alt={displayName} /> : <span>{initials}</span>}
        </div>
      </div>

      {/* Имя + статус */}
      <div className="flex-1" style={{ minWidth: 0 }}>
        <div className="chat-header__name">
          {displayName}
          {chat.type === 'channel' && (
            <span className="chip chip--info" style={{ fontSize: '9px', marginLeft: '6px' }}>КАНАЛ</span>
          )}
          {chat.type === 'group' && (
            <span className="chip chip--warning" style={{ fontSize: '9px', marginLeft: '6px' }}>ГРУППА</span>
          )}
        </div>
        <div className="chat-header__status">
          {onlineStatus}
          {chat.unreadCount > 0 && (
            <span style={{ marginLeft: '8px', color: 'var(--accent)' }}>
              {chat.unreadCount} новых
            </span>
          )}
        </div>
      </div>

      {/* Кнопки: вложения, звонки, меню */}
      <div ref={menuRef} style={{ position: 'relative', display: 'flex', gap: '4px' }}>
        <button className="topbar__actions-btn" title="Вложения чата" onClick={onAttachments}>
          📎
        </button>
        <button className="topbar__actions-btn" title="Аудиозвонок" onClick={() => onCall?.('audio')}>
          📞
        </button>
        <button className="topbar__actions-btn" title="Видеозвонок" onClick={() => onCall?.('video')}>
          📹
        </button>
        <button
          className="topbar__actions-btn"
          title="Меню чата"
          onClick={() => {
            setMenuOpen(!menuOpen);
            onMenu?.();
          }}
        >
          ⋮
        </button>

        {/* Dropdown-меню чата (как в макете: topbar__dropdown справа) */}
        <div
          className="topbar__dropdown"
          style={{
            display: menuOpen ? 'block' : 'none',
            top: '100%',
            right: 0,
            left: 'auto',
          }}
        >
          {menuItems.map((item, i) => (
            <React.Fragment key={i}>
              {item.danger && <div className="topbar__dropdown-divider" />}
              <div
                className={`topbar__dropdown-item${item.danger ? ' text-danger' : ''}`}
                onClick={() => {
                  item.action?.();
                  setMenuOpen(false);
                }}
              >
                {item.label}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

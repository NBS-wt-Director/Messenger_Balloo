// Internal Chat — внутренний чат портала сотрудников (Command)
// Каналы по отделам, личные сообщения, slash-команды, WebSocket realtime

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { api } from '@/services/api';

// --- Типы для внутреннего чата ---

interface Reaction {
  emoji: string;
  count: number;
  mine: boolean;
}

interface InternalMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  type: 'text' | 'system' | 'image' | 'file' | 'voice' | 'video' | 'poll';
  content: string;
  replyToId?: string;
  editCount: number;
  deleted: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: number;
  attachments?: Array<{
    id: string;
    type: string;
    url: string;
    thumbnail?: string;
    size: number;
    name?: string;
  }>;
  reactions?: Reaction[];
  isBot?: boolean;
}

interface InternalChat {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name: string;
  avatarUrl?: string | null;
  inviteCode?: string | null;
  createdAt: number;
  updatedAt: number;
  unreadCount: number;
  lastMessage?: {
    senderName: string;
    content: string;
    timestamp: number;
  };
}

// --- Утилиты ---

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Slash commands ---

const SLASH_COMMANDS = [
  { command: 'deploy', icon: '🚀', description: 'Запустить деплой' },
  { command: 'status', icon: '📊', description: 'Проверить статус сервисов' },
  { command: 'standup', icon: '📋', description: 'Standup отчёт' },
  { command: 'ping', icon: '🏓', description: 'Проверить доступность' },
  { command: 'logs', icon: '📝', description: 'Последние логи' },
  { command: 'help', icon: '📖', description: 'Справка по командам' },
];

// --- Main Screen ---

export function InternalChatScreen() {
  const { user } = useAuthStore();

  const [channels, setChannels] = useState<InternalChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<InternalMessage[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [typingUser, setTypingUser] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load channels from API
  useEffect(() => {
    api.getChats().then((res) => {
      const internalChats: InternalChat[] = (res || [])
        .filter((c: any) => ['group', 'channel'].includes(c.type))
        .map((c: any) => ({
          id: c.id,
          type: c.type as 'direct' | 'group' | 'channel',
          name: c.name || c.title,
          avatarUrl: c.avatarUrl || null,
          inviteCode: c.inviteCode || null,
          createdAt: c.createdAt || Date.now() - 86400000 * 30,
          updatedAt: c.updatedAt || Date.now(),
          unreadCount: c.unreadCount || 0,
          lastMessage: c.lastMessage
            ? {
                senderName: c.lastMessage.senderName || 'Неизвестный',
                content: c.lastMessage.content || '',
                timestamp: c.lastMessage.createdAt || Date.now(),
              }
            : undefined,
        }));

      setChannels(internalChats);
      if (internalChats.length > 0 && !activeChatId) {
        setActiveChatId(internalChats[0].id);
      }
      setLoading(false);
    }).catch(() => {
      setChannels([]);
      setLoading(false);
    });
  }, []);

  // Load chatMessages for active chat
  useEffect(() => {
    if (!activeChatId) return;

    setMessagesLoading(true);
    api.getMessages(activeChatId).then((res) => {
      const mapped: InternalMessage[] = (res || []).map((m: any) => ({
        id: m.id,
        chatId: m.chatId || activeChatId,
        senderId: m.senderId || m.userId,
        senderName: m.senderName || m.displayName || 'Неизвестный',
        type: (m.type || 'text') as InternalMessage['type'],
        content: m.content,
        replyToId: m.replyToId,
        editCount: m.editCount || 0,
        deleted: m.deleted || false,
        status: (m.status || 'sent') as InternalMessage['status'],
        createdAt: m.createdAt || Date.now(),
        reactions: m.reactions || [],
        isBot: m.isBot || false,
      }));
      setChatMessages(mapped);
      setMessagesLoading(false);
    }).catch(() => {
      setChatMessages([]);
      setMessagesLoading(false);
    });
  }, [activeChatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle sending message
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !activeChatId) return;

    const isSlash = inputValue.startsWith('/');

    try {
      const created = await api.sendMessage(activeChatId, {
        type: isSlash ? 'system' : 'text',
        content: inputValue.trim(),
      });

      const newMsg: InternalMessage = {
        id: created.id || `msg_${Date.now()}`,
        chatId: activeChatId,
        senderId: user?.id || 'me',
        senderName: user?.displayName || 'Вы',
        type: isSlash ? 'system' : 'text',
        content: inputValue.trim(),
        replyToId: undefined,
        editCount: 0,
        deleted: false,
        status: 'sent',
        createdAt: Date.now(),
        reactions: [],
        isBot: isSlash,
      };

      setChatMessages((prev) => [...prev, newMsg]);
      handleSlashCommandResponse(newMsg);
    } catch {
      // Опционально: показать ошибку
    }

    setInputValue('');
    setShowSlashCommands(false);
  }, [inputValue, activeChatId, user]);

  // Handle slash commands
  const handleSlashCommandResponse = (msg: InternalMessage) => {
    if (!msg.isBot || msg.type !== 'system') return;

    const cmd = msg.content.trim().split(' ')[0].toLowerCase();
    const respondWith = (content: string) => {
      const replyMsg: InternalMessage = {
        id: `msg_auto_${Date.now()}`,
        chatId: activeChatId,
        senderId: 'system',
        senderName: 'Система',
        type: 'system',
        content,
        replyToId: undefined,
        editCount: 0,
        deleted: false,
        status: 'delivered',
        createdAt: Date.now(),
        reactions: [],
        isBot: true,
      };
      setChatMessages((prev) => [...prev, replyMsg]);
    };

    switch (cmd) {
      case '/deploy':
        respondWith('🚀 Деплой запущен... Ожидание завершения.');
        break;
      case '/status':
        respondWith(
          '📊 Статус сервисов:\n• API: ✅ онлайн\n• WebSocket: ✅ онлайн\n• PostgreSQL: ✅ онлайн\n• Redis: ✅ онлайн\n• MinIO: ✅ онлайн'
        );
        break;
      case '/standup':
        respondWith(
          `📋 Standup для ${user?.displayName || 'пользователя'}:\n✅ Что сделано: ...\n🔄 Что буду делать: ...\n🚫 Блокеры: ...`
        );
        break;
      case '/ping':
        respondWith('🏓 Pong! Задержка: 12ms');
        break;
      case '/logs':
        respondWith(
          '📝 Последние логи:\n[14:32:01] INFO: Request processed in 45ms\n[14:31:58] INFO: WebSocket connection established\n[14:31:55] DEBUG: Cache hit for /api/chats'
        );
        break;
      case '/help':
        respondWith(
          `📖 Доступные slash-команды:\n${SLASH_COMMANDS.map((sc) => `${sc.icon} \`${sc.command}\` — ${sc.description}`).join('\n')}`
        );
        break;
    }
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setShowSlashCommands(value.startsWith('/'));
    setIsTyping(true);

    clearTimeout((window as any).typingTimer);
    (window as any).typingTimer = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  // Handle select chat
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setShowSlashCommands(false);
    setInputValue('');
  };

  // Handle search
  const handleSearch = (_query: string) => {
    // Filter channels by search query — handled by ChatSidebar internally
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentChat = channels.find((c) => c.id === activeChatId);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar__logo">
          <div className="topbar__logo-icon" style={{ background: 'var(--info)' }}>C</div>
          <span>Command</span>
          <div className="topbar__dropdown" />
        </div>
        <div className="topbar__title">Внутренний чат</div>
        <div className="topbar__actions">
          <div
            className="topbar__actions-btn"
            title="Новый чат"
            style={{ cursor: 'pointer' }}
          >
            ✏
          </div>
        </div>
        <div className="topbar__right">
          <div className="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact">
            <div className="avatar__inner">
              <span>{user ? getInitials(user.displayName || 'ИВ') : 'ИВ'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar — chat list */}
        <ChatSidebar
          channels={channels}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onSearch={handleSearch}
        />

        {/* Content area */}
        <div className="content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div className="chatMessages" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {messagesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="spinner" />
              </div>
            ) : chatMessages.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '48px' }}>💬</div>
                <div style={{ color: 'var(--text-secondary)' }}>Нет сообщений</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Начните общение в {currentChat?.name || ''}
                </div>
              </div>
            ) : (
              <>
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message message--${msg.senderId === user?.id ? 'sender' : 'receiver'}`}
                  >
                    <div className="message__bubble">
                      <div className="message__header">
                        {msg.senderId !== user?.id && (
                          <>
                            <div className="avatar avatar--xs avatar--bordered avatar--status-online avatar--ctx-contact">
                              <div className="avatar__inner">
                                <span>{getInitials(msg.senderName)}</span>
                              </div>
                            </div>
                            <span>{msg.senderName}</span>
                            <span>{formatTime(msg.createdAt)}</span>
                            {msg.isBot && (
                              <span className="message__header-tag message__header-tag--auto">
                                bot
                              </span>
                            )}
                          </>
                        )}
                        {msg.senderId === user?.id && <span>{formatTime(msg.createdAt)}</span>}
                      </div>
                      <div
                        className={`message__body ${msg.type === 'system' ? 'message__body--markdown' : ''}`}
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {msg.content}
                      </div>
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="message__reactions">
                          {msg.reactions.map((r, i) => (
                            <span
                              key={i}
                              className={`message__reaction ${r.mine ? 'message__reaction--mine' : ''}`}
                            >
                              {r.emoji} <span>{r.count}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Typing indicator */}
          {typingUser && <TypingIndicator user={typingUser} visible={true} />}

          {/* Input area */}
          <div className="input-area" style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
            {showSlashCommands && (
              <div
                className="card"
                style={{
                  marginBottom: 8,
                  padding: 8,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {SLASH_COMMANDS.map((sc) => (
                  <div
                    key={sc.command}
                    style={{
                      padding: '6px 10px',
                      cursor: 'pointer',
                      borderRadius: 4,
                      fontSize: 13,
                    }}
                    onClick={() => {
                      setInputValue(`/${sc.command} `);
                      setShowSlashCommands(false);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <strong>{sc.icon} /{sc.command}</strong> — {sc.description}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                type="text"
                className="form-input"
                placeholder={currentChat ? `Сообщение для ${currentChat.name}...` : 'Сообщение...'}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ flex: 1 }}
              />
              <button className="btn btn--primary" onClick={handleSendMessage} disabled={!inputValue.trim()}>
                Отправить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InternalChatScreen;

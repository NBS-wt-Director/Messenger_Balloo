// Internal Chat — внутренний чат портала сотрудников (Command)
// Каналы по отделам, личные сообщения, slash-команды, WebSocket realtime

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

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
  members?: Array<{
    user: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      status: string;
    };
    role: string;
  }>;
}

// --- Utility functions ---

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// --- Slash commands ---

const SLASH_COMMANDS = [
  { command: '/deploy', description: 'Запустить деплой на staging/production', icon: '🚀' },
  { command: '/status', description: 'Статус сервисов (API, WS, БД, Redis)', icon: '📊' },
  { command: '/standup', description: 'Ежедневный статус (что сделал, что буду делать, блокеры)', icon: '📋' },
  { command: '/ping', description: 'Проверить доступность сервиса', icon: '🏓' },
  { command: '/logs', description: 'Последние логи сервиса', icon: '📝' },
  { command: '/help', description: 'Список доступных команд', icon: '❓' },
];

// --- Mock data ---

const MOCK_CHANNELS: InternalChat[] = [
  {
    id: 'ch_dev',
    type: 'group',
    name: '#разработка',
    avatarUrl: null,
    inviteCode: null,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now(),
    unreadCount: 3,
    lastMessage: { senderName: 'Елена', content: 'PR #234 смержен ✅', timestamp: Date.now() - 3600000 * 2 },
  },
  {
    id: 'ch_general',
    type: 'group',
    name: '#общий',
    avatarUrl: null,
    inviteCode: null,
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now(),
    unreadCount: 0,
    lastMessage: { senderName: 'Дмитрий', content: 'K8s деплой готов', timestamp: Date.now() - 3600000 * 3 },
  },
  {
    id: 'ch_dm_ivan_maria',
    type: 'direct',
    name: 'Иван → Мария',
    avatarUrl: null,
    inviteCode: null,
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now(),
    unreadCount: 0,
    lastMessage: { senderName: 'Мария', content: 'Макеты готовы, посмотри', timestamp: Date.now() - 3600000 * 4 },
  },
  {
    id: 'ch_design',
    type: 'group',
    name: '#дизайн',
    avatarUrl: null,
    inviteCode: null,
    createdAt: Date.now() - 86400000 * 45,
    updatedAt: Date.now(),
    unreadCount: 1,
    lastMessage: { senderName: 'Мария', content: 'Новые иконки готовы', timestamp: Date.now() - 3600000 * 5 },
  },
  {
    id: 'ch_infra',
    type: 'group',
    name: '#инфраструктура',
    avatarUrl: null,
    inviteCode: null,
    createdAt: Date.now() - 86400000 * 90,
    updatedAt: Date.now(),
    unreadCount: 0,
    lastMessage: { senderName: 'Дмитрий', content: 'Мониторинг обновлён', timestamp: Date.now() - 3600000 * 6 },
  },
];

const MOCK_MESSAGES: Record<string, InternalMessage[]> = {
  ch_dev: [
    {
      id: 'msg1',
      chatId: 'ch_dev',
      senderId: 'u1',
      senderName: 'Елена К.',
      type: 'text',
      content: 'PR #234 (WebSocket重构) смержен в main ✅ CI запущен',
      replyToId: undefined,
      editCount: 0,
      deleted: false,
      status: 'read',
      createdAt: Date.now() - 3600000 * 2,
      reactions: [
        { emoji: '👍', count: 4, mine: true },
        { emoji: '🎉', count: 2, mine: false },
      ],
      isBot: true,
    },
    {
      id: 'msg2',
      chatId: 'ch_dev',
      senderId: 'me',
      senderName: 'Вы',
      type: 'text',
      content: 'Отлично! Деплой на staging?',
      replyToId: 'msg1',
      editCount: 0,
      deleted: false,
      status: 'read',
      createdAt: Date.now() - 3600000 * 1.95,
      reactions: [],
      isBot: false,
    },
    {
      id: 'msg3',
      chatId: 'ch_dev',
      senderId: 'u1',
      senderName: 'Елена К.',
      type: 'text',
      content: 'Да, уже деплоится. Дмитрий настраивает pipeline',
      replyToId: undefined,
      editCount: 0,
      deleted: false,
      status: 'delivered',
      createdAt: Date.now() - 3600000 * 1.9,
      reactions: [],
      isBot: true,
    },
    {
      id: 'msg4',
      chatId: 'ch_dev',
      senderId: 'u2',
      senderName: 'Дмитрий С.',
      type: 'text',
      content: 'Pipeline готов, деплой через 5 минут',
      replyToId: undefined,
      editCount: 0,
      deleted: false,
      status: 'delivered',
      createdAt: Date.now() - 3600000 * 1.85,
      reactions: [
        { emoji: '🚀', count: 3, mine: false },
      ],
      isBot: false,
    },
  ],
  ch_general: [
    {
      id: 'msg5',
      chatId: 'ch_general',
      senderId: 'u2',
      senderName: 'Дмитрий С.',
      type: 'text',
      content: 'K8s деплой готов, все поды на месте',
      replyToId: undefined,
      editCount: 0,
      deleted: false,
      status: 'read',
      createdAt: Date.now() - 3600000 * 3,
      reactions: [],
      isBot: false,
    },
  ],
  ch_dm_ivan_maria: [
    {
      id: 'msg6',
      chatId: 'ch_dm_ivan_maria',
      senderId: 'u3',
      senderName: 'Мария',
      type: 'text',
      content: 'Макеты готовы, посмотри',
      replyToId: undefined,
      editCount: 0,
      deleted: false,
      status: 'read',
      createdAt: Date.now() - 3600000 * 4,
      reactions: [],
      isBot: false,
    },
  ],
  ch_design: [
    {
      id: 'msg7',
      chatId: 'ch_design',
      senderId: 'u3',
      senderName: 'Мария',
      type: 'text',
      content: 'Новые иконки готовы в Figma',
      replyToId: undefined,
      editCount: 0,
      deleted: false,
      status: 'delivered',
      createdAt: Date.now() - 3600000 * 5,
      reactions: [],
      isBot: false,
    },
  ],
  ch_infra: [
    {
      id: 'msg8',
      chatId: 'ch_infra',
      senderId: 'u2',
      senderName: 'Дмитрий С.',
      type: 'text',
      content: 'Мониторинг обновлён, Grafana dashboard доступен',
      replyToId: undefined,
      editCount: 0,
      deleted: false,
      status: 'read',
      createdAt: Date.now() - 3600000 * 6,
      reactions: [],
      isBot: false,
    },
  ],
};

// --- SlashCommandsPanel component ---

function SlashCommandsPanel({ visible, onSelect }: { visible: boolean; onSelect: (cmd: string) => void }) {
  if (!visible) return null;

  return (
    <div className="input-hint" id="input-hint">
      {SLASH_COMMANDS.map((sc) => (
        <div
          key={sc.command}
          className="input-hint__item"
          data-cmd={sc.command}
          onClick={() => onSelect(sc.command)}
          style={{ cursor: 'pointer' }}
        >
          <code>{sc.command}</code> — {sc.description}
        </div>
      ))}
    </div>
  );
}

// --- Main Screen ---

export function InternalChatScreen() {
  const { user } = useAuthStore();
  const { setMessages } = useChatStore();

  const [channels] = useState<InternalChat[]>(MOCK_CHANNELS);
  const [activeChatId, setActiveChatId] = useState<string>(channels[0]?.id || '');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [typingUser, setTypingUser] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get current chat messages
  const chatMessages = MOCK_MESSAGES[activeChatId] || [];

  // Find current chat
  const currentChat = channels.find((c) => c.id === activeChatId);

  // Connect WebSocket
  useEffect(() => {
    setIsConnecting(true);

    // In production, connect to real WebSocket:
    // const ws = new WebSocket(`ws://${window.location.host}/ws/?token=${authStore.token}`);
    // ws.onmessage = (event) => { ... };

    // Simulate connection
    const timer = setTimeout(() => {
      setIsConnecting(false);
    }, 500);

    return () => {
      clearTimeout(timer);
      if (ws) ws.close();
    };
  }, [activeChatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle slash commands
  const handleSlashCommand = useCallback((cmd: string) => {
    setInputValue(cmd + ' ');
    setShowSlashCommands(false);
    inputRef.current?.focus();
  }, []);

  // Handle sending message
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;

    const isSlash = inputValue.startsWith('/');
    const currentMsgs = MOCK_MESSAGES[activeChatId] || [];

    const newMsg: InternalMessage = {
      id: `msg_${Date.now()}`,
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

    // Update local mock data
    MOCK_MESSAGES[activeChatId] = [...currentMsgs, newMsg];

    // Send via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'message.send',
          chatId: activeChatId,
          content: inputValue.trim(),
          messageType: isSlash ? 'system' : 'text',
        })
      );
    }

    // Handle slash commands locally
    if (isSlash) {
      const cmd = inputValue.trim().split(' ')[0].toLowerCase();
      const respondWith = (content: string) => {
        setTimeout(() => {
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
          MOCK_MESSAGES[activeChatId] = [...(MOCK_MESSAGES[activeChatId] || []), replyMsg];
        }, 500);
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
    }

    setInputValue('');
    setShowSlashCommands(false);
  }, [inputValue, activeChatId, ws, user]);

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setShowSlashCommands(value.startsWith('/'));
    setIsTyping(true);

    if (ws && ws.readyState === WebSocket.OPEN && value.length > 0) {
      ws.send(JSON.stringify({ type: 'typing.start', chatId: activeChatId }));
    }

    clearTimeout((window as any).typingTimer);
    (window as any).typingTimer = setTimeout(() => {
      setIsTyping(false);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'typing.stop', chatId: activeChatId }));
      }
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
          <div className="messages" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {isConnecting ? (
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
                    {msg.senderId === user?.id && (
                      <div
                        className={`msg-ticks ${
                          msg.status === 'read'
                            ? 'msg-ticks--read'
                            : msg.status === 'delivered'
                            ? 'msg-ticks--delivered'
                            : 'msg-ticks--sent'
                        }`}
                      >
                        {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                      </div>
                    )}
                  </div>
                ))}
                <TypingIndicator user={typingUser} visible={isTyping} />
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="input-area" style={{ position: 'relative' }}>
            <SlashCommandsPanel visible={showSlashCommands} onSelect={handleSlashCommand} />
            <button
              className="input-area__btn"
              title="Вложить файл"
              style={{ cursor: 'pointer' }}
            >
              📎
            </button>
            <textarea
              ref={inputRef}
              className="input-area__field"
              placeholder={currentChat ? `Сообщение для ${currentChat.name}...` : 'Сообщение...'}
              rows={1}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ resize: 'none', minHeight: '40px', maxHeight: '150px' }}
            />
            <button
              className="input-area__btn input-area__btn--send"
              onClick={handleSendMessage}
              title="Отправить"
              style={{
                cursor: inputValue.trim() ? 'pointer' : 'default',
                opacity: inputValue.trim() ? 1 : 0.5,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

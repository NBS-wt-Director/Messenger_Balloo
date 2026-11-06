// ChatViewScreen — окно активного чата (P34: редизайн по mockups/balloo-su/chats.html)
// Структура макета: .content → chat-header → messages → reply-panel → input-area.
// Интеграция с WebSocket для realtime.

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore, type MessageWithSender } from '@/store/chatStore';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { AttachmentPanel } from '@/components/chat/AttachmentPanel';
import { VoiceMessageModal } from '@/components/chat/VoiceMessageModal';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInfoPanel } from '@/components/chat/ChatInfoPanel';
import { ReplyPreview } from '@/components/chat/ReplyPreview';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import { EmptyChatState } from '@/components/chat/EmptyChatState';
import { api } from '@/services/api';

export const ChatViewScreen: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const {
    chats,
    activeChat,
    setActiveChat,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    setTypingUsers,
  } = useChatStore();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; author: string; content: string; avatarUrl?: string } | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionAnchor, setReactionAnchor] = useState<HTMLElement | null>(null);
  // Тик. 1793873744: прежде здесь был useState typingTimeout, который больше
  // нигде не использовался — набор текста наружу не сообщался. Теперь refs:
  // таймер стопа и флаг «typing.start уже отправлен в этой сессии набора».
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStartSent = useRef(false);
  // Сокет нужен не только внутри эффекта подключения: typing.* шлётся из
  // обработчика ввода, который живёт вне замыкания useEffect.
  const wsRef = useRef<WebSocket | null>(null);
  // Панель вложений (тик. 1792124253, макет attachment-panel.html)
  const [attachmentPanelOpen, setAttachmentPanelOpen] = useState(false);
  // Модалка записи голосового (тик. 1792160023, макет voice-message.html)
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Load chat and messages
  useEffect(() => {
    if (!chatId) {
      setIsLoading(false);
      return;
    }

    const loadChat = async () => {
      setIsLoading(true);
      try {
        const chatData = await api.getChatInfo(chatId);

        // P34: чата может не быть в store (список ещё не загружен) —
        // добавляем, иначе activeChat = null и шапка чата не отрисуется
        const state = useChatStore.getState();
        if (chatData && !state.chats.find((c) => c.id === chatId)) {
          state.addChat({
            ...chatData,
            joinedAt: chatData.joinedAt ?? chatData.createdAt ?? 0,
            pinned: !!chatData.pinned,
            muted: !!chatData.muted,
            unreadCount: chatData.unreadCount ?? 0,
          });
        }
        setActiveChat(chatId);

        const messagesData = await api.getMessages(chatId);
        const messagesWithSender: MessageWithSender[] = messagesData.map((m: any) => ({
          ...m,
          sender: {
            id: m.senderId,
            username: m.sender?.username || '',
            displayName: m.sender?.displayName,
            avatarUrl: m.sender?.avatarUrl,
          },
        }));
        setMessages(chatId, messagesWithSender);
      } catch {
        const localChat = chats.find((c) => c.id === chatId);
        if (localChat) {
          setActiveChat(chatId);
        } else {
          navigate('/chat');
        }
      }
      setIsLoading(false);
    };

    loadChat();
  }, [chatId]);

  // WebSocket connection for real-time
  useEffect(() => {
    if (!chatId) return;

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3100';
    let ws: WebSocket | null = null;
    let cancelled = false;

    const connect = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/ws-token`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok || cancelled) {
          console.log('[WS] No auth for WebSocket');
          return;
        }

        const { token } = await response.json();
        const wsUrl = `${API_BASE.replace('http', 'ws')}/ws/?token=${token}`;
        ws = new WebSocket(wsUrl);
      } catch {
        console.log('[WS] Connection failed');
        return;
      }

      if (!ws || cancelled) return;

      if (ws) {
        wsRef.current = ws;
        ws.onopen = () => {
          console.log('WS connected');
          ws!.send(JSON.stringify({ type: 'chat.join', chatId }));
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          switch (data.type) {
            // Сервер доставляет новое сообщение событием message.received
            // (см. packages/server/src/ws/types.ts). Прежний case 'message.send'
            // слушал имя, которого сервер не отправляет никогда, поэтому
            // входящие сообщения появлялись только после перезагрузки.
            case 'message.received':
              if (data.chatId === chatId && data.message) {
                addMessage(chatId, {
                  ...data.message,
                  sender: data.message.sender
                    ? {
                        id: data.message.sender.id,
                        username: data.message.sender.username,
                        displayName: data.message.sender.displayName,
                        avatarUrl: data.message.sender.avatarUrl,
                      }
                    : { id: '', username: '' },
                });
              }
              break;
            case 'message.read':
              if (data.chatId === chatId) {
                updateMessage(chatId, data.messageId, { status: 'read' });
              }
              break;
            // Тик. 1793873744: сервер рассылает индикатор набор
            // событием typing.indicator ({chatId,userId,userName,isTyping}).
            // Прежние case 'typing.start'/'typing.stop' слушали имена ВХОДЯЩИХ
            // событий клиента, которых сервер не отправляет, — индикатор не
            // появлялся.
            case 'typing.indicator':
              if (data.chatId === chatId) {
                const current = useChatStore.getState().typingUsers[chatId] || [];
                if (data.isTyping) {
                  if (!current.some((u) => u.userId === data.userId)) {
                    setTypingUsers(chatId, [
                      ...current,
                      { userId: data.userId, username: data.userName },
                    ]);
                  }
                } else {
                  setTypingUsers(
                    chatId,
                    current.filter((u) => u.userId !== data.userId)
                  );
                }
              }
              break;
          }
        };

        ws.onclose = () => {
          console.log('WS disconnected');
        };
      }
    };

    connect();

    return () => {
      cancelled = true;
      // Тик. 1793873744: сокет и таймер набора принадлежат этому chatId —
      // при смене чата иначе остался бы висеть typing.stop от старого сокета.
      if (typingStopTimer.current) {
        clearTimeout(typingStopTimer.current);
        typingStopTimer.current = null;
      }
      typingStartSent.current = false;
      if (wsRef.current === ws) wsRef.current = null;
      if (ws) ws.close();
    };
  }, [chatId]);

  // Тик. 1793873744 — набор текста.
  // typing.start отправляется один раз на сессию набора (не на каждый символ),
  // typing.stop — по таймауту простоя и сразу после отправки. Без стопа
  // собеседник видел бы «печатает» до автостопа сервера (5 с).
  const TYPING_STOP_MS = 3000;

  const stopTyping = useCallback(() => {
    if (typingStopTimer.current) {
      clearTimeout(typingStopTimer.current);
      typingStopTimer.current = null;
    }
    if (!typingStartSent.current) return;
    typingStartSent.current = false;
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN && chatId) {
      socket.send(JSON.stringify({ type: 'typing.stop', chatId }));
    }
  }, [chatId]);

  const handleTyping = useCallback(() => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !chatId) return;

    if (!typingStartSent.current) {
      typingStartSent.current = true;
      socket.send(JSON.stringify({ type: 'typing.start', chatId }));
    }

    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(stopTyping, TYPING_STOP_MS);
  }, [chatId, stopTyping]);

  // Отправка снимает индикатор немедленно, не дожидаясь таймаута.
  useEffect(() => () => stopTyping(), [stopTyping]);

  // Send message
  const handleSend = useCallback(
    async (content: string, type: string) => {
      if (!chatId || !content.trim()) return;

      stopTyping();
      try {
        const payload: any = { type, content };
        if (replyTo) {
          payload.replyToId = replyTo.id;
        }

        const result = await api.sendMessage(chatId, payload);

        const newMessage: MessageWithSender = {
          ...result,
          sender: {
            id: result.senderId || '',
            username: result.sender?.username || 'Вы',
            displayName: result.sender?.displayName,
            avatarUrl: result.sender?.avatarUrl,
          },
        };

        addMessage(chatId, newMessage);
        setReplyTo(null);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [chatId, replyTo, addMessage, stopTyping]
  );

  // Перезагрузка сообщений чата — после отправки вложений из панели
  // (тик. 1792124253): сервер нормализует attachments, берём канонический список.
  const refreshMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const messagesData = await api.getMessages(chatId);
      const messagesWithSender: MessageWithSender[] = messagesData.map((m: any) => ({
        ...m,
        sender: {
          id: m.senderId,
          username: m.sender?.username || '',
          displayName: m.sender?.displayName,
          avatarUrl: m.sender?.avatarUrl,
        },
      }));
      setMessages(chatId, messagesWithSender);
    } catch {
      // сообщения останутся в store до следующей успешной загрузки
    }
  }, [chatId, setMessages]);

  // React to message
  const handleReact = useCallback(async (messageId: string, emoji: string) => {
    try {
      await api.reactToMessage(messageId, emoji);
    } catch (error) {
      console.error('Failed to react:', error);
    }
  }, []);

  // Reply to message
  const handleReply = useCallback((message: MessageWithSender) => {
    setReplyTo({
      id: message.id,
      author: message.sender?.displayName || message.sender?.username || 'Пользователь',
      content: message.content || '',
      avatarUrl: message.sender?.avatarUrl,
    });
  }, []);

  // Edit message
  const handleEdit = useCallback(
    async (messageId: string, content: string) => {
      try {
        await api.updateMessage(messageId, content);
        updateMessage(chatId!, messageId, { content, editCount: 1 });
      } catch (error) {
        console.error('Failed to edit:', error);
      }
    },
    [chatId, updateMessage]
  );

  // Delete message
  const handleDelete = useCallback(
    async (messageId: string) => {
      try {
        await api.deleteMessage(messageId);
        deleteMessage(chatId!, messageId);
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    },
    [chatId, deleteMessage]
  );

  // Forward message
  const handleForward = useCallback((message: MessageWithSender) => {
    console.log('Forward message:', message.id);
  }, []);

  // Handle call
  const handleCall = useCallback((type: 'audio' | 'video') => {
    console.log(`${type} call`);
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: 'var(--bg-primary)',
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div
      className="content"
      style={{ overflow: 'hidden', height: '100%' }} /* скролл внутри .messages */
    >
      {chatId ? (
        <>
          {/* Chat Header */}
          {activeChat && (
            <ChatHeader
              chat={activeChat}
              onlineStatus="в сети"
              onCall={handleCall}
              onAttachments={() => setAttachmentPanelOpen((v) => !v)}
              onMenu={() => setShowInfo(!showInfo)}
              onPin={() => useChatStore.getState().pinChat(activeChat.id)}
              onMute={() => useChatStore.getState().muteChat(activeChat.id)}
              onArchive={() => api.archiveChat(activeChat.id).catch(() => {})}
              onExport={() => console.log('Export PDF:', activeChat.id)}
              onBlock={() => console.log('Block chat:', activeChat.id)}
            />
          )}

          {/* Main area: messages + info panel */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
            {/* Messages column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              {/* Reply preview (панель ответа — inline над полем ввода) */}
              {replyTo && (
                <ReplyPreview
                  message={replyTo}
                  onCancel={() => setReplyTo(null)}
                />
              )}

              {/* Message list */}
              <MessageList
                chatId={chatId}
                onReact={handleReact}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onForward={handleForward}
              />

              {/* Message input */}
              <MessageInput onSend={handleSend} onTyping={handleTyping} onAttachClick={() => setAttachmentPanelOpen(true)} onVoiceClick={() => setVoiceModalOpen(true)} />
            </div>

            {/* Панель вложений (тик. 1792124253) */}
            {chatId && (
              <AttachmentPanel
                open={attachmentPanelOpen}
                chatId={chatId}
                onClose={() => setAttachmentPanelOpen(false)}
                onSent={refreshMessages}
              />
            )}

            {/* Модалка записи голосового (тик. 1792160023) */}
            {chatId && (
              <VoiceMessageModal
                open={voiceModalOpen}
                chatId={chatId}
                onClose={() => setVoiceModalOpen(false)}
                onSent={refreshMessages}
              />
            )}

            {/* Chat info panel (right sidebar) */}
            <ChatInfoPanel
              chat={activeChat || { id: '', type: 'direct', name: '', joinedAt: 0, pinned: false, muted: false, unreadCount: 0, createdAt: 0, updatedAt: 0 }}
              isOpen={showInfo}
              onClose={() => setShowInfo(false)}
            />
          </div>

          {/* Reaction picker */}
          {showReactionPicker && (
            <ReactionPicker
              messageId={chatId}
              onSelect={handleReact}
              anchorElement={reactionAnchor}
              onClose={() => setShowReactionPicker(false)}
            />
          )}
        </>
      ) : (
        /* Empty state when no chat is selected */
        <EmptyChatState
          onNewChat={() => navigate('/chat')}
        />
      )}
    </div>
  );
};

export default ChatViewScreen;
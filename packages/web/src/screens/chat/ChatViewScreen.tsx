// ChatViewScreen — экран чата: сообщения, пузырьри, ввод, вложения
// Интеграция с WebSocket для realtime

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore, type MessageWithSender } from '@/store/chatStore';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInfoPanel } from '@/components/chat/ChatInfoPanel';
import { ReplyPreview } from '@/components/chat/ReplyPreview';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
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
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

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

    const token = localStorage.getItem('balloo-accessToken');
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:3100/ws/?token=${token}`);

    ws.onopen = () => {
      console.log('WS connected');
      ws.send(JSON.stringify({ type: 'chat.join', chatId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'message.send':
          if (data.chatId === chatId) {
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
        case 'typing.start':
          if (data.chatId === chatId) {
            setTypingUsers(chatId, [
              ...(useChatStore.getState().typingUsers[chatId] || []),
              { userId: data.userId, username: data.username },
            ]);
          }
          break;
        case 'typing.stop':
          if (data.chatId === chatId) {
            setTypingUsers(
              chatId,
              (useChatStore.getState().typingUsers[chatId] || []).filter(
                (u) => u.userId !== data.userId
              )
            );
          }
          break;
      }
    };

    ws.onclose = () => {
      console.log('WS disconnected');
    };

    return () => {
      ws.close();
    };
  }, [chatId]);

  // Send message
  const handleSend = useCallback(
    async (content: string, type: string) => {
      if (!chatId || !content.trim()) return;

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
    [chatId, replyTo, addMessage]
  );

  // React to message
  const handleReact = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await api.reactToMessage(messageId, emoji);
      } catch (error) {
        console.error('Failed to react:', error);
      }
    },
    []
  );

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
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Chat Header */}
      {activeChat && (
        <ChatHeader
          chat={activeChat}
          onlineStatus="в сети"
          onCall={handleCall}
          onAttachments={() => {}}
          onMenu={() => setShowInfo(!showInfo)}
        />
      )}

      {/* Main content: messages + info panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Messages area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Reply preview */}
          {replyTo && (
            <ReplyPreview
              message={replyTo}
              onCancel={() => setReplyTo(null)}
            />
          )}

          {/* Message list */}
          <MessageList
            chatId={chatId || ''}
            onReact={handleReact}
            onReply={handleReply}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onForward={handleForward}
          />

          {/* Message input */}
          <MessageInput
            onSend={handleSend}
            onReply={handleReply}
            onCancelReply={() => setReplyTo(null)}
            replyTo={replyTo}
          />
        </div>

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
          messageId={chatId || ''}
          onSelect={handleReact}
          anchorElement={reactionAnchor}
          onClose={() => setShowReactionPicker(false)}
        />
      )}
    </div>
  );
};

export default ChatViewScreen;

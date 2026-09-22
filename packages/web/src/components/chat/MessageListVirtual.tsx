// MessageList — виртуальный скроллинг с react-virtuoso (тикет №64)
// P34: редизайн по mockups/balloo-su/chats.html —
// date-separator (chip с датой), typing-пузырь (message--receiver + typing dots).
// Оптимизация: рендерит только видимые сообщения, поддержка 10000+ без лагов

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useChatStore, type MessageWithSender } from '@/store/chatStore';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  chatId: string;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (message: MessageWithSender) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onForward?: (message: MessageWithSender) => void;
  onScrollToBottom?: () => void;
}

// Row height estimation for virtualization
const ROW_HEIGHT = 80;
const HEADER_HEIGHT = 36; // date separator

export const MessageList = React.memo<MessageListProps>(({
  chatId,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onForward,
}) => {
  const messages = useChatStore((s) => s.messages[chatId] || []);
  const typingUsers = useChatStore((s) => s.typingUsers[chatId] || []);
  const listRef = useRef<any>(null);

  // Кэшируем groupByDate — не пересчитывать при ре-рендере
  const groupedMessages = useMemo(() => groupByDate(messages), [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: groupedMessages.length - 1,
          align: 'end',
        });
      }, 50);
    }
  }, [messages.length, groupedMessages.length]);

  // Render each row (either date separator + messages)
  const renderItem = useCallback(
    (index: number) => {
      const group = groupedMessages[index];
      if (!group) return null;

      return (
        <div key={index}>
          {/* Date separator — chip с датой (как в макете) */}
          <div style={{ textAlign: 'center', padding: '8px' }}>
            <span className="chip">{group.date}</span>
          </div>

          {/* Messages */}
          {group.messages.map((msg) => {
            const currentUserId = useChatStore.getState().currentUserId;
            const isOwn = msg.sender?.id === currentUserId;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                onReact={onReact}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onForward={onForward}
              />
            );
          })}
        </div>
      );
    },
    [groupedMessages, onReact, onReply, onEdit, onDelete, onForward]
  );

  // Count total items (groups)
  const itemCount = groupedMessages.length;

  return (
    <div style={{ flex: 1, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      {/* Virtual scroll list — viewport = контейнер (P34: useWindowScroll не работал
          во вложенном flex-контейнере — окно приложения не скроллится) */}
      <Virtuoso
        ref={listRef}
        style={{ height: '100%', flex: 1 }}
        totalCount={itemCount}
        itemContent={renderItem}
        defaultItemHeight={ROW_HEIGHT + HEADER_HEIGHT}
        customScrollParent={undefined}
      />

      {/* Typing indicator — пузырь с точками, как в макете (последнее сообщение) */}
      {typingUsers.length > 0 && (
        <div style={{ padding: '0 16px 8px' }}>
          <div className="message message--receiver" style={{ maxWidth: '80px' }}>
            <div className="message__bubble" style={{ padding: '10px 14px' }}>
              <span className="typing">
                <span className="typing__dots">
                  <span className="typing__dot" />
                  <span className="typing__dot" />
                  <span className="typing__dot" />
                </span>
                <span style={{ marginLeft: '4px' }}>
                  {typingUsers.length === 1 ? 'печатает...' : 'печатают...'}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}); // React.memo

// Group messages by date — кэшируется через useMemo
function groupByDate(messages: MessageWithSender[]) {
  const groups: { date: string; messages: MessageWithSender[] }[] = [];
  let currentDate = '';

  messages.forEach((msg) => {
    if (!msg.createdAt) return;
    const date = new Date(msg.createdAt);
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    if (dateStr !== currentDate) {
      currentDate = dateStr;
      groups.push({ date: dateStr, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  });

  return groups;
}

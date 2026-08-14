// MessageBubble — пузыри сообщений (sender/receiver)
// Дизайн: без скруглений, угловые срезы — как в макетах

import React, { useState, useMemo } from 'react';
import type { MessageWithSender } from '@/store/chatStore';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (message: MessageWithSender) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onForward?: (message: MessageWithSender) => void;
}

// Memoized — не перерисовывать при изменениях в других сообщениях
export const MessageBubble = React.memo<MessageBubbleProps>(({
  message,
  isOwn,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onForward,
}) => {
  const [showActions, setShowActions] = useState(false);

  // Кэшируем вычисления — не пересчитывать при ре-рендере
  const time = useMemo(() => {
    return message.createdAt
      ? new Date(message.createdAt).toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
  }, [message.createdAt]);

  const isEdited = message.editCount ? message.editCount > 0 : false;
  const isDeleted = message.deleted;

  // Render message content based on type
  const renderContent = () => {
    if (isDeleted) {
      return (
        <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
          Сообщение удалено
        </div>
      );
    }

    switch (message.type) {
      case 'voice':
        return renderVoiceMessage();
      case 'image':
        return renderImageMessage();
      case 'file':
        return renderFileMessage();
      case 'poll':
        return renderPollMessage();
      case 'system':
        return renderSystemMessage();
      default:
        return (
          <div
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
            dangerouslySetInnerHTML={{
              __html: formatMarkdown(message.content || ''),
            }}
          />
        );
    }
  };

  const renderVoiceMessage = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
      <button style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: '#fff', borderRadius: 0, fontSize: '16px' }}>
        ▶
      </button>
      <div style={{ flex: 1, height: '32px', display: 'flex', alignItems: 'center', gap: '2px' }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '3px',
              height: `${4 + Math.random() * 24}px`,
              background: 'var(--accent)',
              opacity: i < 8 ? 1 : 0.3,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>0:14</span>
    </div>
  );

  const renderImageMessage = () => (
    <div>
      <div
        style={{
          width: '280px',
          height: '200px',
          background: 'var(--bg-tertiary)',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}
      >
        🖼 Изображение
      </div>
      {message.content && <div>{message.content}</div>}
    </div>
  );

  const renderFileMessage = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'var(--bg-tertiary)' }}>
      <span style={{ fontSize: '24px' }}>📄</span>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>{message.attachment?.name || 'Файл'}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {formatBytes(message.attachment?.size || 0)}
        </div>
      </div>
    </div>
  );

  const renderPollMessage = () => {
    const poll = message.poll || (message.content ? parsePollContent(message.content) : null);
    if (!poll) return null;

    return (
      <div>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>{poll.question}</div>
        {poll.options.map((option: { text: string; votes: number }, i: number) => {
          const percent = poll.votes ? Math.round((option.votes / poll.votes) * 100) : 0;
          return (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                marginBottom: '4px',
                background: 'var(--bg-tertiary)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${percent}%`,
                  background: 'rgba(45, 184, 77, 0.15)',
                  transition: 'width 0.3s ease',
                }}
              />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{option.text}</span>
                {poll.votes && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{percent}%</span>}
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {poll.votes} голосов{poll.anonymous ? ' • Анонимный' : ''}
        </div>
      </div>
    );
  };

  const renderSystemMessage = () => (
    <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', padding: '4px 0' }}>
      {message.content}
    </div>
  );

  const parsePollContent = (content: string) => {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  };

  // Reactions
  const reactions = message.reactions || [];
  const reactionCounts: Record<string, number> = {};
  reactions.forEach((r) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });

  const quickEmojis = ['👍', '❤', '🔥', '😂', '😮', '😢', '👎'];

  return (
    <div
      className={`message ${isOwn ? 'message--sender' : 'message--receiver'}`}
      style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: '8px', padding: '4px 16px', position: 'relative' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className="message__bubble"
        style={{
          maxWidth: '70%',
          padding: '10px 14px',
          background: isOwn ? 'var(--accent)' : 'var(--bg-secondary)',
          color: isOwn ? '#fff' : 'var(--text-primary)',
          position: 'relative',
          // Angular cuts — без скруглений
          clipPath: isOwn
            ? 'polygon(0% 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%)'
            : 'polygon(12px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 12px)',
        }}
      >
        {/* Header: time + tags */}
        <div
          className="message__header"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '11px', opacity: 0.7 }}
        >
          <span>{time}</span>
          {message.forwarded && (
            <span className="message__header-tag message__header-tag--forwarded" style={{ fontSize: '10px' }}>↩ Переслано</span>
          )}
          {message.ai && (
            <span className="message__header-tag message__header-tag--ai" style={{ fontSize: '10px' }}>🤖 ИИ</span>
          )}
          {isEdited && <span style={{ fontSize: '10px', fontStyle: 'italic' }}> (изм.)</span>}
        </div>

        {/* Reply preview */}
        {message.replyTo && (
          <div
            className="message__reply"
            style={{
              padding: '6px 8px',
              marginBottom: '8px',
              borderLeft: `2px solid ${isOwn ? 'rgba(255,255,255,0.4)' : 'var(--accent)'}`,
              background: isOwn ? 'rgba(255,255,255,0.1)' : 'var(--bg-tertiary)',
              fontSize: '12px',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '2px' }}>{message.replyTo.sender?.displayName || message.replyTo.sender?.username || 'Пользователь'}</div>
            <div style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
              {message.replyTo.content}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="message__body">{renderContent()}</div>

        {/* Edit history */}
        {isEdited && message.editHistory && (
          <div className="message__edit-history" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(128,128,128,0.2)', fontSize: '11px', color: 'var(--text-muted)' }}>
            <div>История изменений:</div>
            <div style={{ marginTop: '4px' }}>
              <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{message.editHistory.old}</span>
              {' → '}
              <span style={{ color: 'var(--success)' }}>{message.editHistory.new}</span>
            </div>
            <div>Изменено: {time}</div>
          </div>
        )}

        {/* Actions bar */}
        {showActions && !isDeleted && (
          <div
            className="message__actions"
            style={{ display: 'flex', gap: '4px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(128,128,128,0.2)' }}
          >
            <button className="message__action-btn" title="Ответить" onClick={() => onReply?.(message)}>↩</button>
            <button className="message__action-btn" title="Копировать" onClick={() => navigator.clipboard.writeText(message.content || '')}>📋</button>
            <button className="message__action-btn" title="Реакция" onClick={() => {
              const emoji = prompt('Введите эмодзи:');
              if (emoji) onReact?.(message.id, emoji);
            }}>😊</button>
            {isOwn && <button className="message__action-btn" title="Изменить" onClick={() => {
              const newContent = prompt('Редактировать:', message.content);
              if (newContent && newContent !== message.content) onEdit?.(message.id, newContent);
            }}>✏</button>}
            {isOwn && <button className="message__action-btn" title="Удалить" onClick={() => onDelete?.(message.id)}>🗑</button>}
            <button className="message__action-btn" title="Переслать" onClick={() => onForward?.(message)}>📤</button>
          </div>
        )}
      </div>

      {/* Read ticks (only for own messages) */}
      {isOwn && message.status && (
        <div className={`msg-ticks ${message.status === 'read' ? 'msg-ticks--read' : 'msg-ticks--delivered'}`} style={{ alignSelf: 'flex-end', fontSize: '11px', marginTop: '16px' }}>
          {message.status === 'read' ? '✓✓' : '✓✓'}
        </div>
      )}

      {/* Reactions bar */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="message__reactions" style={{ display: 'flex', gap: '6px', marginTop: '4px', marginLeft: isOwn ? 'auto' : '0', paddingLeft: isOwn ? 0 : '48px' }}>
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <span
              key={emoji}
              className={`message__reaction ${isOwn ? 'message__reaction--mine' : ''}`}
              style={{
                padding: '2px 8px',
                background: 'var(--bg-tertiary)',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onClick={() => onReact?.(message.id, emoji)}
            >
              {emoji} <span>{count}</span>
            </span>
          ))}
          <button
            style={{ fontSize: '13px', cursor: 'pointer', background: 'none', border: 'none', padding: '2px 4px' }}
            onClick={() => {
              const emoji = prompt('Выберите реакцию:');
              if (emoji) onReact?.(message.id, emoji);
            }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}); // React.memo

// Utilities
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\`(.+?)\`/g, '<code>$1</code>')
    .replace(/\~\~(.+?)\~\~/g, '<del>$1</del>')
    .replace(/\n/g, '<br/>');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

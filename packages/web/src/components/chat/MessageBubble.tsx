// MessageBubble — пузырь сообщения (P34: редизайн по mockups/balloo-su/chats.html)
// Дизайн-система common.css:
//   - пузырь без скруглений, угловой срез 45° на кончике (4%): sender — справа
//     внизу (--bubble-sender), receiver — слева внизу (--bubble-receiver)
//   - sender: border-right 4px accent; receiver: border-left 4px border-strong
//   - действия на противоположном от среза углу (CSS: message--sender/-receiver)
//   - header: время + теги (Переслано / ИИ / Автоответ)
//   - reply-quote, реакции-chips, edit history с diff, msg-ticks (✓✓)

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
  const [showEditHistory, setShowEditHistory] = useState(false);

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
      return <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Сообщение удалено</div>;
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
            className="message__body--markdown"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content || '') }}
          />
        );
    }
  };

  const renderVoiceMessage = () => {
    // Waveform как в макете: чередование accent / border-strong полос
    const bars = [8, 16, 24, 12, 28, 20, 8, 16, 12, 24, 8, 20, 16, 12];
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
        <button className="btn btn--secondary btn--icon">▶</button>
        <div style={{ flex: 1, height: '32px', display: 'flex', alignItems: 'center', gap: '2px' }}>
          {bars.map((h, i) => (
            <div
              key={i}
              style={{
                width: '3px',
                height: `${h}px`,
                background: i < 6 ? 'var(--accent)' : 'var(--border-strong)',
              }}
            />
          ))}
        </div>
        <span className="text-xs text-muted">0:14</span>
        <button className="text-xs text-accent">1.5x</button>
      </div>
    );
  };

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
      <div className="poll">
        <div className="poll__question">📊 {poll.question}</div>
        {poll.options.map((option: { text: string; votes: number }, i: number) => {
          const percent = poll.votes ? Math.round((option.votes / poll.votes) * 100) : 0;
          return (
            <div key={i} className="poll__option">
              <div className="poll__option-bar" style={{ width: `${percent}%` }} />
              <span className="poll__option-text">{option.text}</span>
              <span className="poll__option-percent">{percent}%</span>
            </div>
          );
        })}
        <div className="poll__meta">
          <span>{poll.votes || 0} голосов</span>
          {poll.anonymous && <span>• Анонимный</span>}
          <span>• Можно переслать</span>
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

  // Reactions — chips с эмодзи и счётчиком
  const reactions = message.reactions || [];
  const reactionCounts: Record<string, number> = {};
  reactions.forEach((r) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });

  return (
    <div
      className={`message ${isOwn ? 'message--sender' : 'message--receiver'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="message__bubble">
        {/* Header: время + теги */}
        <div className="message__header">
          <span>{time}</span>
          {message.forwarded && (
            <span className="message__header-tag message__header-tag--forwarded">↩ Переслано</span>
          )}
          {message.ai && <span className="message__header-tag message__header-tag--ai">🤖 ИИ</span>}
          {message.autoReply && (
            <span className="message__header-tag message__header-tag--auto">⚙ Автоответ</span>
          )}
          {isEdited && (
            <span
              className="message__header-tag"
              style={{ cursor: 'pointer' }}
              title="История изменений"
              onClick={() => setShowEditHistory(!showEditHistory)}
            >
              ✏ Изменено
            </span>
          )}
        </div>

        {/* Reply quote */}
        {message.replyTo && (
          <div className="message__reply">
            <div className="message__reply-author">
              {message.replyTo.sender?.displayName || message.replyTo.sender?.username || 'Пользователь'}
            </div>
            <div>{message.replyTo.content}</div>
          </div>
        )}

        {/* Body */}
        <div className="message__body">{renderContent()}</div>

        {/* Reactions — chips с эмодзи и счётчиком */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="message__reactions">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <span
                key={emoji}
                className={`message__reaction${reactions.some((r) => r.emoji === emoji) ? ' message__reaction--mine' : ''}`}
                onClick={() => onReact?.(message.id, emoji)}
              >
                {emoji} <span>{count}</span>
              </span>
            ))}
          </div>
        )}

        {/* Actions — на противоположном от среза углу (CSS-классы) */}
        {showActions && !isDeleted && (
          <div className="message__actions">
            <button className="message__action-btn" title="Ответить" onClick={() => onReply?.(message)}>↩</button>
            <button
              className="message__action-btn"
              title="Копировать"
              onClick={() => navigator.clipboard.writeText(message.content || '')}
            >
              📋
            </button>
            <button
              className="message__action-btn"
              title="Реакция"
              onClick={() => onReact?.(message.id, '👍')}
            >
              😊
            </button>
            {!isOwn && (
              <button className="message__action-btn" title="Переслать" onClick={() => onForward?.(message)}>📤</button>
            )}
            {isOwn && (
              <button
                className="message__action-btn"
                title="Изменить"
                onClick={() => {
                  const newContent = prompt('Редактировать:', message.content);
                  if (newContent && newContent !== message.content) onEdit?.(message.id, newContent);
                }}
              >
                ✏
              </button>
            )}
            {isOwn && (
              <button className="message__action-btn" title="Удалить" onClick={() => onDelete?.(message.id)}>🗑</button>
            )}
          </div>
        )}

        {/* Edit history — diff (old/new) */}
        {isEdited && message.editHistory && (
          <div className={`message__edit-history${showEditHistory ? ' message__edit-history--open' : ''}`}>
            <div className="text-xs text-muted mb-2">История изменений:</div>
            <div className="mb-2">
              <span className="diff-old">{message.editHistory.old}</span> →{' '}
              <span className="diff-new">{message.editHistory.new}</span>
            </div>
            <div className="text-xs text-muted">Изменено: {time}</div>
          </div>
        )}
      </div>

      {/* Read ticks — только свои сообщения (✓✓ delivered / read) */}
      {isOwn && message.status && (
        <div className={`msg-ticks msg-ticks--${message.status === 'read' ? 'read' : 'delivered'}`}>
          ✓✓
        </div>
      )}
    </div>
  );
}); // React.memo

// Utilities
function formatMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/\n/g, '<br/>');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

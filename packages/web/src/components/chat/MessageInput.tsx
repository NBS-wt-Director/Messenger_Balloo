// MessageInput — поле ввода с emoji, вложения, reply, slash commands

import React, { useState, useRef, useEffect } from 'react';
import type { MessageWithSender } from '@/store/chatStore';

interface MessageInputProps {
  onSend: (content: string, type: string) => void;
  onReply?: (message: MessageWithSender) => void;
  onCancelReply?: () => void;
  replyTo?: { id: string; author: string; content: string; avatarUrl?: string } | null;
  isTyping?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onReply,
  onCancelReply,
  replyTo,
  isTyping = false,
}) => {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSlashHint, setShowSlashHint] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const emojis = ['😀', '😂', '🥰', '😍', '🤩', '😎', '🤔', '😢', '😡', '🤮', '👍', '👎', '❤', '🔥', '🎉', '💯', '✅', '❌', '⭐', '👋', '🙏', '💪', '🤝', '🚀'];

  const slashCommands = [
    { cmd: 'poll', desc: 'Создать опрос (вопрос;вариант1;вариант2;...)' },
    { cmd: 'quiz', desc: 'Создать квиз (вопрос;вариант1;вариант2;...;correct=2)' },
    { cmd: 'list_active', desc: 'Активный список (пункт1;пункт2;...)' },
    { cmd: 'list_passive', desc: 'Пассивный список (пункт1;пункт2;...)' },
    { cmd: 'personali', desc: 'Персонали (пункт1;пункт2;...;multiple=false)' },
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [content]);

  const handleSend = () => {
    const text = content.trim();
    if (!text) return;

    // Check for slash commands
    if (text.startsWith('/')) {
      const parts = text.split('_');
      const cmd = parts[0].slice(1).toLowerCase();
      const param = parts.slice(1).join('_').trim();

      if (slashCommands.find((c) => c.cmd === cmd)) {
        onSend(text, 'slash');
        setContent('');
        return;
      }
    }

    onSend(text, 'text');
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === '/') {
      setShowSlashHint(true);
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleSlashSelect = (cmd: string) => {
    setContent((prev) => '/' + cmd + '_');
    setShowSlashHint(false);
    textareaRef.current?.focus();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Reply preview panel */}
      {replyTo && (
        <div
          className="reply-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'var(--bg-tertiary)',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={onCancelReply}
            style={{ fontSize: '16px', padding: '4px 8px', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>
              {replyTo.author}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {replyTo.content}
            </div>
          </div>
        </div>
      )}

      {/* Emoji panel */}
      {showEmoji && (
        <div
          className="emoji-panel"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '8px',
            padding: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            maxWidth: '320px',
            zIndex: 100,
          }}
        >
          {emojis.map((emoji) => (
            <span
              key={emoji}
              className="emoji-panel__btn"
              style={{
                fontSize: '20px',
                padding: '4px 6px',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => insertEmoji(emoji)}
            >
              {emoji}
            </span>
          ))}
        </div>
      )}

      {/* Slash command hint */}
      {showSlashHint && (
        <div
          className="input-hint"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '8px',
            padding: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 100,
            minWidth: '300px',
          }}
          onMouseLeave={() => setShowSlashHint(false)}
        >
          {slashCommands.map((cmd) => (
            <div
              key={cmd.cmd}
              className="input-hint__item"
              style={{
                padding: '6px 8px',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '2px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => handleSlashSelect(cmd.cmd)}
            >
              <code style={{ fontSize: '12px', color: 'var(--accent)' }}>{`/${cmd.cmd}_`}</code>{' '}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cmd.desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div
        className="input-area"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        }}
      >
        {/* Attach */}
        <button
          className="input-area__btn"
          title="Прикрепить файл"
          style={{ fontSize: '20px', padding: '8px' }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = () => {
              const file = input.files?.[0];
              if (file) {
                // TODO: upload file
              }
            };
            input.click();
          }}
        >
          📎
        </button>

        {/* Photo */}
        <button
          className="input-area__btn"
          title="Фото/видео"
          style={{ fontSize: '20px', padding: '8px' }}
        >
          🖼
        </button>

        {/* Voice */}
        <button
          className="input-area__btn"
          title="Голосовое"
          style={{ fontSize: '20px', padding: '8px' }}
          onClick={() => {
            // TODO: voice recording
          }}
        >
          🎤
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="input-area__field"
          placeholder="Напишите сообщение... (или / для команд)"
          rows={1}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setShowSlashHint(e.target.value.startsWith('/'));
          }}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            minHeight: '40px',
            maxHeight: '150px',
            resize: 'none',
            padding: '10px 12px',
            fontFamily: 'inherit',
            fontSize: '14px',
            lineHeight: '1.4',
          }}
        />

        {/* Poll */}
        <button
          className="input-area__btn"
          title="Интерактив"
          style={{ fontSize: '20px', padding: '8px' }}
        >
          📊
        </button>

        {/* Emoji */}
        <button
          className="input-area__btn"
          title="Эмодзи"
          onClick={() => setShowEmoji(!showEmoji)}
          style={{ fontSize: '20px', padding: '8px' }}
        >
          {isTyping ? '⏳' : '😊'}
        </button>

        {/* Send */}
        <button
          className="input-area__btn input-area__btn--send"
          title="Отправить"
          onClick={handleSend}
          style={{
            fontSize: '20px',
            padding: '8px',
            color: content.trim() ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

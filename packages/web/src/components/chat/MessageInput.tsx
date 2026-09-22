// MessageInput — поле ввода (P34: редизайн по mockups/balloo-su/chats.html)
// Классы common.css: input-area, input-area__btn/field, emoji-panel,
// input-hint (slash-подсказки /poll_ /quiz_ /list_active_ /list_passive_ /personali_)

import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSend: (content: string, type: string) => void;
  onCancelReply?: () => void;
  isTyping?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  isTyping = false,
}) => {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSlashHint, setShowSlashHint] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  // Эмодзи-панель — тот же набор, что в макете (A1.1)
  const emojis = ['😀', '😂', '🥰', '😍', '🤩', '😎', '🤔', '😢', '😡', '🤮', '👍', '👎', '❤', '🔥', '🎉', '💯', '✅', '❌', '⭐', '👋', '🙏', '💪', '🤝', '🚀'];

  // Slash-команды — как в макете (input-hint)
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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [content]);

  // Закрытие панелей по клику вне
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
        setShowSlashHint(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSend = () => {
    const text = content.trim();
    if (!text) return;

    // Slash-команды — тип slash
    if (text.startsWith('/')) {
      const parts = text.split('_');
      const cmd = parts[0].slice(1).toLowerCase();

      if (slashCommands.find((c) => c.cmd === cmd)) {
        onSend(text, 'slash');
        setContent('');
        setShowSlashHint(false);
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
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleSlashSelect = (cmd: string) => {
    setContent('/' + cmd + '_');
    setShowSlashHint(false);
    textareaRef.current?.focus();
  };

  return (
    <div ref={areaRef} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Эмодзи-панель (A1.1) */}
      <div className={`emoji-panel${showEmoji ? ' emoji-panel--visible' : ''}`}>
        {emojis.map((emoji) => (
          <span key={emoji} className="emoji-panel__btn" onClick={() => insertEmoji(emoji)}>
            {emoji}
          </span>
        ))}
      </div>

      {/* Slash command hint (input-hint) */}
      <div className={`input-hint${showSlashHint ? ' input-hint--visible' : ''}`}>
        {slashCommands.map((cmd) => (
          <div
            key={cmd.cmd}
            className="input-hint__item"
            onClick={() => handleSlashSelect(cmd.cmd)}
          >
            <code>{`/${cmd.cmd}_`}</code> — {cmd.desc}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="input-area">
        <button
          className="input-area__btn"
          title="Прикрепить файл"
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
        <button className="input-area__btn" title="Фото/видео">🖼</button>
        <button className="input-area__btn" title="Голосовое">🎤</button>

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
        />

        <button className="input-area__btn" title="Интерактив">📊</button>
        <button
          className="input-area__btn"
          title="Эмодзи"
          onClick={() => setShowEmoji(!showEmoji)}
        >
          {isTyping ? '⏳' : '😊'}
        </button>
        <button
          className="input-area__btn input-area__btn--send"
          title="Отправить"
          onClick={handleSend}
        >
          ➤
        </button>
      </div>
    </div>
  );
};
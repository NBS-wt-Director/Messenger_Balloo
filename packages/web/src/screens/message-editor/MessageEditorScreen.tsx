// MessageEditor Screen — редактирование/ответ на сообщение
// Макет: mockups/balloo-su/message-editor.html

import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface MessageEdit {
  id: string;
  oldText: string;
  newText: string;
  editedAt: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  chatId: string;
  editCount: number;
}

export default function MessageEditorScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const message: Message | undefined = location.state?.message;
  const isReply = location.state?.isReply || false;
  const repliedMessage: Message | undefined = location.state?.repliedMessage;

  const [text, setText] = useState(message?.content || '');
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<MessageEdit[]>([]);
  const [saving, setSaving] = useState(false);

  const isOwnMessage = message && user && message.senderId === user.id;

  const loadHistory = useCallback(async () => {
    if (!message?.id) return;
    try {
      const data = await api.getMessageHistory(message.id);
      setHistory(data || []);
      setShowHistory(true);
    } catch {
      setHistory([]);
    }
  }, [message]);

  const saveMessage = useCallback(async () => {
    if (!message?.id || !text.trim()) return;
    try {
      setSaving(true);
      await api.updateMessage(message.id, text);
      navigate(-1);
    } catch {
      // ошибка
    } finally {
      setSaving(false);
    }
  }, [message, text, navigate]);

  const deleteMessage = useCallback(async () => {
    if (!message?.id) return;
    if (!confirm('Удалить сообщение?')) return;
    try {
      await api.deleteMessage(message.id);
      navigate(-1);
    } catch {
      // ошибка
    }
  }, [message, navigate]);

  const insertFormat = useCallback((prefix: string, suffix: string = prefix) => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.slice(start, end);
    const newText = text.slice(0, start) + prefix + selected + suffix + text.slice(end);
    setText(newText);
  }, [text]);

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleString('ru-RU');
  };

  if (!message) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <p>Сообщение не найдено</p>
          <button className="btn btn--tertiary" onClick={() => navigate(-1)}>Закрыть</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={() => navigate(-1)}>
      <div className="modal modal--editor" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal__header">
          <span className="modal__title">
            {isReply ? '↩ Ответить на сообщение' : '✏️ Редактировать сообщение'}
          </span>
          <button className="btn btn--tertiary btn--sm" onClick={() => navigate(-1)}>✕</button>
        </div>

        {/* Body */}
        <div className="modal__body">
          {/* Превью ответа */}
          {isReply && repliedMessage && (
            <div className="reply-preview">
              <span className="reply-preview__text">{repliedMessage.content.slice(0, 100)}</span>
            </div>
          )}

          {/* Markdown панель */}
          <div className="markdown-tabs">
            <button className="markdown-tab" onClick={() => insertFormat('**')} title="Жирный">B</button>
            <button className="markdown-tab" onClick={() => insertFormat('_')} title="Курсив">I</button>
            <button className="markdown-tab" onClick={() => insertFormat('__')} title="Подчёркнутый">U</button>
            <button className="markdown-tab" onClick={() => insertFormat('`')} title="Код">{'</>'}</button>
            <button className="markdown-tab" onClick={() => insertFormat('[', '](url)')} title="Ссылка">🔗</button>
            <button className="markdown-tab" onClick={() => insertFormat('> ')} title="Цитата">❝</button>
            <button className="markdown-tab" onClick={() => insertFormat('- ')} title="Список">☰</button>
          </div>

          {/* Textarea */}
          <textarea
            id="editor-textarea"
            className="form-input editor-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isReply ? 'Ваш ответ...' : 'Отредактируйте сообщение...'}
            rows={5}
            maxLength={4096}
          />

          {/* Счётчик + кнопки */}
          <div className="editor-toolbar">
            <span className="editor-toolbar__count">{text.length}/4096</span>
            <div className="editor-toolbar__actions">
              <button className="btn btn--tertiary btn--sm" onClick={() => setShowPreview(!showPreview)}>
                👁 Превью
              </button>
              {message.editCount > 0 && (
                <button className="btn btn--tertiary btn--sm" onClick={loadHistory}>
                  📝 История
                </button>
              )}
            </div>
          </div>

          {/* Превью */}
          {showPreview && (
            <div className="editor-preview">
              <p>{text}</p>
            </div>
          )}

          {/* История изменений */}
          {showHistory && history.length > 0 && (
            <div className="editor-history">
              <h4 className="editor-history__title">История изменений</h4>
              {history.map((h) => (
                <div key={h.id} className="editor-history__item">
                  <span className="editor-history__date">{formatDate(h.editedAt)}</span>
                  <span className="editor-history__old">{h.oldText.slice(0, 50)}</span>
                  <span className="editor-history__new">{h.newText.slice(0, 50)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal__footer">
          <button className="btn btn--tertiary" onClick={() => navigate(-1)}>Отмена</button>
          {isOwnMessage && (
            <button className="btn btn--danger" onClick={deleteMessage}>🗑 Удалить</button>
          )}
          <button
            className="btn btn--primary"
            onClick={saveMessage}
            disabled={saving || !text.trim()}
          >
            {saving ? 'Сохранение...' : '💾 Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

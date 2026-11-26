// TextNoteModal — создание текстового вложения (заметки) из чата
// Тикет 1795560006.
//
// Цикл: textarea → Blob(text/plain) → File → api.uploadFile → api.sendMessage
// с attachments=[{ type:'text', url, name:'note.txt', size }].
// Сервер attachmentType() уже распознаёт text/* как type='text' (AttachmentPanel.tsx).

import { useState, useCallback } from 'react';
import { api } from '@/services/api';

interface TextNoteModalProps {
  open: boolean;
  chatId: string;
  onClose: () => void;
  onSent: () => void;
}

export function TextNoteModal({ open, chatId, onClose, onSent }: TextNoteModalProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setText('');
    setError(null);
    onClose();
  }, [onClose]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const file = new File([blob], 'note.txt', { type: 'text/plain;charset=utf-8' });
      const res = await api.uploadFile(file, chatId);
      const d = (res as any)?.data ?? res;
      await api.sendMessage(chatId, {
        type: 'file',
        content: '',
        attachments: [
          {
            type: 'text',
            url: d.url,
            size: d.size ?? file.size,
            name: d.name ?? 'note.txt',
          },
        ],
      });
      onSent();
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Не удалось отправить заметку');
    } finally {
      setSending(false);
    }
  }, [text, chatId, sending, onSent, handleClose]);

  if (!open) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleClose} />
      <div className="modal" style={{ width: '90vw', maxWidth: 560 }}>
        <div className="modal__header">
          <span className="modal__title">📝 Текстовое вложение</span>
          <div className="modal__close" onClick={handleClose}>✕</div>
        </div>

        <div className="modal__body">
          {error && (
            <div style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 14 }}>
              ⚠ {error}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Текст заметки</label>
            <textarea
              className="form-input"
              rows={12}
              placeholder="Введите текст заметки…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <div className="text-xs text-muted" style={{ marginTop: 6 }}>
              Будет отправлен как файл note.txt ({text.length} симв.)
            </div>
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn btn--tertiary" onClick={handleClose}>
            Отмена
          </button>
          <button
            className="btn btn--primary"
            onClick={handleSend}
            disabled={sending || !text.trim()}
          >
            {sending ? 'Отправка…' : '➤ Отправить'}
          </button>
        </div>
      </div>
    </>
  );
}

export default TextNoteModal;

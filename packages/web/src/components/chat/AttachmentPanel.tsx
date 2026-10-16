// Attachment Panel — выезжающая панель вложений (drag & drop)
// Макет: mockups/balloo-su/attachment-panel.html (принят владельцем
// 16.10.2026, 1.1.12 → 6.36), задание: attachment-panel.md, тикет 1792124253.
//
// Реальный цикл: выбор/drag&drop/Ctrl+V → POST /api/upload/file (chatId
// обязателен) → POST /api/chats/:id/messages с attachments[].
// Секции «Недавние» и «Хранилище» из макета не реализованы: сервер не имеет
// GET /api/files/recent и сущности квоты хранилища (проверено по роутам и
// mockups/data_schema.json); mock-карточки с выдуманными файлами не рисуем.

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';

interface AttachmentPanelProps {
  open: boolean;
  chatId: string;
  onClose: () => void;
  /** вызывается после успешной отправки — родитель перезагружает сообщения */
  onSent: () => void;
}

interface PickedFile {
  id: string;
  file: File;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${bytes} Б`;
}

// тип вложения по MIME — как принимает messageService.attachments[].type
function attachmentType(mime: string): string {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'file';
}

const QUICK_ACTIONS: Array<{ icon: string; label: string; accept: string | null; hint?: string }> = [
  { icon: '🖼', label: 'Фото', accept: 'image/*' },
  { icon: '🎥', label: 'Видео', accept: 'video/*' },
  { icon: '📄', label: 'Документ', accept: '.pdf,.doc,.docx,.txt,.xls,.xlsx' },
  { icon: '📸', label: 'Скриншот', accept: null, hint: 'Вставьте скриншот из буфера: Ctrl+V' },
  { icon: '🎵', label: 'Аудио', accept: 'audio/*' },
  { icon: '📦', label: 'Файл', accept: null },
];

export function AttachmentPanel({ open, chatId, onClose, onSent }: AttachmentPanelProps) {
  const [selected, setSelected] = useState<PickedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const picked = Array.from(files).map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
    }));
    if (picked.length > 0) {
      setSelected((prev) => [...prev, ...picked]);
    }
  }, []);

  const openQuickPicker = (accept: string | null) => {
    // accept проставляется императивно до .click(): state-accept читался бы
    // из предыдущего рендера и давал неверный фильтр
    if (quickInputRef.current) {
      quickInputRef.current.accept = accept ?? '';
      quickInputRef.current.click();
    }
  };

  // Esc закрывает панель (как ✕ в макете)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSend = async () => {
    if (selected.length === 0 || sending) return;
    try {
      setSending(true);
      setError(null);
      const uploaded = await Promise.all(
        selected.map(async ({ file }) => {
          const res = await api.uploadFile(file, chatId);
          const d = res?.data ?? res;
          return {
            type: attachmentType(file.type),
            url: d.url,
            thumbnail: d.thumbnailUrl || undefined,
            size: d.size ?? file.size,
            name: d.name ?? file.name,
            width: d.width || undefined,
            height: d.height || undefined,
            duration: d.duration || undefined,
          };
        })
      );
      await api.sendMessage(chatId, { type: 'file', content: '', attachments: uploaded });
      setSelected([]);
      onSent();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Не удалось отправить файлы');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Backdrop (макет: rgba(0,0,0,0.3), z-index 400) */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 400 }}
        />
      )}

      <div
        role="dialog"
        aria-label="Панель вложений"
        aria-hidden={!open}
        onPaste={(e) => {
          if (!open) return;
          const files = e.clipboardData?.files;
          if (files && files.length > 0) {
            e.preventDefault();
            addFiles(files);
          }
        }}
        style={{
          position: 'fixed',
          top: 56,
          right: open ? 0 : -400,
          bottom: 0,
          width: 400,
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
          zIndex: 401,
          display: 'flex',
          flexDirection: 'column',
          transition: 'right 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <span className="font-bold" style={{ fontSize: 16, color: 'var(--text-primary)' }}>
            📎 Вложения
          </span>
          <button className="btn btn--tertiary btn--sm" onClick={onClose} title="Закрыть">
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {/* Drag & Drop Zone */}
          <div
            data-testid="drop-zone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
            }}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-strong, var(--border-color))'}`,
              background: dragOver ? 'rgba(45,184,77,0.06)' : 'transparent',
              padding: '32px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Перетащите файлы сюда
            </div>
            <div className="text-sm text-secondary">или нажмите для выбора</div>
            <div className="text-xs text-muted" style={{ marginTop: 8 }}>
              Макс. 2 ГБ на файл · JPG, PNG, PDF, MP4, OGG...
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {/* Быстрая отправка */}
          <div className="text-xs font-bold text-muted" style={{ marginBottom: 8 }}>
            ⚡ Быстрая отправка
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 16,
            }}
          >
            {QUICK_ACTIONS.map((qa) => (
              <div
                key={qa.label}
                role="button"
                tabIndex={0}
                title={qa.hint ?? `Выберите: ${qa.label}`}
                onClick={() => qa.accept !== null && openQuickPicker(qa.accept)}
                onKeyDown={(e) => e.key === 'Enter' && qa.accept !== null && openQuickPicker(qa.accept)}
                style={{
                  textAlign: 'center',
                  padding: '14px 8px',
                  cursor: qa.accept !== null ? 'pointer' : 'default',
                }}
                className="card card--hover"
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{qa.icon}</div>
                <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {qa.label}
                </div>
                {qa.hint && (
                  <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                    {qa.hint}
                  </div>
                )}
              </div>
            ))}
            <input
              ref={quickInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {error && (
            <div className="text-sm text-danger" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer — выбрано файлов (макет: показывается при выборе) */}
        {selected.length > 0 && (
          <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span className="text-sm font-bold">📎 Выбрано: {selected.length}</span>
              <button className="btn btn--tertiary btn--sm" onClick={() => setSelected([])}>
                Очистить
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {selected.map((p) => (
                <span
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  title="Убрать файл"
                  onClick={() => setSelected((prev) => prev.filter((x) => x.id !== p.id))}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && setSelected((prev) => prev.filter((x) => x.id !== p.id))
                  }
                  className="chip"
                  style={{ cursor: 'pointer' }}
                >
                  {p.file.name} ({formatSize(p.file.size)}) ✕
                </span>
              ))}
            </div>
            <button
              className="btn btn--primary btn--block"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? 'Отправка…' : '➤ Отправить'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Attachment Panel — выезжающая панель вложений (drag & drop)
// Макет: mockups/balloo-su/attachment-panel.html (принят владельцем
// 16.10.2026, 1.1.12 → 6.36), задание: attachment-panel.md, тикет 1792124253.
//
// Тикет 1795677071: панель собирает ОДИН массив вложений любых типов —
// файлы (фото/видео/документ/аудио/файл/с камеры) и не-файловые формы
// (опрос, квиз, активный/пассивный список, персонали). Лимиты: 15 вложений
// бесплатно, до 50 за баллы (стоимость n + 5).
//
// Реальный цикл: выбор/drag&drop/Ctrl+V → POST /api/upload/file (chatId
// обязателен) → POST /api/chats/:id/messages с attachments[].
// Секции «Недавние» и «Хранилище» из макета не реализованы: сервер не имеет
// GET /api/files/recent и сущности квоты хранилища (проверено по роутам и
// mockups/data_schema.json); mock-карточки с выдуманными файлами не рисуем.

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';
import {
  type PendingAttachment,
  type PendingFile,
  type PendingNonFile,
  type NonFileAttachmentType,
  type ReadyAttachment,
  FREE_ATTACHMENT_LIMIT,
  MAX_ATTACHMENT_LIMIT,
  attachmentCost,
  attachmentTypeIcon,
  attachmentTypeLabel,
  messageTypeFor,
  nextAttachmentId,
} from './attachmentTypes';

interface AttachmentPanelProps {
  open: boolean;
  chatId: string;
  onClose: () => void;
  /** вызывается после успешной отправки — родитель перезагружает сообщения */
  onSent: () => void;
  /** Тикет 1795560006: открыть модалку текстовой заметки. */
  onTextNote?: () => void;
  /** Тикет 1795677071: открыть форму не-файлового вложения. */
  onNonFileAction?: (type: NonFileAttachmentType) => void;
  /**
   * Тикет 1795677071: вложение, созданное в форме (slash-команда или кнопка
   * «Добавить»), кладётся в общий массив панели. После добавления родитель
   * сбрасывает проп (onIncomingConsumed).
   */
  incomingNonFile?: PendingNonFile | null;
  onIncomingConsumed?: () => void;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${bytes} Б`;
}

// тип файлового вложения по MIME — как принимает messageService.attachments[].type
// (text — текстовые вложения: txt/md/csv/json/log, тик. 1795456886)
function fileAttachmentType(mime: string, name?: string): PendingFile['type'] {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('text/') || /\.(txt|md|csv|json|log|xml|yml|yaml|ini)$/i.test(name || '')) {
    return 'text';
  }
  return 'file';
}

const QUICK_ACTIONS: Array<{ icon: string; label: string; accept: string | null; hint?: string; capture?: string }> = [
  { icon: '🖼', label: 'Фото', accept: 'image/*' },
  { icon: '🎥', label: 'Видео', accept: 'video/*' },
  { icon: '📄', label: 'Документ', accept: '.pdf,.doc,.docx,.txt,.md,.csv,.json,.log,.xls,.xlsx,.rtf' },
  { icon: '📸', label: 'Скриншот', accept: null, hint: 'Вставьте скриншот из буфера: Ctrl+V' },
  { icon: '🎵', label: 'Аудио', accept: 'audio/*' },
  { icon: '📦', label: 'Файл', accept: null },
  { icon: '📷', label: 'С камеры', accept: 'image/*', capture: 'environment' },
];

// Не-файловые вложения (тик. 1795677071): форма открывается модалкой,
// результат кладётся в общий массив. Геолокация/контакт пока не реализованы —
// показываем неактивными, чтобы не было мёртвых кнопок с ложным поведением.
const NON_FILE_ACTIONS: Array<{
  icon: string;
  label: string;
  type?: NonFileAttachmentType;
  action?: 'note';
  disabled?: boolean;
}> = [
  { icon: '📊', label: 'Опрос', type: 'poll' },
  { icon: '🎯', label: 'Квиз', type: 'quiz' },
  { icon: '☑️', label: 'Активный список', type: 'list_active' },
  { icon: '📋', label: 'Пассивный список', type: 'list_passive' },
  { icon: '🙋', label: 'Персонали', type: 'personali' },
  { icon: '📝', label: 'Текст', action: 'note' },
  { icon: '📍', label: 'Геолокация', disabled: true },
  { icon: '👤', label: 'Контакт', disabled: true },
];

export function AttachmentPanel({
  open,
  chatId,
  onClose,
  onSent,
  onTextNote,
  onNonFileAction,
  incomingNonFile,
  onIncomingConsumed,
}: AttachmentPanelProps) {
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const picked: PendingFile[] = Array.from(files).map((file) => ({
      kind: 'file',
      id: nextAttachmentId(),
      type: fileAttachmentType(file.type, file.name),
      file,
    }));
    if (picked.length === 0) return;
    setAttachments((prev) => {
      const next = [...prev, ...picked];
      if (next.length > MAX_ATTACHMENT_LIMIT) {
        setError(`Максимум ${MAX_ATTACHMENT_LIMIT} вложений в одном сообщении`);
        return next.slice(0, MAX_ATTACHMENT_LIMIT);
      }
      return next;
    });
  }, []);

  // Вложение из формы (slash-команда в поле ввода или кнопка панели).
  useEffect(() => {
    if (!incomingNonFile) return;
    setAttachments((prev) => {
      if (prev.length >= MAX_ATTACHMENT_LIMIT) {
        setError(`Максимум ${MAX_ATTACHMENT_LIMIT} вложений в одном сообщении`);
        return prev;
      }
      return [...prev, incomingNonFile];
    });
    onIncomingConsumed?.();
  }, [incomingNonFile, onIncomingConsumed]);

  const removeAttachment = (id: string) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

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
    if (attachments.length === 0 || sending) return;
    try {
      setSending(true);
      setError(null);

      // 1) Файлы — на CDN, получаем url.
      const files = attachments.filter((a): a is PendingFile => a.kind === 'file');
      const uploadedFiles = await Promise.all(
        files.map(async ({ file, type }) => {
          const res = await api.uploadFile(file, chatId);
          const d = (res as any)?.data ?? res;
          return {
            type,
            url: d.url,
            thumbnail: d.thumbnailUrl || undefined,
            size: d.size ?? file.size,
            name: d.name ?? file.name,
            width: d.width || undefined,
            height: d.height || undefined,
            duration: d.duration || undefined,
          } as ReadyAttachment;
        })
      );

      // 2) Не-файловые — данные формы, url пустой (сервер хранит в data).
      const readyNonFile: ReadyAttachment[] = attachments
        .filter((a): a is PendingNonFile => a.kind === 'non-file')
        .map((a) => ({ type: a.type, url: '', data: a.data }));

      const ready: ReadyAttachment[] = [...uploadedFiles, ...readyNonFile];

      await api.sendMessage(chatId, {
        type: messageTypeFor(ready),
        content: '',
        attachments: ready,
      });
      setAttachments([]);
      onSent();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Не удалось отправить вложения');
    } finally {
      setSending(false);
    }
  };

  const cost = attachmentCost(attachments.length);
  const overFreeLimit = attachments.length > FREE_ATTACHMENT_LIMIT;

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
          width: '90vw', maxWidth: 400,
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
                onClick={() => {
                  if (qa.capture) {
                    cameraInputRef.current?.click();
                  } else if (qa.accept !== null) {
                    openQuickPicker(qa.accept);
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && (() => {
                  if (qa.capture) cameraInputRef.current?.click();
                  else if (qa.accept !== null) openQuickPicker(qa.accept);
                })()}
                style={{
                  textAlign: 'center',
                  padding: '14px 8px',
                  cursor: (qa.accept !== null || qa.capture) ? 'pointer' : 'default',
                  ...(qa.capture ? { background: 'rgba(45,184,77,0.08)', borderColor: 'var(--accent)' } : {}),
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
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {/* Не-файловые вложения (замечание 1.1.18) */}
          <div className="text-xs font-bold text-muted" style={{ marginBottom: 8 }}>
            ➕ Добавить
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 16,
            }}
          >
            {NON_FILE_ACTIONS.map((na) => {
              const handleClick = () => {
                if (na.disabled) return;
                if (na.type) {
                  onNonFileAction?.(na.type);
                } else if (na.action === 'note') {
                  // Тикет 1795560006: модалка текстовой заметки.
                  onTextNote?.();
                }
              };
              return (
                <div
                  key={na.label}
                  role="button"
                  tabIndex={na.disabled ? -1 : 0}
                  aria-disabled={na.disabled || undefined}
                  title={na.disabled ? `${na.label} — скоро` : na.label}
                  onClick={handleClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleClick();
                  }}
                  style={{
                    textAlign: 'center',
                    padding: '14px 8px',
                    cursor: na.disabled ? 'not-allowed' : 'pointer',
                    opacity: na.disabled ? 0.45 : 1,
                  }}
                  className={na.disabled ? 'card' : 'card card--hover'}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{na.icon}</div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {na.label}
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="text-sm text-danger" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer — выбрано вложений (макет: показывается при выборе) */}
        {attachments.length > 0 && (
          <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span className="text-sm font-bold">📎 Выбрано: {attachments.length}</span>
              <button className="btn btn--tertiary btn--sm" onClick={() => setAttachments([])}>
                Очистить
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {attachments.map((a) => (
                <span
                  key={a.id}
                  role="button"
                  tabIndex={0}
                  title="Убрать вложение"
                  onClick={() => removeAttachment(a.id)}
                  onKeyDown={(e) => e.key === 'Enter' && removeAttachment(a.id)}
                  className="chip"
                  style={{ cursor: 'pointer' }}
                >
                  {attachmentTypeIcon(a.type)}{' '}
                  {a.kind === 'file'
                    ? `${a.file.name} (${formatSize(a.file.size)})`
                    : attachmentTypeLabel(a.type)}
                  {' ✕'}
                </span>
              ))}
            </div>

            {/* MVP2: платность свыше 15 вложений (стоимость n + 5 баллов) */}
            {overFreeLimit && (
              <div
                className="text-xs"
                style={{ color: 'var(--warning, #d97706)', marginBottom: 8 }}
              >
                ⚠ Сообщение будет платным: {cost} баллов (бесплатно до {FREE_ATTACHMENT_LIMIT})
              </div>
            )}

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

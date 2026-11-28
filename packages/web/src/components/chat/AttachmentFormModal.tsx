// AttachmentFormModal — форма не-файлового вложения (тик. 1795677071).
//
// Покрывает все пять типов из slash-команд макета (chats.html, input-hint):
// опрос, квиз, активный список, пассивный список, персонали. Одна форма на
// все типы: отличаются заголовком и наличием полей «несколько вариантов»
// (poll/personali) и «верный ответ» (quiz).
//
// Подтверждение НЕ отправляет сообщение и не ведёт по роуту — оно отдаёт
// данные родителю, который кладёт вложение в общий массив AttachmentPanel
// (требование 1 тикета: форма добавляет вложение в массив выбранных).

import { useState, useEffect, useCallback } from 'react';
import type { NonFileAttachmentType, PollData, ListData } from './attachmentTypes';
import { attachmentTypeIcon, attachmentTypeLabel } from './attachmentTypes';

interface AttachmentFormModalProps {
  open: boolean;
  type: NonFileAttachmentType | null;
  onClose: () => void;
  onAdd: (type: NonFileAttachmentType, data: Record<string, unknown>) => void;
}

const MIN_OPTIONS = 2;

export function AttachmentFormModal({ open, type, onClose, onAdd }: AttachmentFormModalProps) {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [multiple, setMultiple] = useState(false);
  const [correctIndex, setCorrectIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);

  const isPollLike = type === 'poll' || type === 'quiz';
  const isQuiz = type === 'quiz';
  const isPersonali = type === 'personali';

  // Сброс при смене типа/повторном открытии — форма не должна помнить прошлое
  useEffect(() => {
    if (!open) return;
    setTitle('');
    setOptions(['', '']);
    setMultiple(false);
    setCorrectIndex(-1);
    setError(null);
  }, [open, type]);

  // Esc закрывает (как в остальных модалках чата)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const filled = options.map((o) => o.trim()).filter(Boolean);

  const handleConfirm = useCallback(() => {
    if (!type) return;
    if (!title.trim()) {
      setError(isPollLike ? 'Укажите вопрос' : 'Укажите заголовок');
      return;
    }
    if (isPollLike) {
      if (filled.length < MIN_OPTIONS) {
        setError(`Нужно минимум ${MIN_OPTIONS} варианта`);
        return;
      }
      const data: PollData = { question: title.trim(), options: filled, multiple };
      if (isQuiz) {
        if (correctIndex < 0) {
          setError('Отметьте правильный ответ');
          return;
        }
        data.correctIndex = correctIndex;
      }
      onAdd(type, data as unknown as Record<string, unknown>);
      return;
    }
    if (filled.length < 1) {
      setError('Добавьте хотя бы один пункт');
      return;
    }
    const data: ListData = { title: title.trim(), items: filled };
    if (isPersonali) data.multiple = multiple;
    onAdd(type, data as unknown as Record<string, unknown>);
  }, [type, title, filled, multiple, correctIndex, isPollLike, isQuiz, isPersonali, onAdd]);

  if (!open || !type) return null;

  const titleLabel = `${attachmentTypeIcon(type)} ${attachmentTypeLabel(type)}`;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal" style={{ width: '90vw', maxWidth: 560 }} role="dialog" aria-label={titleLabel}>
        <div className="modal__header">
          <span className="modal__title">{titleLabel}</span>
          <div className="modal__close" onClick={onClose}>✕</div>
        </div>

        <div className="modal__body">
          {error && (
            <div style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 14 }}>⚠ {error}</div>
          )}

          <div className="form-group">
            <label className="form-label">{isPollLike ? 'Вопрос' : 'Заголовок'}</label>
            <input
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isPollLike ? 'Например: Когда встречаемся?' : 'Например: Что берём с собой'}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {isPollLike ? 'Варианты ответа' : 'Пункты списка'}
            </label>
            {options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                {isQuiz && (
                  <input
                    type="radio"
                    name="quiz-correct"
                    title="Правильный ответ"
                    checked={correctIndex === i}
                    onChange={() => setCorrectIndex(i)}
                  />
                )}
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  value={opt}
                  placeholder={isPollLike ? `Вариант ${i + 1}` : `Пункт ${i + 1}`}
                  onChange={(e) =>
                    setOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))
                  }
                />
                {options.length > 1 && (
                  <button
                    className="btn btn--tertiary btn--sm"
                    title="Убрать"
                    onClick={() => {
                      setOptions((prev) => prev.filter((_, idx) => idx !== i));
                      if (correctIndex === i) setCorrectIndex(-1);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              className="btn btn--tertiary btn--sm"
              onClick={() => setOptions((prev) => [...prev, ''])}
            >
              + Добавить
            </button>
          </div>

          {(type === 'poll' || isPersonali) && (
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={multiple}
                onChange={(e) => setMultiple(e.target.checked)}
              />
              {type === 'poll' ? 'Можно выбрать несколько вариантов' : 'Можно выбрать несколько пунктов'}
            </label>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn--tertiary" onClick={onClose}>
            Отмена
          </button>
          <button className="btn btn--primary" onClick={handleConfirm}>
            ➕ Добавить в сообщение
          </button>
        </div>
      </div>
    </>
  );
}

export default AttachmentFormModal;

// StoriesInfoModal — «Что это?» для экрана историй (T4, тик. 1795683301).
//
// Полное описание экрана: что такое истории, сколько живут, кто видит,
// приватность, ответы и реакции, что делать, если историй нет.

import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SECTIONS: Array<{ icon: string; title: string; body: string }> = [
  {
    icon: '📷',
    title: 'Что такое истории',
    body:
      'История — это фото, видео или текст, который виден вашим контактам 24 часа. ' +
      'Через сутки история исчезает сама — как в мессенджерах, к которым вы привыкли.',
  },
  {
    icon: '👀',
    title: 'Кто видит вашу историю',
    body:
      'Вы сами выбираете аудиторию при публикации: все контакты, выбранные контакты ' +
      'или группы контактов. Настроить по умолчанию можно в «Настройки → Приватность».',
  },
  {
    icon: '🔒',
    title: 'Приватность и безопасность',
    body:
      'Истории хранятся на серверах Balloo и удаляются автоматически по истечении срока. ' +
      'Список просмотревших видите только вы. Скрыть просмотры от конкретных людей можно ' +
      'в настройках приватности.',
  },
  {
    icon: '💬',
    title: 'Ответы и реакции',
    body:
      'На историю можно ответить сообщением или поставить реакцию — эмодзи. ' +
      'Ответы приходят в чат с автором истории.',
  },
  {
    icon: '🎬',
    title: 'Если историй нет',
    body:
      'Пока никто из ваших контактов не поделился историей — или мы не смогли их загрузить. ' +
      'Пока мы исправляем эту вопиющую несправедливость, посмотрите примеры ниже: ' +
      'так может выглядеть ваша история. Свою можно загрузить прямо сейчас.',
  },
  {
    icon: '⏱',
    title: 'Сколько живёт история',
    body:
      '24 часа с момента публикации. Продлить нельзя — но можно опубликовать новую. ' +
      'Свои истории до истечения срока можно удалить в любой момент.',
  },
];

export function StoriesInfoModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stories-info-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-strong, var(--border-color))',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}>
          <h2 id="stories-info-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            📷 Что такое истории
          </h2>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px 20px' }}>
          {SECTIONS.map((s) => (
            <div key={s.title} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                {s.icon} {s.title}
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 20, paddingTop: 0 }}>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}

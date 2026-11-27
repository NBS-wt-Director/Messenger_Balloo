// CallsInfoModal — «Что это?» для экрана звонков (тик. 1795683301, U5).
//
// Требование владельца: на экране звонков кнопка «Что это?» с полным
// описанием экрана (история, фильтры, как позвонить).

import React, { useEffect } from 'react';

export interface CallsInfoModalProps {
  open: boolean;
  onClose: () => void;
}

const SECTIONS: { icon: string; title: string; body: string }[] = [
  {
    icon: '📞',
    title: 'История звонков',
    body:
      'Здесь собраны все ваши аудио- и видеозвонки: входящие, исходящие и пропущенные. ' +
      'Записи хранятся, пока вы сами их не удалите.',
  },
  {
    icon: '🎨',
    title: 'Пиктограммы статуса',
    body:
      'Зелёный кружок с галочкой — звонок состоялся. Красный с крестиком — пропущенный. ' +
      'Направление показывается стрелкой рядом с именем собеседника.',
  },
  {
    icon: '🔍',
    title: 'Фильтры',
    body:
      'Кнопки над списком переключают вид: все звонки, пропущенные, входящие, исходящие. ' +
      'Список листается постранично — внизу кнопки перелистывания.',
  },
  {
    icon: '📲',
    title: 'Как позвонить',
    body:
      'Откройте чат с контактом и нажмите кнопку звонка в шапке чата — аудио или видео. ' +
      'Перед первым звонком стоит проверить оборудование: микрофон, камеру и динамики.',
  },
  {
    icon: '🔒',
    title: 'Приватность',
    body:
      'Звонки видны только вам. Собеседник не узнаёт, как часто вы просматриваете историю. ' +
      'Пропущенные звонки не приходят повторно.',
  },
];

export function CallsInfoModal({ open, onClose }: CallsInfoModalProps) {
  // Escape закрывает модалку
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
      aria-labelledby="calls-info-title"
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
          overflowY: 'auto',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-strong, var(--border-color))',
          boxShadow: 'var(--shadow)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <h2 id="calls-info-title" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            📞 Что это — экран «Звонки»
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="btn btn--ghost btn--sm"
            style={{ flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          Короткий гид по экрану: что здесь есть и как этим пользоваться.
        </p>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 4 }}>
                {s.icon} {s.title}
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}

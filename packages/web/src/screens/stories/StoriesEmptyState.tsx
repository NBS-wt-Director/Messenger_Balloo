// StoriesEmptyState — пустое состояние экрана историй (T1, T2, T3; тик. 1795683301).
//
// Требование владельца (дословно):
//   «если нет историй — показываем предзаписанные видеоистории — 3 штуки
//    (природа России, Урал, Города России (без слов)). но скажи что-то вроде —
//    "У вас/ваших контактов/ваших чатов нет ни одной истории или мы не могли
//    загрузить их. Пока вселенная/Мы исправляем эту вопиющую несправедливость —
//    посмотрите что мы нашли для Вас в качестве примера, какой может быть Ваша
//    история." (привлекаем). даём возможность загрузить и настроить сразу.»
//
// Плюс кнопка «Что это?» — открывается StoriesInfoModal (T4).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEMO_STORIES } from './demoStories';
import { StoriesInfoModal } from './StoriesInfoModal';

interface Props {
  /** Нажали на демо-ролик (открыть его крупно) */
  onOpenDemo: (index: number) => void;
}

export function StoriesEmptyState({ onOpenDemo }: Props) {
  const navigate = useNavigate();
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div style={{ padding: '8px 0 24px' }}>
      {/* T1: текст пустого состояния */}
      <div
        className="card"
        style={{
          padding: 24,
          textAlign: 'center',
          maxWidth: 720,
          margin: '0 auto 24px',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
        <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>
          У вас, ваших контактов и ваших чатов пока нет ни одной истории
        </h3>
        <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Или мы не смогли их загрузить. Пока мы исправляем эту вопиющую
          несправедливость — посмотрите, что мы нашли для вас в качестве примера
          того, какой может быть ваша история.
        </p>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
          Истории живут 24 часа, видны только выбранной аудитории и исчезают сами.
        </p>
      </div>

      {/* T2: три предзаписанных видео без слов */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          maxWidth: 880,
          margin: '0 auto 24px',
        }}
      >
        {DEMO_STORIES.map((demo, index) => (
          <div key={demo.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => onOpenDemo(index)}
              style={{
                display: 'block',
                width: '100%',
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                position: 'relative',
              }}
              aria-label={`Посмотреть пример истории: ${demo.title}`}
            >
              <video
                src={demo.src}
                poster={demo.poster}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                style={{ display: 'block', width: '100%', aspectRatio: '9 / 16', objectFit: 'cover', background: '#000' }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 10,
                  bottom: 10,
                  background: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  fontSize: 12,
                  padding: '4px 8px',
                }}
              >
                ▶ Пример
              </span>
            </button>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{demo.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{demo.subtitle}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                {demo.credit}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* T3: сразу можно загрузить и настроить */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate('/stories/create')}
        >
          + Загрузить свою историю
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => navigate('/settings/privacy')}
        >
          ⚙ Настроить приватность
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => setInfoOpen(true)}
        >
          ❓ Что это?
        </button>
      </div>

      <StoriesInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}

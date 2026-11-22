// LearningHelp — панель режима обучения (тик. 1795292000).
// Активируется кликом по заголовку в шапке; показывает подсказки по текущему
// экрану. Закрывается кнопкой или повторным кликом по заголовку.

import React from 'react';
import { useUIStore } from '@/store/uiStore';

interface LearningHelpProps {
  /** Заголовок текущего раздела (для контекстной подсказки) */
  title?: string;
}

const HINTS: { icon: string; text: string }[] = [
  { icon: '🧭', text: 'Логотип слева — меню разделов экосистемы (Balloo, Admin, Features, Docs и т.д.).' },
  { icon: '🏷️', text: 'Заголовок по центру — название раздела. Клик по нему открывает эту справку.' },
  { icon: '⚡', text: 'Кнопки действий рядом с заголовком — быстрые действия текущего экрана.' },
  { icon: '👤', text: 'Аватар справа — профиль, настройки, смена языка и темы, выход.' },
  { icon: '🔔', text: 'Колокольчик — уведомления.' },
];

export function LearningHelp({ title }: LearningHelpProps) {
  const setLearningMode = useUIStore((s) => s.setLearningMode);

  return (
    <div
      className="learning-help"
      role="dialog"
      aria-label="Режим обучения"
      onClick={(e) => {
        if (e.target === e.currentTarget) setLearningMode(false);
      }}
    >
      <div className="learning-help__window">
        <div className="learning-help__header">
          <span className="learning-help__icon">🎓</span>
          <span className="learning-help__title">
            Режим обучения{title ? `: ${title}` : ''}
          </span>
          <button
            type="button"
            className="btn btn--tertiary btn--sm"
            onClick={() => setLearningMode(false)}
            aria-label="Закрыть справку"
          >
            ✕
          </button>
        </div>
        <ul className="learning-help__list">
          {HINTS.map((h) => (
            <li key={h.text} className="learning-help__item">
              <span className="learning-help__item-icon">{h.icon}</span>
              <span>{h.text}</span>
            </li>
          ))}
        </ul>
        <div className="learning-help__footer">
          <span className="text-muted" style={{ fontSize: 12 }}>
            Справка закроется при повторном клике по заголовку
          </span>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => setLearningMode(false)}
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}

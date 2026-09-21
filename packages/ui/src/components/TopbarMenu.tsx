// TopbarMenu — левое меню-дропдаун в лого топбара
// Как в макетах (mockups/assets/common.css: .topbar__logo/.topbar__dropdown):
// лого — это МЕНЮ разделов (Balloo / Admin / Command / Features / History /
// Download / API Docs), а не кнопка перехода на главную.
// Открытие: hover (CSS .topbar__logo:hover .topbar__dropdown) + клик (мобильные).
//
// Вынесено из packages/web в @balloo/ui (тик. №1) и сделано универсальным:
// - НЕ зависит от react-router: переход через onNavigate (SPA) или
//   window.location.href (статические сайты / абсолютные URL поддоменов);
// - items конфигурируются: каждый сайт передаёт свои разделы
//   (после открытия поддоменов — абсолютные URL, см. §3.1 мультитикета).

import React, { useRef, useEffect, useState } from 'react';
import { useI18n } from '../providers/I18nProvider';
import type { TranslationKey } from '@balloo/shared';

export interface TopbarMenuItem {
  key: TranslationKey | string;
  to: string;
  emoji: string;
  dividerBefore?: boolean;
  // Пункт-узел экосистемы (⛓ в макете) — для будущих поддоменов
  isNode?: boolean;
  // Текущий узел (● в макете)
  isCurrent?: boolean;
}

// Разделы по умолчанию — внутренние пути balloo.su (SPA).
// Когда поддомены откроются (тик. №2–№5), web передаст абсолютные URL.
export const DEFAULT_TOPBAR_ITEMS: TopbarMenuItem[] = [
  { key: 'menu.balloo', to: '/chat', emoji: '💬' },
  { key: 'menu.admin', to: '/admin', emoji: '🛡️', dividerBefore: true },
  { key: 'menu.command', to: '/command', emoji: '🏢' },
  { key: 'menu.features', to: '/features', emoji: '💡' },
  { key: 'menu.history', to: '/history', emoji: '📜' },
  { key: 'menu.download', to: '/download', emoji: '⬇️' },
  { key: 'menu.docs', to: '/doc', emoji: '📚' },
];

interface TopbarMenuProps {
  items?: TopbarMenuItem[];
  /** SPA-навигация (например, react-router navigate). Нет — переход location.href. */
  onNavigate?: (to: string) => void;
}

export function TopbarMenu({ items = DEFAULT_TOPBAR_ITEMS, onNavigate }: TopbarMenuProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне меню
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const go = (to: string) => {
    if (onNavigate) {
      onNavigate(to);
    } else {
      // Статический сайт / внешний URL / SPA без роутера
      window.location.href = to;
    }
  };

  return (
    <div
      ref={ref}
      className="topbar__logo"
      onClick={() => setIsOpen((v) => !v)}
      title={t('menu.balloo' as TranslationKey)}
    >
      <div className="topbar__logo-icon">B</div>
      <span>Balloo</span>

      {/* Дропдаун: показывается по hover (CSS) или по клику (мобильные) */}
      <div
        className="topbar__dropdown"
        style={isOpen ? { display: 'block' } : undefined}
      >
        {items.map((item) => (
          <React.Fragment key={String(item.key)}>
            {item.dividerBefore && <div className="topbar__dropdown-divider" />}
            <div
              className={[
                'topbar__dropdown-item',
                item.isNode ? 'topbar__dropdown-item--node' : '',
                item.isNode && item.isCurrent ? 'topbar__dropdown-item--node--current' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                go(item.to);
              }}
            >
              <span>{item.emoji}</span>
              <span>{t(item.key as TranslationKey)}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

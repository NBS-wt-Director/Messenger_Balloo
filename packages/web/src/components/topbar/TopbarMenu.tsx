// TopbarMenu — левое меню-дропдаун в лого топбара (P23)
// Как в макетах (mockups/*/login.html: topbar__dropdown): лого — это МЕНЮ
// разделов (Balloo / Admin / Command / Features / History / Download / API Docs),
// а не кнопка перехода на главную.
// Открытие: hover (CSS .topbar__logo:hover .topbar__dropdown) + клик (мобильные).

import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/components/providers/I18nProvider';

interface TopbarMenuItem {
  key: string;
  to: string;
  emoji: string;
  dividerBefore?: boolean;
}

// Разделы — как в макетах (латиницей, кроме Balloo)
const MENU_ITEMS: TopbarMenuItem[] = [
  { key: 'menu.balloo', to: '/chat', emoji: '💬' },
  { key: 'menu.admin', to: '/admin', emoji: '🛡️', dividerBefore: true },
  { key: 'menu.command', to: '/command', emoji: '🏢' },
  { key: 'menu.features', to: '/features', emoji: '💡' },
  { key: 'menu.history', to: '/history', emoji: '📜' },
  { key: 'menu.download', to: '/download', emoji: '⬇️' },
  { key: 'menu.docs', to: '/doc', emoji: '📚' },
];

export function TopbarMenu() {
  const navigate = useNavigate();
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

  return (
    <div
      ref={ref}
      className="topbar__logo"
      onClick={() => setIsOpen((v) => !v)}
      title={t('menu.balloo')}
    >
      <div className="topbar__logo-icon">B</div>
      <span>Balloo</span>

      {/* Дропдаун: показывается по hover (CSS) или по клику (мобильные) */}
      <div
        className="topbar__dropdown"
        style={isOpen ? { display: 'block' } : undefined}
      >
        {MENU_ITEMS.map((item) => (
          <React.Fragment key={item.key}>
            {item.dividerBefore && <div className="topbar__dropdown-divider" />}
            <div
              className="topbar__dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                navigate(item.to);
              }}
            >
              <span>{item.emoji}</span>
              <span>{t(item.key as any)}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

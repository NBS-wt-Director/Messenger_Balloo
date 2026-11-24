// Footer — ЕДИНЫЙ подвал всех сайтов balloo.su (тик. №1, P35; переработка
// 24.11.2026, тик. 1795507295 — структура по требованию владельца).
//
// Структура (одна строка):
//   [© copy → меню] ···точки··· [Поддержка] ···точки··· [Правила|Конфиденциальность|Cookies]
//
// Меню (клик по copyright): «О компании» (активно), «Контакты»/«О Balloo»/
// «Другие проекты компании» (Позже), «Поддержать нас» (активно).
// Пустые зоны заполнены декоративными «бегущими» точками (.balloo-footer__dots).
// Стили — @balloo/ui/styles/chrome.css.
// Хост-осознанные ссылки (тик. 1794575221): на чужих поддоменах balloo.su
// маршруты правового блока — абсолютные hash-URL (строит ecosystem.ts).

import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../providers/I18nProvider';
import type { TranslationKey } from '@balloo/shared';
import { footerLinksForHost } from './ecosystem';

export interface FooterLink {
  key: TranslationKey | string;
  href: string;
}

// Правовые ссылки по умолчанию (тик. 1795507295): только три пункта —
// «Поддержка» вынесена отдельной ссылкой, «О компании»/«Поддержать нас» — в меню.
export const DEFAULT_FOOTER_LINKS: FooterLink[] = footerLinksForHost();

/** Пункты меню подвала (тик. 1795507295). soon=true → неактивный «(Позже)». */
export const FOOTER_MENU_ITEMS: { key: string; label: string; href?: string; soon?: boolean }[] = [
  { key: 'about-company', label: 'О компании', href: '/about-company' },
  { key: 'contacts', label: 'Контакты', soon: true },
  { key: 'about-balloo', label: 'О Balloo', soon: true },
  { key: 'other-projects', label: 'Другие проекты компании', soon: true },
  { key: 'donate', label: 'Поддержать нас', href: '/donat' },
];

interface FooterProps {
  /** Ссылки правового блока (default: Правила/Конфиденциальность/Cookies) */
  links?: FooterLink[];
  /** Клик по copyright (если задан — меню не открывается) */
  onCopyrightClick?: () => void;
}

export function Footer({ links = DEFAULT_FOOTER_LINKS, onCopyrightClick }: FooterProps) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const leftRef = useRef<HTMLDivElement>(null);

  // Закрытие меню по клику вне и по Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (leftRef.current && !leftRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleCopyClick = () => {
    if (onCopyrightClick) {
      onCopyrightClick();
      return;
    }
    setMenuOpen((v) => !v);
  };

  return (
    <footer className="balloo-footer">
      <div className="balloo-footer__left" ref={leftRef}>
        <button
          type="button"
          className="balloo-footer__copyright"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={handleCopyClick}
        >
          © Balloo Messenger 2026
        </button>

        {menuOpen && (
          <div className="balloo-footer__menu" role="menu">
            {FOOTER_MENU_ITEMS.map((item) =>
              item.soon ? (
                <span
                  key={item.key}
                  className="balloo-footer__menu-item balloo-footer__menu-item--soon"
                  role="menuitem"
                  aria-disabled="true"
                >
                  {item.label} <em>(Позже)</em>
                </span>
              ) : (
                <a key={item.key} className="balloo-footer__menu-item" role="menuitem" href={item.href}>
                  {item.label}
                </a>
              ),
            )}
          </div>
        )}
      </div>

      <span className="balloo-footer__dots" aria-hidden="true">
        <i /><i /><i />
      </span>

      <a className="balloo-footer__link" href="/support">
        {t('footer.support' as TranslationKey)}
      </a>

      <span className="balloo-footer__dots" aria-hidden="true">
        <i /><i /><i />
      </span>

      <div className="balloo-footer__links">
        {links.map((link) => (
          <a key={String(link.key)} className="balloo-footer__link" href={link.href}>
            {t(link.key as TranslationKey)}
          </a>
        ))}
      </div>
    </footer>
  );
}

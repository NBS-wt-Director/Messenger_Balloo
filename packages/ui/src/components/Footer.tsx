// Footer — ЕДИНЫЙ подвал всех сайтов balloo.su (тик. №1, P35; переработка
// 24.11.2026, тик. 1795507295 — структура по требованию владельца).
//
// Структура (одна строка):
//   [© copy → меню] ···точки··· [Поддержка] ···точки··· [Правила|Конфиденциальность|Cookies]
//
// Меню (клик по copyright): «О компании» и «Поддержать нас» — рабочие экраны;
// «Контакты» и «Другие проекты компании» — заглушка «Экран в разработке»
// (требование владельца 24.11.2026: пункты активны, а не «(Позже)»).
// Пустые зоны заполнены декоративными «бегущими» точками (.balloo-footer__dots).
// Стили — @balloo/ui/styles/chrome.css.
// Хост-осознанные ссылки (тик. 1794575221): на чужих поддоменах balloo.su
// маршруты правового блока — абсолютные hash-URL (строит ecosystem.ts).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../providers/I18nProvider';
import type { TranslationKey } from '@balloo/shared';
import { footerLinksForHost, mainSiteUrl } from './ecosystem';
import { FooterMorseTicker } from './FooterMorseTicker';
import { useFooterTickerStore } from '../store/footerTickerStore';
import { formatTimeZoneCity } from '../lib/locale';

export interface FooterLink {
  key: TranslationKey | string;
  href: string;
}

// Правовые ссылки по умолчанию (тик. 1795507295): только три пункта —
// «Поддержка» вынесена отдельной ссылкой, «О компании»/«Поддержать нас» — в меню.
export const DEFAULT_FOOTER_LINKS: FooterLink[] = footerLinksForHost();

/** Пункты меню подвала (тик. 1795507295). Готовые — свой маршрут, неготовые — заглушка. */
const comingSoon = (name: string) => `/coming-soon?name=${encodeURIComponent(name)}`;

export const FOOTER_MENU_ITEMS: { key: string; label: string; href: string }[] = [
  { key: 'about-company', label: 'О компании', href: '/about-company' },
  { key: 'contacts', label: 'Контакты', href: comingSoon('Контакты') },
  { key: 'about-balloo', label: 'О Balloo', href: '/about-balloo' },
  { key: 'other-projects', label: 'Другие проекты компании', href: comingSoon('Другие проекты компании') },
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

  // Морзе-тикер (тик. 1795677854): idle → слоган + часовой пояс/город,
  // активное уведомление → источник/тело (store с приоритетами).
  const tickerMode = useFooterTickerStore((s) => s.mode);
  const tickerLeft = useFooterTickerStore((s) => s.left);
  const tickerRight = useFooterTickerStore((s) => s.right);
  const tzCity = useMemo(() => formatTimeZoneCity(), []);
  const isIdle = tickerMode === 'idle';
  const leftText = isIdle ? t('footer.slogan' as TranslationKey) : tickerLeft;
  const rightText = isIdle ? tzCity : tickerRight;
  const tickerVariant = tickerMode === 'emergency' ? 'emergency' : 'default';

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
            {FOOTER_MENU_ITEMS.map((item) => (
              <a
                key={item.key}
                className="balloo-footer__menu-item"
                role="menuitem"
                href={mainSiteUrl(item.href)}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <FooterMorseTicker text={leftText} direction="ltr" variant={tickerVariant} />

      <a className="balloo-footer__link" href="/support">
        {t('footer.support' as TranslationKey)}
      </a>

      <FooterMorseTicker text={rightText} direction="rtl" variant={tickerVariant} />

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

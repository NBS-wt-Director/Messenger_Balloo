// Footer — ЕДИНЫЙ подвал всех сайтов balloo.su (тик. №1, P35)
// Структура по макетам (mockups/assets/common.css: .balloo-footer):
//   [© Balloo Messenger 2026] ......... [Правила | Конфиденциальность | Cookies]
// Стили — @balloo/ui/styles/chrome.css (копия .balloo-footer* из common.css).

import React from 'react';
import { useI18n } from '../providers/I18nProvider';
import type { TranslationKey } from '@balloo/shared';

export interface FooterLink {
  key: TranslationKey | string;
  href: string;
}

// Правовые ссылки по умолчанию (внутренние маршруты balloo.su)
export const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  { key: 'footer.rules', href: '/rules' },
  { key: 'footer.privacy', href: '/privacy' },
  { key: 'footer.cookies', href: '/cookies' },
];

interface FooterProps {
  /** Ссылки правового блока (default: Правила/Конфиденциальность/Cookies) */
  links?: FooterLink[];
  /** Клик по copyright (в макетах — about); нет — не кликабелен */
  onCopyrightClick?: () => void;
}

export function Footer({ links = DEFAULT_FOOTER_LINKS, onCopyrightClick }: FooterProps) {
  const { t } = useI18n();

  return (
    <footer className="balloo-footer">
      <div className="balloo-footer__left">
        <span
          className="balloo-footer__copyright"
          onClick={onCopyrightClick}
          style={onCopyrightClick ? undefined : { cursor: 'default' }}
        >
          © Balloo Messenger 2026
        </span>
      </div>
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

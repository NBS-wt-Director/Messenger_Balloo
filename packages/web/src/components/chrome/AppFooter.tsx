// AppFooter — web-обёртка единого подвала из @balloo/ui (P35, тикет №1)
// Footer из @balloo/ui (классы .balloo-footer из common.css) + SPA-навигация:
// клики по правовым ссылкам перехватываются и идут через react-router,
// без полной перезагрузки страницы.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, DEFAULT_FOOTER_LINKS, type FooterLink } from '@balloo/ui';

interface AppFooterProps {
  links?: FooterLink[];
  onCopyrightClick?: () => void;
}

export function AppFooter({ links = DEFAULT_FOOTER_LINKS, onCopyrightClick }: AppFooterProps) {
  const navigate = useNavigate();

  // SPA-навигация: <a href="/rules"> → navigate('/rules')
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      e.preventDefault();
      navigate(href);
    }
  };

  return (
    <div onClick={handleClick}>
      <Footer links={links} onCopyrightClick={onCopyrightClick} />
    </div>
  );
}

// PageChrome — P35: единая шапка/подвал для одиночных страниц-маршрутов
// (features/history/download детальные экраны, landing, 404).
// Структура: AppTopbar → скролл-контент (flex:1) → AppFooter.
// footer={false} — для экранов без подвала по макету (например, 404).

import React from 'react';
import { AppTopbar } from './AppTopbar';
import { AppFooter } from './AppFooter';

interface PageChromeProps {
  /** Заголовок раздела (.topbar__title) */
  title?: string;
  /** Доп. контент справа (маскот, аватар) */
  right?: React.ReactNode;
  /** Показывать подвал (default: true; 404 по макету — без подвала) */
  footer?: boolean;
  children: React.ReactNode;
}

export function PageChrome({ title, right, footer = true, children }: PageChromeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppTopbar title={title} right={right} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
      {footer && <AppFooter />}
    </div>
  );
}

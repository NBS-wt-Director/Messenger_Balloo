// StandaloneChrome — единые шапка и подвал для отдельных SPA-узлов
// (history.balloo.su, download.balloo.su и т.п.), у которых нет своего
// MainLayout. Тик. 1795683301, требование U1: узел НЕ рисует свою шапку/подвал,
// а берёт их из @balloo/ui.
//
// Структура: Topbar → контент (flex:1, скролл) → Footer.
// Полоса прокрутки скрыта глобальными стилями узла (требование U2).

import React from 'react';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

export interface StandaloneChromeProps {
  /** Заголовок раздела в центре шапки */
  title?: string;
  children: React.ReactNode;
}

export function StandaloneChrome({ title, children }: StandaloneChromeProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Topbar title={title} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
      <Footer />
    </div>
  );
}

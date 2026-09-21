// Topbar — ЕДИНАЯ шапка всех сайтов balloo.su (тик. №1, P35)
// Структура по макетам (mockups/assets/common.css: .topbar):
//   [лого-меню (TopbarMenu)] [заголовок раздела (.topbar__title)] [правый блок (.topbar__right)]
// Правый блок: произвольный контент сайта (аватар, колокольчик, маскот) +
// переключатели языка и темы (общий контракт).
//
// Стили — @balloo/ui/styles/chrome.css (копия .topbar* из common.css).

import React from 'react';
import { TopbarMenu, type TopbarMenuItem } from './TopbarMenu';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';

interface TopbarProps {
  /** Заголовок раздела (центр, .topbar__title) */
  title?: string;
  /** Клик по заголовку (в макетах — режим обучения); нет — заголовок не кликабелен */
  onTitleClick?: () => void;
  /** Доп. контекст справа ПЕРЕД переключателями (аватар, уведомления, маскот) */
  right?: React.ReactNode;
  /** Показывать ли переключатели языка/темы (default: true) */
  showSwitchers?: boolean;
  /** Пункты меню лого (default: разделы balloo.su) */
  menuItems?: TopbarMenuItem[];
  /** SPA-навигация для пунктов меню (react-router navigate); нет — location.href */
  onNavigate?: (to: string) => void;
}

export function Topbar({
  title,
  onTitleClick,
  right,
  showSwitchers = true,
  menuItems,
  onNavigate,
}: TopbarProps) {
  return (
    <header className="topbar">
      <TopbarMenu items={menuItems} onNavigate={onNavigate} />

      {title && (
        <div
          className="topbar__title"
          onClick={onTitleClick}
          style={onTitleClick ? undefined : { cursor: 'default' }}
        >
          {title}
        </div>
      )}

      <div className="topbar__right">
        {right}
        {showSwitchers && (
          <>
            <LanguageSwitcher />
            <ThemeSwitcher />
          </>
        )}
      </div>
    </header>
  );
}

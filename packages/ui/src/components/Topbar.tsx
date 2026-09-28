// Topbar — ЕДИНАЯ шапка всех сайтов balloo.su (тик. №1, P35)
// Структура по макетам (mockups/assets/common.css: .topbar):
//   [лого-меню (TopbarMenu)] [заголовок раздела (.topbar__title)] [правый блок (.topbar__right)]
// Правый блок: произвольный контент сайта (аватар, колокольчик, маскот) +
// переключатели языка и темы (общий контракт).
//
// Стили — @balloo/ui/styles/chrome.css (копия .topbar* из common.css).

import React from 'react';
import { TopbarMenu, type TopbarMenuItem } from './TopbarMenu';
import { RightMenu, type RightMenuAuth } from './RightMenu';

interface TopbarProps {
  /** Заголовок раздела (центр, .topbar__title) */
  title?: string;
  /** Клик по заголовку (в макетах — режим обучения); нет — заголовок не кликабелен */
  onTitleClick?: () => void;
  /** Доп. контекст справа ПЕРЕД переключателями (аватар, уведомления, маскот) */
  right?: React.ReactNode;
  /** Показывать ли правое меню (default: true) */
  showSwitchers?: boolean;
  /** Авторизация для RightMenu (автор/настройки/аккаунты/войти-выйти) */
  auth?: RightMenuAuth;
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
  auth,
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
          <RightMenu
            auth={auth?.isAuthenticated ? 'user' : 'guest'}
            userInitials={auth?.initials}
            onLogout={auth?.onLogout}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </header>
  );
}

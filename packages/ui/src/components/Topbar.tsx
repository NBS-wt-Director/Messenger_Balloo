// Topbar — ЕДИНАЯ шапка всех сайтов balloo.su (тик. №1, P35)
// Структура по макетам (mockups/assets/common.css: .topbar):
//   [лого-меню (TopbarMenu)] [заголовок раздела (.topbar__title)] [правый блок (.topbar__right)]
// Правый блок: контент сайта (колокольчик/кнопки) + ДВА правых меню
// (решение владельца 22.11.2026):
//   • частное (PrivateRightMenu) — только авторизованному, триггер-аватарка/лого;
//   • общее (RightMenu) — всем, триггер-маскот, самое правое.
//
// Стили — @balloo/ui/styles/chrome.css (копия .topbar* из common.css).

import React from 'react';
import { TopbarMenu, type TopbarMenuItem } from './TopbarMenu';
import { RightMenu, PrivateRightMenu, type RightMenuAuth } from './RightMenu';

interface TopbarProps {
  /** Заголовок раздела (центр, .topbar__title). ReactNode — чтобы вместить
   *  бегущую строку уведомления (тик. 1795292000). */
  title?: React.ReactNode;
  /** Клик по заголовку (в макетах — режим обучения); нет — заголовок не кликабелен */
  onTitleClick?: () => void;
  /** Доп. контекст справа ПЕРЕД меню (колокольчик, кнопки) */
  right?: React.ReactNode;
  /** Кнопки-действия раздела (.topbar__actions) — между заголовком и правым блоком */
  actions?: React.ReactNode;
  /** Показывать ли общее меню (default: true) */
  showSwitchers?: boolean;
  /** Авторизация для правых меню (частное + аккаунт/вход-выход в общем) */
  auth?: RightMenuAuth;
  /** Пункты меню лого (default: разделы balloo.su) */
  menuItems?: TopbarMenuItem[];
  /** SPA-навигация для пунктов меню (react-router navigate); нет — location.href */
  onNavigate?: (to: string) => void;
  /**
   * Контент перед лого-меню (кнопка «скрыть/открыть панель», тик. 1795721513).
   * Сайты без левой панели не передают — шапка не меняется.
   */
  leading?: React.ReactNode;
}

export function Topbar({
  title,
  onTitleClick,
  right,
  actions,
  showSwitchers = true,
  auth,
  menuItems,
  onNavigate,
  leading,
}: TopbarProps) {
  return (
    <header className="topbar">
      {leading && <div className="topbar__leading">{leading}</div>}

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

      {/* Кнопки-действия раздела (по макету: .topbar__actions перед .topbar__right) */}
      {actions && <div className="topbar__actions">{actions}</div>}

      <div className="topbar__right">
        {right}
        {/* Частное меню — только авторизованному */}
        {auth?.isAuthenticated && (
          <PrivateRightMenu
            initials={auth.initials}
            avatarUrl={auth.avatarUrl}
            balancePoints={auth.balancePoints}
            storiesBadge={auth.storiesBadge}
            isAdmin={auth.isAdmin}
            onNavigate={onNavigate}
          />
        )}
        {/* Общее меню — всем, самое правое */}
        {showSwitchers && (
          <RightMenu
            auth={auth?.isAuthenticated ? 'user' : 'guest'}
            onLogout={auth?.onLogout}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </header>
  );
}

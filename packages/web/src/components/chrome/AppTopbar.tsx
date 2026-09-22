// AppTopbar — web-обёртка единой шапки из @balloo/ui (P35, тикет №1)
// Topbar из @balloo/ui + SPA-навигация react-router для лого-меню разделов.
// ЕДИНАЯ шапка всех экранов balloo.su (по макетам: .topbar из common.css).

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '@balloo/ui';

interface AppTopbarProps {
  /** Заголовок раздела (центр, .topbar__title) */
  title?: string;
  /** Клик по заголовку (режим обучения в макетах) */
  onTitleClick?: () => void;
  /** Доп. контент справа ПЕРЕД переключателями (аватар, колокольчик, маскот) */
  right?: React.ReactNode;
  /** Показывать переключатели языка/темы (default: true) */
  showSwitchers?: boolean;
}

export function AppTopbar({ title, onTitleClick, right, showSwitchers = true }: AppTopbarProps) {
  const navigate = useNavigate();
  return (
    <Topbar
      title={title}
      onTitleClick={onTitleClick}
      right={right}
      showSwitchers={showSwitchers}
      onNavigate={navigate}
    />
  );
}

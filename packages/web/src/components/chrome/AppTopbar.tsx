// AppTopbar — web-обёртка единой шапки из @balloo/ui (P35, тикет №1)
// Topbar из @balloo/ui + SPA-навигация react-router для лого-меню разделов.
// ЕДИНАЯ шапка всех экранов balloo.su (по макетам: .topbar из common.css).

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar, type RightMenuAuth } from '@balloo/ui';
import { useAuthStore } from '@/store/authStore';

interface AppTopbarProps {
  /** Заголовок раздела (центр, .topbar__title) */
  title?: string;
  /** Клик по заголовку (режим обучения в макетах) */
  onTitleClick?: () => void;
  /** Доп. контент справа ПЕРЕД переключателями (аватар, колокольчик, маскот) */
  right?: React.ReactNode;
  /** Показывать переключатели языка/темы (default: true) */
  showSwitchers?: boolean;
  /**
   * Авторизация для правого меню. По умолчанию берётся из authStore —
   * раньше не прокидывалась вовсе, и RightMenu всегда рисовал гостевой
   * вариант (маскот + «Войти/Регистрация») даже у вошедшего пользователя.
   * Явным `auth={null}` можно принудительно вернуть гостевой вид.
   */
  auth?: RightMenuAuth | null;
}

/** Инициалы как в мокапе: первые буквы имени и фамилии (common.js — «ИИ»). */
function initialsOf(user: { displayName?: string; username: string } | null): string {
  if (!user) return 'ИИ';
  const parts = (user.displayName || user.username || '').trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
  return letters || (user.username[0]?.toUpperCase() ?? 'ИИ');
}

export function AppTopbar({ title, onTitleClick, right, showSwitchers = true, auth }: AppTopbarProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // auth === undefined — из стора; auth === null — гость принудительно.
  const menuAuth: RightMenuAuth | undefined =
    auth === undefined
      ? {
          isAuthenticated,
          initials: initialsOf(user),
          onLogout: () => {
            logout();
            navigate('/');
          },
        }
      : auth ?? undefined;

  return (
    <Topbar
      title={title}
      onTitleClick={onTitleClick}
      right={right}
      showSwitchers={showSwitchers}
      auth={menuAuth}
      onNavigate={navigate}
    />
  );
}

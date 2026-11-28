// AppTopbar — web-обёртка единой шапки из @balloo/ui (P35, тикет №1;
// тик. 1795292000 — единая шапка на всех экранах).
// Topbar из @balloo/ui + SPA-навигация react-router для лого-меню разделов.
// ЕДИНАЯ шапка всех экранов balloo.su (по макетам: .topbar из common.css).
//
// Отвечает за:
//   • заголовок раздела (по центру) — кликабельная кнопка;
//   • контент правого блока ПЕРЕД меню:
//       авторизован — колокольчик уведомлений;
//       гость       — кнопка «Войти»;
//   • передачу авторизации в Topbar для ДВУХ правых меню (тик. 1795292000):
//       частное (PrivateRightMenu) — аватарка/логотип, только авторизованному;
//       общее (RightMenu) — маскот, всем, самое правое;
//   • бегущую строку уведомления вместо заголовка на время показа;
//   • активацию режима обучения по клику на заголовок.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar, type RightMenuAuth } from '@balloo/ui';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useStoriesStore } from '@/store/storiesStore';
import { NotificationsBell } from '@/components/topbar/NotificationsBell';
import { LearningHelp } from './LearningHelp';

interface AppTopbarProps {
  /** Заголовок раздела (центр, .topbar__title) */
  title?: string;
  /** Клик по заголовку. По умолчанию — активация режима обучения. */
  onTitleClick?: () => void;
  /**
   * Контент правого блока ПЕРЕД правыми меню. Если не задан — строится
   * автоматически: колокольчик (авторизован) или кнопка «Войти» (гость).
   * Два правых меню (частное/общее) рисует Topbar (тик. 1795292000).
   */
  right?: React.ReactNode;
  /** Кнопки-действия раздела (.topbar__actions) — Истории/Приглашения и т.п. */
  actions?: React.ReactNode;
  /** Показывать общее меню (default: true) */
  showSwitchers?: boolean;
  /**
   * Авторизация для правых меню. По умолчанию берётся из authStore.
   * Явным `auth={null}` можно принудительно вернуть гостевой вид.
   */
  auth?: RightMenuAuth | null;
  /**
   * Переключатель левой панели (тик. 1795721513). Передаётся только экранами,
   * у которых есть панель: кнопка `☰` остаётся доступной и при свёрнутой панели.
   */
  onToggleSidebar?: () => void;
  /** Текущее состояние панели — для `aria-expanded` и подписи кнопки */
  sidebarOpen?: boolean;
}

/** Инициалы как в мокапе: первые буквы имени и фамилии (common.js — «ИИ»). */
function initialsOf(user: { displayName?: string; username: string } | null): string {
  if (!user) return 'ИИ';
  const parts = (user.displayName || user.username || '').trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
  // username может быть null (регистрация без username) — fallback на 'ИИ',
  // иначе падение всего топа (e2e mvp1-04, TypeError Cannot read properties of null)
  return letters || (user.username?.[0]?.toUpperCase() ?? 'ИИ');
}

export function AppTopbar({
  title,
  onTitleClick,
  right,
  actions,
  showSwitchers = true,
  auth,
  onToggleSidebar,
  sidebarOpen,
}: AppTopbarProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const learningMode = useUIStore((s) => s.learningMode);
  const toggleLearningMode = useUIStore((s) => s.toggleLearningMode);
  const notice = useUIStore((s) => s.notice);
  const showNotice = useUIStore((s) => s.showNotice);
  // U10: точка «есть новые истории» на аватарке правого меню
  const hasUnviewedStories = useStoriesStore((s) => s.hasUnviewed);

  // auth === undefined — из стора; auth === null — гость принудительно.
  const menuAuth: RightMenuAuth | undefined =
    auth === undefined
      ? {
          isAuthenticated,
          initials: initialsOf(user),
          avatarUrl: user?.avatarUrl ?? null,
          balancePoints: user?.balancePoints,
          storiesBadge: hasUnviewedStories,
          // Тик. 1795888510: пункт «Админ-панель» в частном меню — только
          // пользователям с ролью admin/superadmin (сервер отдаёт isAdmin).
          isAdmin: !!user?.isAdmin,
          onLogout: () => {
            logout();
            navigate('/');
          },
        }
      : auth ?? undefined;

  const authed = Boolean(auth ? auth.isAuthenticated : isAuthenticated);

  // Контент правого блока ПЕРЕД правыми меню: явный `right` побеждает; иначе —
  // колокольчик (авторизован) или кнопка «Войти» (гость). Два правых меню
  // (частное с аватаркой и общее с маскотом) рисует Topbar (тик. 1795292000).
  const rightBlock =
    right !== undefined ? (
      right
    ) : authed ? (
      <NotificationsBell />
    ) : (
      <button
        type="button"
        className="topbar__login-btn btn btn--primary btn--sm"
        onClick={() => navigate('/login')}
      >
        Войти
      </button>
    );

  // Клик по заголовку: режим обучения + бегущая строка уведомления,
  // после показа заголовок возвращается (тик. 1795292000).
  const handleTitleClick = () => {
    if (onTitleClick) {
      onTitleClick();
      return;
    }
    const next = !learningMode;
    toggleLearningMode();
    if (next) {
      showNotice(
        'Режим обучения включён — нажмите на элементы интерфейса, чтобы узнать их назначение',
        6000
      );
    }
  };

  // Пока идёт бегущая строка — она заменяет заголовок.
  const titleNode = notice ? (
    <span className="topbar__ticker" role="status" aria-live="polite">
      <span className="topbar__ticker-inner">{notice}</span>
    </span>
  ) : (
    title
  );

  // Кнопка «скрыть/открыть панель» (тик. 1795721513). Живёт в шапке, а не в
  // самой панели: иначе при свёрнутой панели вернуть её нечем.
  const leading = onToggleSidebar ? (
    <button
      type="button"
      className="topbar__sidebar-btn"
      onClick={onToggleSidebar}
      aria-expanded={sidebarOpen ?? false}
      aria-controls="app-sidebar"
      aria-label={sidebarOpen ? 'Скрыть панель' : 'Открыть панель'}
      title={sidebarOpen ? 'Скрыть панель' : 'Открыть панель'}
    >
      {sidebarOpen ? '⟨' : '☰'}
    </button>
  ) : undefined;

  return (
    <>
      <Topbar
        title={titleNode}
        onTitleClick={handleTitleClick}
        right={rightBlock}
        actions={actions}
        showSwitchers={showSwitchers}
        auth={menuAuth}
        onNavigate={navigate}
        leading={leading}
      />
      {learningMode && <LearningHelp title={typeof title === 'string' ? title : undefined} />}
    </>
  );
}

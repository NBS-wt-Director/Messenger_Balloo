// AdminLayout — лейаут админ-панели
// Sidebar + breadcrumbs + user info + outlet
// P35: единая шапка (@balloo/ui) — Topbar с лого-меню и breadcrumb в title

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';

// Sidebar navigation items
const NAV_ITEMS = [
  { path: '/', label: 'Дашборд', icon: '📊', exact: true },
  { path: '/users', label: 'Пользователи', icon: '👤' },
  { path: '/reports', label: 'Жалобы', icon: '🚩' },
  { path: '/support', label: 'Поддержка', icon: '🛠️' },
  { path: '/bans', label: 'Баны', icon: '🔨' },
  { path: '/analytics', label: 'Метрики', icon: '📈' },
  { path: '/feature-flags', label: 'Feature Flags', icon: '🎛️' },
  { path: '/announcements', label: 'Объявления', icon: '📢' },
  { path: '/downloads', label: 'Файлы', icon: '📁' },
  { path: '/texts', label: 'Тексты', icon: '📝' },
  { separator: true },
  { path: '/departments', label: 'Отделы', icon: '🏢' },
  { path: '/employees', label: 'Сотрудники', icon: '👤' },
  { path: '/vacancies', label: 'Вакансии', icon: '💼' },
  { path: '/versions', label: 'Версии', icon: '📜' },
  { path: '/features', label: 'Фичи (модерация)', icon: '💡' },
  { path: '/donations', label: 'Донаты', icon: '💚' },
  { separator: true },
  { path: '/blog/queue', label: 'Блог: Очередь', icon: '📝' },
  { path: '/blog/channels', label: 'Блог: Каналы', icon: '📡' },
  { path: '/blog/categories', label: 'Блог: Категории', icon: '🏷️' },
  { separator: true },
  { path: '/audit-logs', label: 'Логи действий', icon: '📋' },
  { path: '/system-settings', label: 'Настройки системы', icon: '⚙️' },
];

// Breadcrumb mapping
const BREADCRUMBS: Record<string, string> = {
  '/': 'Дашборд',
  '/users': 'Пользователи',
  '/reports': 'Жалобы',
  '/support': 'Поддержка',
  '/bans': 'Баны и обжалования',
  '/analytics': 'Метрики',
  '/feature-flags': 'Feature Flags',
  '/announcements': 'Объявления',
  '/downloads': 'Файлы',
  '/texts': 'Тексты',
  '/departments': 'Отделы',
  '/employees': 'Сотрудники',
  '/vacancies': 'Вакансии',
  '/versions': 'Версии',
  '/features': 'Фичи (модерация)',
  '/donations': 'Донаты',
  '/blog/queue': 'Блог: Очередь',
  '/blog/channels': 'Блог: Каналы',
  '/blog/categories': 'Блог: Категории',
  '/audit-logs': 'Логи действий',
  '/system-settings': 'Настройки системы',
  '/install': 'Установка',
};

export function AdminLayout() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Доступ проверяет AdminGuard (обёртка в App.tsx). Дублировать проверку
  // здесь не нужно: прежний navigate('/login') вёл на несуществующий маршрут
  // и давал 404 (тикет 1793259599).

  const currentPath = location.pathname;

  // Determine breadcrumb — handle dynamic routes
  let breadcrumb = BREADCRUMBS[currentPath] || 'Админ-панель';
  if (currentPath.match(/^\/users\/[^/]+$/)) {
    breadcrumb = 'Профиль пользователя';
  }

  // Determine if a nav item is active
  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if ('separator' in item && item.separator) return false;
    if ('exact' in item && item.exact) {
      return currentPath === item.path;
    }
    return currentPath.startsWith(item.path || '');
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--app-bg)',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 220,
          minWidth: 220,
          height: '100%',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              background: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            A
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            Admin
          </span>
        </div>

        {/* Navigation */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {NAV_ITEMS.map((item, index) => {
            if ('separator' in item && item.separator) {
              return (
                <div
                  key={`sep-${index}`}
                  style={{
                    height: 1,
                    background: 'var(--border-color)',
                    margin: '8px 16px',
                  }}
                />
              );
            }

            const active = isActive(item);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path!)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 20px',
                  border: 'none',
                  background: active ? 'var(--bg-tertiary)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  fontFamily: 'var(--font-primary)',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User info */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {(user?.displayName || user?.username || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.displayName || user?.username || 'Admin'}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              🛡️ Администратор
            </div>
          </div>
          <button
            onClick={logout}
            title="Выйти"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              color: 'var(--text-muted)',
              padding: 4,
            }}
          >
            🚪
          </button>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* P35: единая шапка (@balloo/ui) — лого-меню + breadcrumb в title */}
        <AppTopbar title={`Admin / ${breadcrumb}`} />

        {/* Page content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 24,
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
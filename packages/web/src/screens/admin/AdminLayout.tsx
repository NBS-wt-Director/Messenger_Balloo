// AdminLayout — лейаут админ-панели
// Sidebar + breadcrumbs + user info + outlet

import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

// Sidebar navigation items
const NAV_ITEMS = [
  { path: '/admin', label: 'Дашборд', icon: '📊', exact: true },
  { path: '/admin/users', label: 'Пользователи', icon: '👤' },
  { path: '/admin/reports', label: 'Жалобы', icon: '🚩' },
  { path: '/admin/bans', label: 'Баны', icon: '🔨' },
  { path: '/admin/analytics', label: 'Метрики', icon: '📈' },
  { path: '/admin/feature-flags', label: 'Feature Flags', icon: '🎛️' },
  { path: '/admin/announcements', label: 'Объявления', icon: '📢' },
  { path: '/admin/downloads', label: 'Файлы', icon: '📁' },
  { path: '/admin/texts', label: 'Тексты', icon: '📝' },
  { separator: true },
  { path: '/admin/departments', label: 'Отделы', icon: '🏢' },
  { path: '/admin/employees', label: 'Сотрудники', icon: '👤' },
  { path: '/admin/vacancies', label: 'Вакансии', icon: '💼' },
  { path: '/admin/versions', label: 'Версии', icon: '📜' },
  { path: '/admin/features', label: 'Фичи (модерация)', icon: '💡' },
  { path: '/admin/donations', label: 'Донаты', icon: '💚' },
  { separator: true },
  { path: '/admin/blog/queue', label: 'Блог: Очередь', icon: '📝' },
  { path: '/admin/blog/channels', label: 'Блог: Каналы', icon: '📡' },
  { path: '/admin/blog/categories', label: 'Блог: Категории', icon: '🏷️' },
  { separator: true },
  { path: '/admin/audit-logs', label: 'Логи действий', icon: '📋' },
  { path: '/admin/system-settings', label: 'Настройки системы', icon: '⚙️' },
];

// Breadcrumb mapping
const BREADCRUMBS: Record<string, string> = {
  '/admin': 'Дашборд',
  '/admin/users': 'Пользователи',
  '/admin/reports': 'Жалобы',
  '/admin/bans': 'Баны и обжалования',
  '/admin/analytics': 'Метрики',
  '/admin/feature-flags': 'Feature Flags',
  '/admin/announcements': 'Объявления',
  '/admin/downloads': 'Файлы',
  '/admin/texts': 'Тексты',
  '/admin/departments': 'Отделы',
  '/admin/employees': 'Сотрудники',
  '/admin/vacancies': 'Вакансии',
  '/admin/versions': 'Версии',
  '/admin/features': 'Фичи (модерация)',
  '/admin/donations': 'Донаты',
  '/admin/blog/queue': 'Блог: Очередь',
  '/admin/blog/channels': 'Блог: Каналы',
  '/admin/blog/categories': 'Блог: Категории',
  '/admin/audit-logs': 'Логи действий',
  '/admin/system-settings': 'Настройки системы',
  '/admin/install': 'Установка',
};

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  // Check if user is admin
  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const currentPath = location.pathname;

  // Determine breadcrumb — handle dynamic routes
  let breadcrumb = BREADCRUMBS[currentPath] || 'Админ-панель';
  if (currentPath.match(/^\/admin\/users\/[^/]+$/)) {
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

  const handleThemeToggle = () => {
    const themes: Array<'dark' | 'light' | 'russian'> = ['dark', 'light', 'russian'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const themeIcons: Record<string, string> = {
    dark: '🌙',
    light: '☀️',
    russian: '🇷🇺',
  };

  const themeLabels: Record<string, string> = {
    dark: 'Тёмная',
    light: 'Светлая',
    russian: 'Русская',
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
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
        {/* Topbar */}
        <div
          style={{
            height: 56,
            minHeight: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 24px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
          }}
        >
          {/* Breadcrumbs */}
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Admin</span>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {breadcrumb}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Theme toggle */}
          <button
            onClick={handleThemeToggle}
            title={`Тема: ${themeLabels[theme]}`}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: 13,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-primary)',
            }}
          >
            <span>{themeIcons[theme]}</span>
            <span>{themeLabels[theme]}</span>
          </button>
        </div>

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
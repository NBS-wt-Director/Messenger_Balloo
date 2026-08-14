// Command Layout — Портал сотрудников (command.balloo.su)
// Sidebar навигация, topbar, основной контент

import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  icon: string;
  label: string;
  path: string;
  section?: string;
}

const navItems: NavItem[] = [
  { icon: '🏠', label: 'Дашборд', path: '/command' },
  { icon: '💬', label: 'Внутренний чат', path: '/command/chat' },
  { icon: '📅', label: 'Совещания', path: '/command/meetings' },
  { icon: '📋', label: 'Задачи', path: '/command/tasks' },
  { icon: '🏢', label: 'Мой отдел', path: '/command/my-department' },
  { icon: '🏛️', label: 'Подразделения', path: '/command/departments' },
  { icon: '👥', label: 'HR', path: '/command/hr' },
  { icon: '📚', label: 'База знаний', path: '/command/knowledge' },
  { icon: '🎯', label: 'Найм', path: '/command/hiring' },
  { icon: '📊', label: 'Мониторинг', path: '/command/monitoring' },
  { icon: '📝', label: 'Блог', path: '/command/blog', section: 'Блог' },
  { icon: '💼', label: 'Вакансии', path: '/command/vacancies', section: 'Найм' },
  { icon: '⭐', label: 'Почему мы', path: '/command/why-us' },
  { icon: '⚙️', label: 'Настройки', path: '/command/settings' },
];

const sectionLabels: Record<string, string[]> = {
  'Основное': ['Дашборд', 'Внутренний чат', 'Совещания', 'Задачи'],
  'Управление': ['Мой отдел', 'Подразделения', 'HR', 'База знаний', 'Найм', 'Мониторинг'],
  'Блог': ['Блог'],
  'Найм': ['Вакансии', 'Почему мы'],
};

export function CommandLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const groupedNavItems = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.section || 'Основное']) acc[item.section || 'Основное'] = [];
    acc[item.section || 'Основное'].push(item);
    return acc;
  }, {});

  return (
    <div className="command-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: 8,
          left: 8,
          zIndex: 1000,
          width: 40,
          height: 40,
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontSize: 20,
          cursor: 'pointer',
        }}
        aria-label="Меню"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`command-sidebar ${sidebarOpen ? '' : 'collapsed'} ${mobileSidebarOpen ? 'open' : ''}`}
        style={{
          width: sidebarOpen ? 240 : 56,
          minWidth: sidebarOpen ? 240 : 56,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          className="command-sidebar__header"
          style={{
            padding: sidebarOpen ? '16px 16px 12px' : '16px 8px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minHeight: 56,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--info)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            C
          </div>
          {sidebarOpen && (
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              Command
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {Object.entries(groupedNavItems).map(([section, items]) => (
            <div key={section}>
              {sidebarOpen && section !== 'Основное' && (
                <div
                  style={{
                    padding: '12px 16px 4px',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    color: 'var(--text-muted)',
                  }}
                >
                  {section}
                </div>
              )}
              {items.map((item) => (
                <div
                  key={item.path}
                  className={`list__item ${isActive(item.path) ? 'list__item--active' : ''}`}
                  onClick={() => {
                    navigate(item.path);
                    setMobileSidebarOpen(false);
                  }}
                  style={{
                    cursor: 'pointer',
                    padding: sidebarOpen ? '8px 16px' : '8px 0',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    gap: 10,
                    margin: '1px 8px',
                    borderRadius: 6,
                  }}
                  title={item.label}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  {sidebarOpen && <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{item.label}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div
          style={{
            padding: '8px 12px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 14,
              padding: '4px 8px',
              borderRadius: 4,
            }}
            title={sidebarOpen ? 'Свернуть' : 'Развернуть'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div
          className="topbar"
          style={{
            minHeight: 56,
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
          }}
        >
          <div className="topbar__logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'var(--info)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              C
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Command</span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Topbar right: user info, theme, lang */}
          <div className="topbar__right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="topbar__lang" data-lang-toggle style={{ fontSize: 13, cursor: 'pointer' }}>
              🇷🇺 RU
            </span>
            <span className="topbar__theme" data-theme-toggle style={{ fontSize: 13, cursor: 'pointer' }}>
              🌙 Тёмная
            </span>
            <div className="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact">
              <div className="avatar__inner">
                <span>ИВ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="content overflow-y-auto" style={{ flex: 1, overflow: 'auto' }}>
          <div className="page-container">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}
    </div>
  );
}

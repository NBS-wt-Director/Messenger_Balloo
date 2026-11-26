// Sidebar — навигация: чаты, контакты, настройки + юридические ссылки (правила, конфиденциальность, cookies)
// Command-пункты (Знания/Вакансии — узел у_03) убраны по решению владельца 24.11.2026 (тик. 1795497139-removable-command-sidebar).

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { UserCard } from './UserCard';
import { NavItem } from './NavItem';
import { SearchBar } from './SearchBar';

export function Sidebar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  if (!user) return null;

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const navItems = [
    { icon: '💬', label: 'Чаты', path: '/chat' },
    { icon: '👥', label: 'Контакты', path: '/contacts' },
    // Истории и Приглашения — по запросу владельца (тик. 1795282577)
    { icon: '📷', label: 'Истории', path: '/stories' },
    { icon: '📨', label: 'Приглашения', path: '/invites' },
    { icon: '📞', label: 'Звонки', path: '/calls' },
    { icon: '🎧', label: 'Поддержка', path: '/support' },
    { icon: '⚙️', label: 'Настройки', path: '/settings' },
  ];

  // Admin link — перед «Настройки» (индекс ищется по пути, чтобы не зависеть
  // от числа пунктов выше после удаления «Знаний»/«Вакансий» — тик. 1795497139-removable-command-sidebar).
  if (user.isAdmin) {
    const adminIndex = navItems.findIndex((i) => i.path === '/settings');
    navItems.splice(adminIndex >= 0 ? adminIndex : navItems.length, 0, {
      icon: '🛡️',
      label: 'Админка',
      path: '/admin',
    });
  }

  // Legal nav items (visible only when sidebar is expanded)
  const legalItems = [
    { icon: '📜', label: 'Правила', path: '/rules' },
    { icon: '🔒', label: 'Конфиденциальность', path: '/privacy' },
    { icon: '🍪', label: 'Cookies', path: '/cookies' },
  ];

  return (
    <div
      id="app-sidebar"
      className="sidebar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: isSidebarOpen ? '280px' : '64px',
        minWidth: isSidebarOpen ? '280px' : '64px',
        background: 'var(--bg-primary)',
        borderRight: isSidebarOpen ? '1px solid var(--border-color)' : 'none',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Top bar: toggle + user */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isSidebarOpen ? '12px 8px 8px' : '8px',
          flexShrink: 0,
        }}
      >
        {/* Logo / brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isSidebarOpen ? '0 8px' : 0,
            fontWeight: 700,
            fontSize: '16px',
            color: 'var(--accent)',
            cursor: 'pointer',
            flex: 1,
            overflow: 'hidden',
          }}
          onClick={() => navigate('/chat')}
        >
          <span style={{ fontSize: '20px', flexShrink: 0 }}>🎈</span>
          {!isSidebarOpen || <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Balloo</span>}
        </div>

        {/* Toggle sidebar — на десктопе кнопка теперь также в шапке (тик. 1795721513),
            поэтому в панели при collapsed скрываем, чтобы не переполнять рейл 64px. */}
        {isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px 8px',
            flexShrink: 0,
          }}
        >
          ◀
        </button>
        )}
      </div>

      {/* User card */}
      <UserCard user={user} collapsed={!isSidebarOpen} />

      {/* Search */}
      {isSidebarOpen && <SearchBar onSearch={() => handleNavClick('/search')} />}

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '4px' }}>
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            active={false}
            onClick={() => handleNavClick(item.path)}
          />
        ))}
      </div>

      {/* Bottom: Legal links + Collapse indicator */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '8px 0',
          flexShrink: 0,
        }}
      >
        {isSidebarOpen ? (
          // Expanded: show legal links as items
          <>
            {legalItems.map((item) => (
              <NavItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                active={false}
                onClick={() => handleNavClick(item.path)}
              />
            ))}
          </>
        ) : (
          // Collapsed: show legal icons as tooltip items
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              padding: '4px 0',
            }}
          >
            {legalItems.map((item) => (
              <div
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                style={{
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '4px',
                  opacity: 0.6,
                  transition: 'opacity 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                title={item.label}
              >
                {item.icon}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

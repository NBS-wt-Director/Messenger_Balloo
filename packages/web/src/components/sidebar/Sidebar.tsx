// Sidebar — навигация: чаты, контакты, настройки, блог, админка

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
    { icon: '📖', label: 'Блог', path: '/blog' },
    { icon: '📚', label: 'Знания', path: '/knowledge' },
    { icon: '💼', label: 'Вакансии', path: '/hiring' },
    { icon: '⚙️', label: 'Настройки', path: '/settings' },
  ];

  // Admin link
  if (user.isAdmin) {
    navItems.splice(4, 0, { icon: '🛡️', label: 'Админка', path: '/admin' });
  }

  return (
    <div
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
          padding: '12px 8px 8px',
          flexShrink: 0,
        }}
      >
        {/* Logo / brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 8px',
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

        {/* Toggle sidebar */}
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
          {isSidebarOpen ? '◀' : '▶'}
        </button>
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

      {/* Bottom: Collapse indicator */}
      {!isSidebarOpen && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 0',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          {navItems.slice(0, 4).map((item) => (
            <div
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              style={{
                fontSize: '18px',
                cursor: 'pointer',
                padding: '6px',
                opacity: 0.7,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            >
              {item.icon}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

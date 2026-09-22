// Main Layout — основной лейаут приложения (P35: единая шапка/подвал)
// Структура по макету mockups/balloo-su/chats.html:
//   Topbar (на всю ширину, @balloo/ui) → main (sidebar | chat list | chat view) → Footer (@balloo/ui)
// Responsive: mobile (1 col), tablet (2 col), desktop (3 col)

import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatList } from '@/components/chat/ChatList';
import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';
import { NotificationsBell } from '@/components/topbar/NotificationsBell';
import { useAuthStore } from '@/store/authStore';

function MainLayout() {
  const navigate = useNavigate();
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const user = useAuthStore((s) => s.user);

  // Responsive handling
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w <= 768) {
        setSidebarOpen(false);
      } else if (w <= 1024) {
        setSidebarOpen(true);
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  const isMobile = window.innerWidth <= 768;
  const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

  const showChatList = !isMobile;
  const showChatView = !isMobile && !isTablet;

  // Аватар пользователя в шапке (клик → профиль), как в макете chats.html
  const displayName = user?.displayName || user?.username || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="main-layout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Единая шапка (@balloo/ui) — на всю ширину, как в макете */}
      <AppTopbar
        title="Чаты"
        right={
          <>
            <NotificationsBell />
            <div
              className="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact"
              title={displayName || 'Профиль'}
              onClick={() => navigate('/profile')}
              style={{ cursor: 'pointer' }}
            >
              <div className="avatar__inner">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt={displayName} /> : <span>{initials || '?'}</span>}
              </div>
            </div>
          </>
        }
      />

      {/* Main: sidebar | chat list | chat view */}
      <div className="main" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Column 1: Sidebar */}
        {isSidebarOpen && <Sidebar />}

        {/* Column 2: Chat list */}
        {showChatList && <ChatList />}

        {/* Column 3: Chat view / content */}
        <main
          className="main-content"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Outlet for child routes */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Единый подвал (@balloo/ui) */}
      <AppFooter onCopyrightClick={() => navigate('/')} />
    </div>
  );
}

export default MainLayout;

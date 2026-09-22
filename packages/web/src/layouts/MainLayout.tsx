// Main Layout — основной лейаут приложения (P35: единая шапка/подвал)
// Структура по макету mockups/balloo-su/chats.html:
//   Topbar (на всю ширину, @balloo/ui) → main (sidebar | chat list | chat view) → Footer (@balloo/ui)
// Responsive: mobile (1 col: на /chat — список чатов, на /chat/:id — чат),
//             tablet (2 col), desktop (3 col)

import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatList } from '@/components/chat/ChatList';
import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';
import { NotificationsBell } from '@/components/topbar/NotificationsBell';
import { useAuthStore } from '@/store/authStore';

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const user = useAuthStore((s) => s.user);

  // Responsive handling — реактивно (state), чтобы поворот/ресайз перерисовывал колонки
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>(() =>
    typeof window === 'undefined' ? 'desktop' : window.innerWidth <= 768 ? 'mobile' : window.innerWidth <= 1024 ? 'tablet' : 'desktop'
  );

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w <= 768) {
        setViewport('mobile');
        setSidebarOpen(false);
      } else if (w <= 1024) {
        setViewport('tablet');
        setSidebarOpen(true);
      } else {
        setViewport('desktop');
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  const isMobile = viewport === 'mobile';

  // Мобильный чат по макету mockups/mobile/chat.html:
  //   /chat (без id)   → список чатов на весь экран
  //   /chat/:chatId    → чат на весь экран (в шапке чата кнопка «←»)
  // Прочие маршруты (/profile, /settings, ...) — как обычно, контент в Outlet.
  const isChatIndex = /^\/chat\/?$/.test(location.pathname);
  const showChatList = !isMobile || isChatIndex;
  const showOutlet = !(isMobile && isChatIndex);

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
        width: '100%',
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
        {showOutlet && (
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
        )}
      </div>

      {/* Единый подвал (@balloo/ui) */}
      <AppFooter onCopyrightClick={() => navigate('/')} />
    </div>
  );
}

export default MainLayout;

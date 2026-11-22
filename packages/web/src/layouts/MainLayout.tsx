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
import { sectionTitleForPath } from '@/components/chrome/sectionTitles';

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

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

  // Аватар пользователя в шапке (клик → профиль) теперь строит AppTopbar
  // по состоянию авторизации (тик. 1795292000) — здесь дублировать не нужно.

  return (
    <div
      className="main-layout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--app-bg)',
      }}
    >
      {/* Единая шапка (@balloo/ui) — на всю ширину, как в макете.
          Заголовок — раздел текущего маршрута (тик. 1795292000);
          правый блок (колокольчик + аватар / «Войти») строит AppTopbar. */}
      <AppTopbar
        title={sectionTitleForPath(location.pathname)}
        actions={
          <>
            {/* Быстрый доступ к историям и приглашениям (тик. 1795282577) */}
            <button
              type="button"
              className="topbar__actions-btn"
              title="Истории"
              onClick={() => navigate('/stories')}
            >
              📷
            </button>
            <button
              type="button"
              className="topbar__actions-btn"
              title="Приглашения"
              onClick={() => navigate('/invites')}
            >
              📨
            </button>
          </>
        }
      />

      {/* Main: sidebar | chat list | chat view */}
      <div className="main" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Column 1: Sidebar */}
        {isSidebarOpen && <Sidebar />}

        {/* Column 2: Chat list */}
        {showChatList && (
          <ChatList onChatSelect={(chatId) => navigate(`/chat/${chatId}`)} />
        )}

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
      <AppFooter onCopyrightClick={() => navigate('/about-balloo')} />
    </div>
  );
}

export default MainLayout;

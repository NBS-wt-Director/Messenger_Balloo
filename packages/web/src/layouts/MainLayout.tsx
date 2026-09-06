// Main Layout — основной лейаут приложения
// 3-column: sidebar | chat list | chat view (desktop)
// Responsive: mobile (1 col), tablet (2 col), desktop (3 col)
// + Footer с юридическими ссылками

import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatList } from '@/components/chat/ChatList';
import { TopBar } from '@/components/topbar/TopBar';

function MainLayout() {
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const setIsSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  // Responsive handling
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w <= 768) {
        setIsSidebarOpen(false);
      } else if (w <= 1024) {
        setIsSidebarOpen(true);
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsSidebarOpen]);

  const isMobile = window.innerWidth <= 768;
  const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

  const showChatList = !isMobile;
  const showChatView = !isMobile && !isTablet;

  return (
    <div
      className="main-layout"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}
    >
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
        {/* TopBar */}
        <TopBar
          title="Balloo"
          onSearchClick={() => {
            window.location.hash = '#/search';
          }}
        />

        {/* Outlet for child routes */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Outlet />
        </div>

        {/* Footer: юридические ссылки */}
        <footer
          style={{
            borderTop: '1px solid var(--border-color)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            flexShrink: 0,
            background: 'var(--bg-secondary)',
          }}
        >
          <span>Balloo Messenger © 2026</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <a href="/rules" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Правила
          </a>
          <a href="/privacy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Конфиденциальность
          </a>
          <a href="/cookies" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Cookies
          </a>
        </footer>
      </main>
    </div>
  );
}

export default MainLayout;

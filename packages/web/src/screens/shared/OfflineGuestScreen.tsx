// Offline Guest Screen — страница «Нет соединения» (гость)
// Shared error screen (1_00_06) — макет mockups/shared/offline-guest.html

import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';

function OfflineGuestScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppTopbar title="Офлайн" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🦊📡</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Нет соединения с интернетом</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6, marginBottom: 28 }}>
          Похоже, вы офлайн. Balloo требует подключения к интернету. Проверьте сетевое соединение и попробуйте снова.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 1.5rem', background: 'var(--accent)', color: '#fff', fontWeight: 600, borderRadius: 0, border: 'none', cursor: 'pointer', fontSize: 14 }}
          >
            Попробовать снова
          </button>
          <a
            href="/login"
            style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 600, borderRadius: 0, cursor: 'pointer', textDecoration: 'none', fontSize: 14 }}
          >
            Войти в Balloo
          </a>
        </div>
      </div>

      <AppFooter />
    </div>
  );
}

export default OfflineGuestScreen;

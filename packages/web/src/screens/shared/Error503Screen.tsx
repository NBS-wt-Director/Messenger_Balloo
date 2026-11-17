// Error 503 Screen — страница «Сервис недоступен»
// Shared error screen (1_00_04) — макет mockups/shared/error-503.html

import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';

function Error503Screen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppTopbar title="Ошибка 503" right={<img className="mascot" src="/assets/logos/mascot.png" alt="Маскот Balloo" />} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🦊🔧</div>
        <div style={{ fontSize: 120, fontWeight: 900, color: 'var(--text-muted)', lineHeight: 1, marginBottom: 8, letterSpacing: -4 }}>503</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Сервис недоступен</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6, marginBottom: 28 }}>
          Balloo временно недоступен — возможно, идут технические работы. Мы вернёмся совсем скоро. Спасибо за терпение!
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 1.5rem', background: 'var(--accent)', color: '#fff', fontWeight: 600, borderRadius: 0, border: 'none', cursor: 'pointer', fontSize: 14 }}
          >
            Обновить
          </button>
          <a
            href="https://t.me/kodacommunity"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 600, borderRadius: 0, cursor: 'pointer', textDecoration: 'none', fontSize: 14 }}
          >
            Статус сервиса
          </a>
        </div>
      </div>

      <AppFooter />
    </div>
  );
}

export default Error503Screen;

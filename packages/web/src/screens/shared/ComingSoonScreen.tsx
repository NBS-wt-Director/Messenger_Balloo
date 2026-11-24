// ComingSoonScreen — заглушка «Экран в разработке» (тик. 1795507295).
// Пункты меню подвала, экран которых ещё не готов, ведут сюда с ?name=<экран>.
// Требование владельца 24.11.2026: пункты активны, но показывают заглушку
// с извинением, а не неактивное «(Позже)».

import { useLocation } from 'react-router-dom';
import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';

export function ComingSoonScreen() {
  // Название запрошенного экрана из query (?name=Контакты)
  const location = useLocation();
  const name = new URLSearchParams(location.search).get('name') || 'Этот экран';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', textAlign: 'center' }}>
      <AppTopbar title="В разработке" />

      <div
        className="page-container"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ fontSize: 56, marginBottom: 16 }}>🐻</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Экран в разработке</h1>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
          {name}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, maxWidth: 460 }}>
          Приносим извинения — этот экран ещё не готов. Мы работаем над ним
          и постараемся открыть его в ближайшее время. Спасибо за понимание!
        </p>
        <a
          href="/#/chat"
          style={{
            marginTop: 28,
            padding: '10px 24px',
            background: 'var(--accent)',
            color: 'var(--accent-text, #fff)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Вернуться в мессенджер
        </a>
      </div>

      <AppFooter />
    </div>
  );
}

export default ComingSoonScreen;

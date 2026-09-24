// Not Found Screen — страница 404
// Shared error screen (1_00_01) — макет mockups/shared/error-404.html:
// единый topbar (лого + «Ошибка 404» + маскот/язык/тема).
// P37-2 (решение владельца 2026-09-23): единый подвал добавлен на 404,
// несмотря на его отсутствие в макете — требование «шапка и подвал одни
// на всех страницах» приоритетнее.

import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';

function NotFoundScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        textAlign: 'center',
      }}
    >
      {/* P35: единая шапка по макету error-404.html */}
      <AppTopbar title="Ошибка 404" right={<div className="mascot">🦊</div>} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          padding: '2rem',
        }}
      >
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent)' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Страница не найдена</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Запрашиваемая страница не существует.
        </p>
        <a
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: '600',
            borderRadius: '0',
          }}
        >
          На главную
        </a>
      </div>

      {/* P37-2: единый подвал на 404 (решение владельца) */}
      <AppFooter />
    </div>
  );
}

export default NotFoundScreen;

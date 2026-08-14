// Not Found Screen — страница 404
// Shared error screen

function NotFoundScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
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
  );
}

export default NotFoundScreen;

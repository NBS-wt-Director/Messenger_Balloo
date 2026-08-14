// Landing Screen — стартовая страница (placeholder)
// Full implementation in later tickets

function LandingScreen() {
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
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Balloo</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Российский мессенджер для общения, работы и бизнеса
      </p>
      <a
        href="/login"
        style={{
          padding: '0.75rem 2rem',
          background: 'var(--accent)',
          color: '#fff',
          fontWeight: '600',
          borderRadius: '0',
        }}
      >
        Войти
      </a>
    </div>
  );
}

export default LandingScreen;

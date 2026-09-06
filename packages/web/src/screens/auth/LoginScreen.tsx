// Login Screen — экран авторизации
// Full implementation in ticket #25

function LoginScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'Inter, Manrope, sans-serif',
        color: 'var(--text-primary)',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Войти</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Экран авторизации (тикеты #25+)
      </p>
      <a href="/register" style={{ color: 'var(--accent)' }}>
        Регистрация →
      </a>

      {/* Legal links at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          display: 'flex',
          gap: '16px',
          fontSize: '13px',
        }}
      >
        <a href="/rules" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Правила
        </a>
        <a href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Конфиденциальность
        </a>
        <a href="/cookies" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Cookies
        </a>
      </div>
    </div>
  );
}

export default LoginScreen;

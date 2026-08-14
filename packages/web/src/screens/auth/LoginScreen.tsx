// Login Screen — placeholder
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
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Войти</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Экран авторизации (тикеты #25+)
      </p>
      <a href="/register" style={{ color: 'var(--accent)' }}>
        Регистрация →
      </a>
    </div>
  );
}

export default LoginScreen;

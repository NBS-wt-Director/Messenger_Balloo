// InstallScreen — первичная установка Balloo
// Настройка БД, Redis, OAuth, CDN, SMTP и других параметров системы
// Все endpoints НЕ требуют аутентификации (система ещё не настроена)

import { useState } from 'react';

const API_BASE = '/api/install';

interface InstallStatus {
  installed: boolean;
  version: string;
}

export function InstallScreen() {
  const [status, setStatus] = useState<InstallStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Install config state
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('5432');
  const [dbName, setDbName] = useState('balloo');
  const [dbUser, setDbUser] = useState('balloo');
  const [dbPassword, setDbPassword] = useState('balloo123');

  const [redisHost, setRedisHost] = useState('localhost');
  const [redisPort, setRedisPort] = useState('6379');
  const [redisPassword, setRedisPassword] = useState('');

  const [yandexClientId, setYandexClientId] = useState('');
  const [yandexClientSecret, setYandexClientSecret] = useState('');
  const [vkClientId, setVkClientId] = useState('');
  const [vkClientSecret, setVkClientSecret] = useState('');
  const [mailruClientId, setMailruClientId] = useState('');
  const [mailruClientSecret, setMailruClientSecret] = useState('');

  const [smtpHost, setSmtpHost] = useState('localhost');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('noreply@balloo.su');

  const [password, setPassword] = useState('');
  const [jwtSecret, setJwtSecret] = useState('');

  const totalSteps = 4;

  // Check install status on mount
  useState(() => {
    fetch(`${API_BASE}/status`)
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({ installed: false, version: 'dev' }));
  });

  if (status?.installed) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>✅ Система уже установлена</h2>
        <p>Версия: {status.version}</p>
        <p>Для повторной установки введите пароль администратора:</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль установки"
          style={{ padding: '8px 12px', fontSize: 16, marginBottom: 12, width: 300 }}
        />
        <br />
        <button
          onClick={async () => {
            try {
              const res = await fetch(`${API_BASE}/verify-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
              });
              const data = await res.json();
              if (data.ok) {
                alert('Пароль верен. Перезапустите сервисы для сброса установки.');
              } else {
                alert(data.error);
              }
            } catch (e) {
              alert('Ошибка проверки пароля');
            }
          }}
          style={{
            padding: '10px 24px',
            fontSize: 16,
            background: '#e67e22',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Проверить пароль
        </button>
      </div>
    );
  }

  const testConnection = async (endpoint: string, body: Record<string, unknown>) => {
    try {
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        alert('✅ ' + data.message);
        return true;
      } else {
        alert('❌ ' + data.error);
        return false;
      }
    } catch (e) {
      alert('❌ Ошибка подключения');
      return false;
    }
  };

  const handleTestDb = () =>
    testConnection('test-db', {
      dbHost,
      dbPort,
      dbName,
      dbUser,
      dbPassword,
    });

  const handleTestRedis = () =>
    testConnection('test-redis', {
      redisHost,
      redisPort,
      redisPassword,
    });

  const generateJwtSecret = async () => {
    try {
      const res = await fetch(`${API_BASE}/generate-jwt-secret`, { method: 'POST' });
      const data = await res.json();
      setJwtSecret(data.secret);
    } catch {
      // ignore
    }
  };

  const handleApply = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          dbHost,
          dbPort,
          dbName,
          dbUser,
          dbPassword,
          redisHost,
          redisPort,
          redisPassword,
          yandexClientId,
          yandexClientSecret,
          vkClientId,
          vkClientSecret,
          mailruClientId,
          mailruClientSecret,
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPassword,
          smtpFromEmail,
          jwtSecret,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSuccess('✅ ' + data.message);
      } else {
        setError('❌ ' + data.error);
      }
    } catch (e) {
      setError('❌ Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  // Step content
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <h3>🗄️ Шаг 1: База данных</h3>
            <p>Настройте подключение к PostgreSQL</p>
            <div style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
              <input placeholder="Хост" value={dbHost} onChange={(e) => setDbHost(e.target.value)} style={inputStyle} />
              <input placeholder="Порт" value={dbPort} onChange={(e) => setDbPort(e.target.value)} style={inputStyle} />
              <input placeholder="Имя БД" value={dbName} onChange={(e) => setDbName(e.target.value)} style={inputStyle} />
              <input placeholder="Пользователь" value={dbUser} onChange={(e) => setDbUser(e.target.value)} style={inputStyle} />
              <input placeholder="Пароль" type="password" value={dbPassword} onChange={(e) => setDbPassword(e.target.value)} style={inputStyle} />
              <button onClick={handleTestDb} style={btnStyle('#3498db')}>🧪 Тест подключения</button>
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <h3>⚡ Шаг 2: Redis</h3>
            <p>Настройте подключение к Redis</p>
            <div style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
              <input placeholder="Хост" value={redisHost} onChange={(e) => setRedisHost(e.target.value)} style={inputStyle} />
              <input placeholder="Порт" value={redisPort} onChange={(e) => setRedisPort(e.target.value)} style={inputStyle} />
              <input placeholder="Пароль" type="password" value={redisPassword} onChange={(e) => setRedisPassword(e.target.value)} style={inputStyle} />
              <button onClick={() => handleTestRedis()} style={btnStyle('#3498db')}>🧪 Тест подключения</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3>🔐 Шаг 3: OAuth</h3>
            <p>Настройте провайдеры авторизации</p>
            <div style={{ display: 'grid', gap: 12, maxWidth: 500 }}>
              <fieldset style={{ padding: 16 }}>
                <legend style={{ fontWeight: 'bold' }}>Yandex</legend>
                <input placeholder="Client ID" value={yandexClientId} onChange={(e) => setYandexClientId(e.target.value)} style={inputStyle} />
                <input placeholder="Client Secret" value={yandexClientSecret} onChange={(e) => setYandexClientSecret(e.target.value)} style={inputStyle} />
              </fieldset>
              <fieldset style={{ padding: 16 }}>
                <legend style={{ fontWeight: 'bold' }}>VK</legend>
                <input placeholder="Client ID" value={vkClientId} onChange={(e) => setVkClientId(e.target.value)} style={inputStyle} />
                <input placeholder="Client Secret" value={vkClientSecret} onChange={(e) => setVkClientSecret(e.target.value)} style={inputStyle} />
              </fieldset>
              <fieldset style={{ padding: 16 }}>
                <legend style={{ fontWeight: 'bold' }}>Mail.ru</legend>
                <input placeholder="Client ID" value={mailruClientId} onChange={(e) => setMailruClientId(e.target.value)} style={inputStyle} />
                <input placeholder="Client Secret" value={mailruClientSecret} onChange={(e) => setMailruClientSecret(e.target.value)} style={inputStyle} />
              </fieldset>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h3>📧 Шаг 4: Email и завершение</h3>
            <p>Настройте SMTP и генерацию ключей</p>
            <div style={{ display: 'grid', gap: 12, maxWidth: 500 }}>
              <fieldset style={{ padding: 16 }}>
                <legend style={{ fontWeight: 'bold' }}>SMTP</legend>
                <input placeholder="Хост" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} style={inputStyle} />
                <input placeholder="Порт" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} style={inputStyle} />
                <input placeholder="Пользователь" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} style={inputStyle} />
                <input placeholder="Пароль" type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} style={inputStyle} />
                <input placeholder="От кого" value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} style={inputStyle} />
              </fieldset>
              <div>
                <strong>JWT Secret:</strong>
                <input placeholder="Сгенерируйте ключ" value={jwtSecret} onChange={(e) => setJwtSecret(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} />
                <br />
                <button onClick={generateJwtSecret} style={{ ...btnStyle('#9b59b6'), marginTop: 8, padding: '6px 16px' }}>
                  🎲 Сгенерировать
                </button>
              </div>
              <div>
                <strong>Пароль установки:</strong>
                <input placeholder="Пароль для будущих действий" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 700, margin: '0 auto' }}>
      <h1>🚀 Установка Balloo</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>
        Первичная настройка системы. Заполните все шаги и нажмите «Применить».
      </p>

      {/* Steps indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            onClick={() => setStep(i)}
            style={{
              flex: 1,
              padding: '10px 0',
              textAlign: 'center',
              background: i === step ? '#2db84d' : i < step ? '#27ae60' : '#333',
              color: i <= step ? '#fff' : '#888',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: i === step ? 'bold' : 'normal',
              transition: 'all 0.2s',
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Step content */}
      {renderStep()}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          style={{
            ...btnStyle('#555'),
            opacity: step === 0 ? 0.4 : 1,
          }}
        >
          ← Назад
        </button>
        {step < totalSteps - 1 ? (
          <button onClick={() => setStep(step + 1)} style={btnStyle('#3498db')}>
            Далее →
          </button>
        ) : (
          <button
            onClick={handleApply}
            disabled={loading}
            style={{
              ...btnStyle('#2db84d'),
              opacity: loading ? 0.6 : 1,
              fontWeight: 'bold',
            }}
          >
            {loading ? '⏳ Применение...' : '✅ Применить'}
          </button>
        )}
      </div>

      {/* Messages */}
      {error && <div style={{ marginTop: 24, padding: 16, background: '#e74c3c', color: '#fff', borderRadius: 6 }}>{error}</div>}
      {success && <div style={{ marginTop: 24, padding: 16, background: '#27ae60', color: '#fff', borderRadius: 6 }}>{success}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 14,
  border: '1px solid #444',
  borderRadius: 6,
  background: '#1a1a2e',
  color: '#fff',
  width: '100%',
  boxSizing: 'border-box',
};

function btnStyle(color: string): React.CSSProperties {
  return {
    padding: '10px 24px',
    fontSize: 14,
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  };
}

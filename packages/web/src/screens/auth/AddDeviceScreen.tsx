// Add Device Screen — вход через другое устройство (QR)
// Макет: mockups/balloo-su/add-device.html (+ add-device.md)
// QR-код генерируется авторизованным устройством (серверный pair-token — отдельный тикет);
// эта страница — инструкции и безопасность, как в макете.

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeSwitcher } from '@/components/topbar/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/topbar/LanguageSwitcher';

function AddDeviceScreen() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar__logo" onClick={() => navigate('/login')}>
          <div className="topbar__logo-icon">B</div>
          <span>Balloo</span>
        </div>
        <div className="topbar__title">Добавить устройство</div>
        <div className="topbar__right">
          <div className="mascot">🦊</div>
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>

      {/* Content (narrow) */}
      <div
        style={{
          maxWidth: '640px',
          width: '100%',
          margin: '0 auto',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <Link to="/login" className="text-secondary" style={{ fontSize: '13px' }}>
          ← Назад ко входу
        </Link>

        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
          ➕ Добавить устройство
        </h1>

        {/* Инструкция */}
        <div className="card">
          <div className="card__title">Как войти через другое устройство</div>
          <div className="card__body">
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Откройте Balloo на устройстве, где вы уже авторизованы</li>
              <li>На экране входа нажмите «Войти через другое устройство»</li>
              <li>Наведите камеру нового устройства на QR-код</li>
              <li>Подтвердите вход на обоих устройствах</li>
              <li>Готово!</li>
            </ol>
          </div>
        </div>

        {/* Как это работает */}
        <div className="card">
          <div className="card__title">Как это работает</div>
          <div className="card__body">
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Код работает в обе стороны: показать или отсканировать</li>
              <li>Мобильное устройство всегда сканирует камерой</li>
              <li>Код истекает через 60 секунд</li>
            </ul>
          </div>
        </div>

        {/* Безопасность */}
        <div className="card">
          <div className="card__title">Безопасность</div>
          <div className="card__body">
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Токен одноразовый и истекает через 60 секунд</li>
              <li>Подтверждение требуется на обоих устройствах</li>
              <li>Новое устройство наследует права, но не пароль</li>
              <li>Сессию можно отозвать в любой момент в настройках</li>
            </ul>
          </div>
        </div>

        <button
          type="button"
          className="btn btn--secondary btn--block"
          onClick={() => navigate('/login')}
        >
          ← Назад ко входу
        </button>
      </div>

      {/* Footer — юридические ссылки */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          padding: '16px',
          fontSize: '13px',
        }}
      >
        <Link to="/rules" className="text-secondary" style={{ textDecoration: 'none' }}>
          Правила
        </Link>
        <Link to="/privacy" className="text-secondary" style={{ textDecoration: 'none' }}>
          Конфиденциальность
        </Link>
        <Link to="/cookies" className="text-secondary" style={{ textDecoration: 'none' }}>
          Cookies
        </Link>
      </div>
    </div>
  );
}

export default AddDeviceScreen;

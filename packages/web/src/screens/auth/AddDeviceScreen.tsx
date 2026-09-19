// Add Device Screen — вход через другое устройство (QR)
// Макет: mockups/balloo-su/add-device.html (+ add-device.md)
// P30 (2026-09-19): кнопка «Войти через другое устройство» на /login ведёт
// сюда — на ЧАСТЬ ВХОДА «НА НАСТОЛЬНОМ УСТРОЙСТВЕ»: экран показывает QR-код
// (как в макете: таймер 60 сек, код balloо://pair/…, «Обновить код»).
// Реальный pair-token: POST /api/devices/pair-token + опрос статуса
// GET /api/devices/pair/:token/status; при confirmed сервер ставит
// httpOnly auth-cookie прямо в ответе статуса — экран уходит в /chat.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeSwitcher } from '@/components/topbar/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/topbar/LanguageSwitcher';
import { TopbarMenu } from '@/components/topbar/TopbarMenu';
import { api } from '@/services/api';

// Интервал опроса статуса кода (сек)
const POLL_INTERVAL_SECONDS = 3;

function AddDeviceScreen() {
  const navigate = useNavigate();
  const [qrSeconds, setQrSeconds] = useState(60);
  const [pairToken, setPairToken] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Токен для эффектов: меняем только когда получили новый код
  const tokenRef = useRef<string | null>(null);

  // Запрос нового кода (mount, «Обновить код», истечение)
  const refreshQr = useCallback(async () => {
    try {
      const info = await api.createPairToken();
      tokenRef.current = info.token;
      setPairToken(info.token);
      setQrSeconds(info.expiresIn);
      setLoadError(null);
    } catch (e: any) {
      // 503 — сервис привязки недоступен (нет Redis); показываем честно
      setLoadError(e?.message || 'Не удалось получить код. Попробуйте ещё раз.');
      tokenRef.current = null;
      setPairToken(null);
    }
  }, []);

  useEffect(() => {
    refreshQr();
  }, [refreshQr]);

  // Таймер QR-кода: N → 0, при 0 — автозапрос нового кода (как «Обновить код»)
  useEffect(() => {
    if (qrSeconds <= 0) {
      refreshQr();
      return;
    }
    const timer = setTimeout(() => setQrSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [qrSeconds, refreshQr]);

  // Опрос статуса: confirmed → сервер уже поставил auth-cookie → в /chat
  // (роутер-гвард сам вызовет getMe по cookie)
  useEffect(() => {
    const token = tokenRef.current;
    if (!token) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.getPairStatus(token);
        if (cancelled) return;
        if (res.status === 'confirmed') {
          navigate('/chat', { replace: true });
        } else if (res.status === 'expired') {
          refreshQr();
        }
      } catch {
        // Сетевая ошибка — просто ждём следующий тик опроса
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_SECONDS * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pairToken, navigate, refreshQr]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto',
        // P27: фон не задаём — градиент темы russian на body не должен закрываться
      }}
    >
      {/* Topbar */}
      <div className="topbar">
        <TopbarMenu />
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

        {/* QR-код — вход «на настольном устройстве» (P30, по макету add-device.html) */}
        <div className="card mb-4 text-center">
          <div className="text-sm text-secondary mb-4">
            QR-код действует{' '}
            <strong style={{ color: qrSeconds <= 10 ? 'var(--danger)' : 'var(--accent)' }}>
              {qrSeconds}
            </strong>{' '}
            сек.
          </div>

          {/* QR Code (визуал по макету; реальный токен — серверный pair-token API) */}
          <div style={{ display: 'inline-block', padding: '24px', background: '#fff' }}>
            <div
              style={{
                width: '220px',
                height: '220px',
                background: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 14px 14px',
                position: 'relative',
                opacity: qrSeconds <= 0 ? 0.25 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              <div style={{ position: 'absolute', top: '10px', left: '10px', width: '48px', height: '48px', background: '#fff', border: '10px solid #000' }} />
              <div style={{ position: 'absolute', top: '10px', right: '10px', width: '48px', height: '48px', background: '#fff', border: '10px solid #000' }} />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '48px', height: '48px', background: '#fff', border: '10px solid #000' }} />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '40px',
                  height: '40px',
                  clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: 900,
                }}
              >
                B
              </div>
            </div>
          </div>

          <div className="text-xs text-muted mt-4">
            Код: <code>balloo://pair/{pairToken ?? '…'}</code>
          </div>

          {loadError && (
            <div className="text-xs mt-2" style={{ color: 'var(--danger)' }}>
              {loadError}
            </div>
          )}

          <div className="flex gap-2 justify-center mt-6">
            <button type="button" className="btn btn--primary" onClick={refreshQr}>
              🔄 Обновить код
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => navigate('/login')}>
              Отмена
            </button>
          </div>
        </div>

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
          flexShrink: 0,
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

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
import QRCode from 'qrcode';
import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';
import { api } from '@/services/api';

// Интервал опроса статуса кода (сек)
const POLL_INTERVAL_SECONDS = 3;

function AddDeviceScreen() {
  const navigate = useNavigate();
  const [qrSeconds, setQrSeconds] = useState(60);
  const [pairToken, setPairToken] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
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

  // Настоящий QR-код (тик. 1795101592): раньше на экране была CSS-заглушка
  // (repeating-conic-gradient), которая не содержала токена и не сканировалась.
  // Рендерим SVG (toString) — не зависит от canvas, работает и в тестах/jsdom.
  useEffect(() => {
    if (!pairToken) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toString(`balloo://pair/${pairToken}`, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
    })
      .then((svg) => {
        if (!cancelled) setQrDataUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pairToken]);

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
      {/* Единая шапка (@balloo/ui, P35) */}
      <AppTopbar title="Добавить устройство" />

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

          {/* QR Code — настоящий, из deep-link balloo://pair/<token> (тик. 1795101592) */}
          <div style={{ display: 'inline-block', padding: '24px', background: '#fff' }}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR-код для входа со второго устройства"
                data-testid="pair-qr"
                width={220}
                height={220}
                style={{ opacity: qrSeconds <= 0 ? 0.25 : 1, transition: 'opacity 0.3s', display: 'block' }}
              />
            ) : (
              <div
                data-testid="pair-qr-placeholder"
                style={{
                  width: '220px',
                  height: '220px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#888',
                  fontSize: '13px',
                  textAlign: 'center',
                  padding: '12px',
                }}
              >
                {loadError ? 'QR недоступен' : 'Генерация кода…'}
              </div>
            )}
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

      {/* Единый подвал (@balloo/ui, P35) — юридические ссылки */}
      <AppFooter />
    </div>
  );
}

export default AddDeviceScreen;

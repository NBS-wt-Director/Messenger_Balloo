// DesktopAddDeviceScreen.tsx — Desktop add device screen
// Shows QR code and instructions for linking a new device
// Тикет 1792311349: QR строится на реальном pair-token
// (POST /api/devices/pair-token + опрос GET /api/devices/pair/:token/status),
// как в web AddDeviceScreen.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@balloo/web/services/api';

const POLL_INTERVAL_MS = 3000;

export function DesktopAddDeviceScreen() {
  const [seconds, setSeconds] = useState(60);
  const [pairToken, setPairToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const refreshQr = useCallback(async () => {
    try {
      const info = await api.createPairToken();
      tokenRef.current = info.token;
      setPairToken(info.token);
      setSeconds(info.expiresIn);
      setError(null);
    } catch (e: any) {
      // 503 — Redis недоступен, привязка сейчас невозможна
      setError(e?.message || 'Не удалось получить код. Попробуйте ещё раз.');
      tokenRef.current = null;
      setPairToken(null);
    }
  }, []);

  useEffect(() => {
    refreshQr();
  }, [refreshQr]);

  useEffect(() => {
    if (seconds <= 0) {
      refreshQr();
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, refreshQr]);

  useEffect(() => {
    const token = tokenRef.current;
    if (!token) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.getPairStatus(token);
        if (cancelled) return;
        if (res.status === 'confirmed') setConfirmed(true);
        else if (res.status === 'expired') refreshQr();
      } catch {
        // сетевая ошибка — ждём следующий тик
      }
    };
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pairToken, refreshQr]);
  const containerStyle: React.CSSProperties = {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
  };

  const qrContainerStyle: React.CSSProperties = {
    width: '200px',
    height: '200px',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
  };

  const stepStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    width: '100%',
    maxWidth: '400px',
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary, #fff)' }}>
        Добавить устройство
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary, #8a8aa0)', textAlign: 'center', maxWidth: '400px' }}>
        Отсканируйте QR-код с помощью приложения Balloo на телефоне, чтобы войти в аккаунт
      </p>

      {/* QR Code placeholder */}
      <div style={qrContainerStyle}>
        <div style={{
          width: '180px',
          height: '180px',
          background: 'linear-gradient(135deg, #2db84d, #1a8a3a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '14px',
          textAlign: 'center',
          padding: '8px',
          opacity: pairToken && !confirmed ? 1 : 0.3,
        }}>
          {confirmed ? 'Вход подтверждён ✓' : pairToken ? 'QR-код для подключения' : 'Код недоступен'}
        </div>
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-secondary, #8a8aa0)', textAlign: 'center' }}>
        Код действует <strong style={{ color: seconds <= 10 ? '#e74c3c' : 'var(--accent, #2db84d)' }}>{seconds}</strong> сек.
        <div style={{ marginTop: '6px', fontSize: '11px', wordBreak: 'break-all' }}>
          balloo://pair/{pairToken ?? '…'}
        </div>
        {error && <div style={{ marginTop: '6px', color: '#e74c3c' }}>{error}</div>}
        {confirmed && <div style={{ marginTop: '6px', color: 'var(--accent, #2db84d)' }}>Устройство подключено</div>}
      </div>

      <button
        type="button"
        onClick={refreshQr}
        style={{
          background: 'var(--accent, #2db84d)',
          color: '#fff',
          border: 'none',
          padding: '8px 18px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        🔄 Обновить код
      </button>

      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-primary, #fff)', marginBottom: '8px' }}>
          Инструкция:
        </h3>
        <div style={stepStyle}>
          <span style={{ color: 'var(--accent, #2db84d)', fontWeight: 700, fontSize: '16px' }}>1</span>
          <span style={{ fontSize: '13px', color: 'var(--text-primary, #fff)' }}>
            Откройте Balloo на вашем мобильном устройстве
          </span>
        </div>
        <div style={stepStyle}>
          <span style={{ color: 'var(--accent, #2db84d)', fontWeight: 700, fontSize: '16px' }}>2</span>
          <span style={{ fontSize: '13px', color: 'var(--text-primary, #fff)' }}>
            Перейдите в Настройки → Устройства
          </span>
        </div>
        <div style={stepStyle}>
          <span style={{ color: 'var(--accent, #2db84d)', fontWeight: 700, fontSize: '16px' }}>3</span>
          <span style={{ fontSize: '13px', color: 'var(--text-primary, #fff)' }}>
            Нажмите "Сканировать QR-код" и наведите камеру на экран
          </span>
        </div>
        <div style={stepStyle}>
          <span style={{ color: 'var(--accent, #2db84d)', fontWeight: 700, fontSize: '16px' }}>4</span>
          <span style={{ fontSize: '13px', color: 'var(--text-primary, #fff)' }}>
            Подтвердите вход на обоих устройствах
          </span>
        </div>
      </div>
    </div>
  );
}
// DesktopAddDeviceScreen.tsx — Desktop add device screen
// Shows QR code and instructions for linking a new device

import React from 'react';

export function DesktopAddDeviceScreen() {
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
        }}>
          QR-код для подключения
        </div>
      </div>

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
// DesktopDevicesScreen.tsx — Desktop devices management screen
// Shows connected devices, current session, and allows ending sessions

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@balloo/web/services/api';

interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  lastActive: number;
  isCurrent: boolean;
  location?: string;
}

export function DesktopDevicesScreen() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [sessionEnded, setSessionEnded] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getDevices();
      setDevices(result.devices || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки устройств');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleEndSession = async (deviceId: string) => {
    if (!confirm('Завершить сессию на этом устройстве?')) return;
    try {
      await api.endSession(deviceId);
      setSessionEnded(deviceId);
      fetchDevices();
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин. назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const deviceCardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: 'var(--bg-card, #1e1e32)',
    border: '1px solid var(--border-color, #2a2a40)',
    marginBottom: '8px',
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary, #fff)' }}>
          Мои устройства
        </h2>
        <button
          onClick={() => setShowAddDevice(true)}
          style={{
            background: 'var(--accent, #2db84d)',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          + Добавить устройство
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary, #8a8aa0)' }}>
            <p style={{ fontSize: '16px' }}>Загрузка...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#e74c3c' }}>
            <p style={{ fontSize: '16px' }}>{error}</p>
            <button onClick={fetchDevices} style={{ marginTop: '12px', padding: '6px 14px', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Повторить
            </button>
          </div>
        ) : (
          devices.map(device => (
            <div key={device.id} style={{
              ...deviceCardStyle,
              opacity: sessionEnded === device.id ? 0.5 : 1,
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: device.isCurrent ? 'var(--accent, #2db84d)' : 'var(--bg-surface, #2a2a40)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
                color: device.isCurrent ? '#fff' : 'var(--text-secondary, #8a8aa0)',
              }}>
                {device.type === 'Windows Desktop' || device.type === 'desktop' ? '💻' : device.type === 'Android' ? '📱' : device.type === 'iOS' ? '🍎' : '🖥️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary, #fff)', fontSize: '14px' }}>
                  {device.name}
                  {device.isCurrent && (
                    <span style={{ color: 'var(--accent, #2db84d)', fontSize: '11px', marginLeft: '8px' }}>
                      (текущее)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #8a8aa0)', marginTop: '2px' }}>
                  {device.type}
                  {device.location && ` · ${device.location}`}
                  {' · '}{formatTime(device.lastActive)}
                </div>
              </div>
              {!device.isCurrent && (
                <button
                  onClick={() => handleEndSession(device.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #e74c3c',
                    color: '#e74c3c',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Завершить
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

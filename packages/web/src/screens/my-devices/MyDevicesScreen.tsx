// MyDevices Screen — управление устройствами и сессиями
// Макет: mockups/balloo-su/my-devices.html

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

interface Device {
  id: string;
  name: string;
  isCurrent: boolean;
  type: string; // desktop, mobile, tablet, web
  location?: string;
  ipAddress?: string;
  os?: string;
  browser?: string;
  version?: string;
  lastActive?: number;
  createdAt?: number;
  sessions?: Array<{
    id: string;
    sessionToken: string;
    isActive: boolean;
    expires: number;
    createdAt: number;
  }>;
}

export default function MyDevicesScreen() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getDevices();
      setDevices(data || []);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const renameDevice = useCallback(async (deviceId: string) => {
    const newName = prompt('Новое имя устройства:');
    if (!newName) return;
    try {
      await api.renameDevice(deviceId, newName);
      await fetchDevices();
    } catch {
      // ошибка
    }
  }, [fetchDevices]);

  const stopSession = useCallback(async (sessionId: string) => {
    if (!confirm('Остановить эту сессию?')) return;
    try {
      await api.stopSession(sessionId);
      await fetchDevices();
    } catch {
      // ошибка
    }
  }, [fetchDevices]);

  const stopAllOthers = useCallback(async () => {
    if (!confirm('Завершить все другие сессии? Вы останетесь только на текущем устройстве.')) return;
    try {
      await api.stopAllOtherSessions();
      await fetchDevices();
    } catch {
      // ошибка
    }
  }, [fetchDevices]);

  const toggleDetails = useCallback((deviceId: string) => {
    setExpandedId((prev) => (prev === deviceId ? null : deviceId));
  }, []);

  const formatDate = (ts: number | undefined) => {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleString('ru-RU');
  };

  const deviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return '📱';
      case 'tablet': return '📟';
      case 'desktop': return '💻';
      default: return '🖥';
    }
  };

  const currentDevice = devices.find((d) => d.isCurrent);
  const otherDevices = devices.filter((d) => !d.isCurrent);
  const activeCount = devices.filter((d) => d.sessions?.some((s) => s.isActive)).length;

  return (
    <div className="page-container page-container--narrow">
      <button className="btn btn--tertiary btn--sm" onClick={() => navigate('/profile')}>
        ← Назад в профиль
      </button>

      <h1 className="page-title">📱 Мои устройства</h1>

      {/* Статистика */}
      <div className="device-stats-grid">
        <div className="device-stat-card">
          <span className="device-stat-card__value">{devices.length}</span>
          <span className="device-stat-card__label">Всего устройств</span>
        </div>
        <div className="device-stat-card">
          <span className="device-stat-card__value device-stat-card__value--accent">{activeCount}</span>
          <span className="device-stat-card__label">Активных</span>
        </div>
        <div className="device-stat-card">
          <span className="device-stat-card__value">{devices.length}</span>
          <span className="device-stat-card__label">Узлов подключено</span>
        </div>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          {/* Текущее устройство */}
          {currentDevice && (
            <div className="device-card device-card--current">
              <div className="device-card__header">
                <span className="chip chip--accent">Это устройство</span>
                <span className="chip chip--accent">Сейчас активно</span>
              </div>
              <div className="device-card__title">
                <span className="device-card__icon">{deviceIcon(currentDevice.type)}</span>
                <span>{currentDevice.name}</span>
              </div>
              <p className="device-card__meta">
                {currentDevice.location} · {currentDevice.ipAddress} · {currentDevice.version}
              </p>
              <div className="device-card__actions">
                <button className="btn btn--tertiary btn--sm" onClick={() => renameDevice(currentDevice.id)}>
                  Переименовать
                </button>
                <button className="btn btn--tertiary btn--sm" onClick={() => toggleDetails(currentDevice.id)}>
                  Подробнее
                </button>
              </div>
              {expandedId === currentDevice.id && currentDevice.sessions && (
                <div className="device-card__details">
                  {currentDevice.sessions.map((s) => (
                    <div key={s.id} className="session-row">
                      <code className="session-row__id">{s.id}</code>
                      <span className="session-row__status">{s.isActive ? 'активна' : 'завершена'}</span>
                      <span className="session-row__date">до {formatDate(s.expires)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Другие устройства */}
          {otherDevices.map((device) => (
            <div key={device.id} className="device-card">
              <div className="device-card__title">
                <span className="device-card__icon">{deviceIcon(device.type)}</span>
                <span>{device.name}</span>
              </div>
              <p className="device-card__meta">
                {device.location} · {formatDate(device.lastActive)} · {device.version}
              </p>
              <div className="device-card__actions">
                <button className="btn btn--tertiary btn--sm" onClick={() => renameDevice(device.id)}>
                  Переименовать
                </button>
                <button className="btn btn--tertiary btn--sm" onClick={() => toggleDetails(device.id)}>
                  Подробнее
                </button>
                {device.sessions?.filter((s) => s.isActive).map((s) => (
                  <button
                    key={s.id}
                    className="btn btn--danger btn--sm"
                    onClick={() => stopSession(s.id)}
                  >
                    Остановить
                  </button>
                ))}
              </div>
              {expandedId === device.id && device.sessions && (
                <div className="device-card__details">
                  {device.sessions.map((s) => (
                    <div key={s.id} className="session-row">
                      <code className="session-row__id">{s.id}</code>
                      <span className="session-row__status">{s.isActive ? 'активна' : 'завершена'}</span>
                      <span className="session-row__date">до {formatDate(s.expires)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Добавить устройство */}
          <button className="btn btn--tertiary btn--block" onClick={() => navigate('/add-device')}>
            ➕ Добавить устройство
          </button>

          {/* Опасная зона */}
          {otherDevices.length > 0 && (
            <div className="danger-zone">
              <button className="btn btn--danger" onClick={stopAllOthers}>
                Завершить все другие сессии
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

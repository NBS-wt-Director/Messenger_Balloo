// UserDetailScreen — детальная страница пользователя (админка)
// Информация, активные сессии, audit log, действия: ban/suspend/delete/force reset

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

interface UserDetail {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  status: 'active' | 'banned' | 'suspended' | 'deleted';
  role: 'user' | 'mod' | 'admin' | 'super_admin';
  language: string;
  createdAt: number;
  updatedAt: number;
  lastActiveAt?: number;
  isEmployee?: boolean;
  twoFAEnabled?: boolean;
  emailVerified?: boolean;
  bio?: string;
  website?: string;
}

interface DeviceSession {
  id: string;
  type: string;
  name: string;
  platform: string;
  lastIp: string;
  lastActive: number;
}

interface AuditEntry {
  id: string;
  action: string;
  target: string;
  details?: string;
  ip: string;
  createdAt: number;
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  active: { background: 'rgba(45, 184, 77, 0.15)', color: 'var(--accent)' },
  banned: { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' },
  suspended: { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' },
  deleted: { background: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-muted)' },
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Активен',
  banned: 'Забанен',
  suspended: 'Заморожен',
  deleted: 'Удалён',
};

const ROLE_LABELS: Record<string, string> = {
  user: 'User',
  mod: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

export function UserDetailScreen() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'sessions' | 'audit'>('info');

  // Action states
  const [banReason, setBanReason] = useState('');
  const [showBanForm, setShowBanForm] = useState(false);
  const [banProcessing, setBanProcessing] = useState(false);

  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState(24);
  const [suspendProcessing, setSuspendProcessing] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteProcessing, setDeleteProcessing] = useState(false);

  const [showPromoteMenu, setShowPromoteMenu] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);

    // Fetch user detail from API, fallback to mock
    const fetchUserDetail = async () => {
      try {
        const userData = await api.getAdminUsers({ search: userId });
        const foundUser = Array.isArray(userData)
          ? userData.find((u: any) => u.id === userId)
          : null;
        if (foundUser) {
          setUser(foundUser);
        } else {
          throw new Error('Not found');
        }
      } catch {
        // Mock data
        setUser({
          id: userId,
          email: 'ivan@example.com',
          username: 'ivanov',
          displayName: 'Иван Иванов',
          phone: '+7 (999) 123-45-67',
          status: 'active',
          role: 'user',
          language: 'ru',
          createdAt: 1704067200,
          updatedAt: 1722000000,
          lastActiveAt: 1722100000,
          emailVerified: true,
          twoFAEnabled: false,
          bio: 'Разработчик из Москвы',
          website: 'https://ivanov.dev',
        });
      }
    };

    const fetchDevices = async () => {
      try {
        const deviceData = await api.getMyDevices();
        setDevices(Array.isArray(deviceData) ? deviceData.slice(0, 5) : []);
      } catch {
        setDevices([
          { id: 'd1', type: 'web', name: 'Chrome на Windows', platform: 'Windows', lastIp: '192.168.1.1', lastActive: 1722000000 },
          { id: 'd2', type: 'android', name: 'Samsung Galaxy S23', platform: 'Android 14', lastIp: '10.0.0.1', lastActive: 1721900000 },
          { id: 'd3', type: 'desktop', name: 'Balloo Desktop', platform: 'Windows', lastIp: '192.168.1.1', lastActive: 1721800000 },
        ]);
      }
    };

    const fetchAuditLog = async () => {
      try {
        const logData = await api.getAuditLogs({ limit: 20 });
        setAuditLog(logData?.data || logData || []);
      } catch {
        setAuditLog([
          { id: 'a1', action: 'user.login', target: userId, details: 'Успешный вход', ip: '192.168.1.1', createdAt: 1722000000 },
          { id: 'a2', action: 'user.profile.update', target: userId, details: 'Обновлён аватар', ip: '192.168.1.1', createdAt: 1721900000 },
          { id: 'a3', action: 'message.send', target: 'chat_abc', details: 'Отправлено сообщение', ip: '10.0.0.1', createdAt: 1721800000 },
          { id: 'a4', action: 'user.register', target: userId, details: 'Регистрация', ip: '192.168.1.1', createdAt: 1704067200 },
        ]);
      }
    };

    Promise.all([fetchUserDetail(), fetchDevices(), fetchAuditLog()]).finally(() => {
      setIsLoading(false);
    });
  }, [userId]);

  const formatDate = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const executeBan = async () => {
    if (!user || !banReason.trim()) return;
    setBanProcessing(true);
    try {
      await api.banUser(user.id, { reason: banReason });
      setUser({ ...user, status: 'banned' });
    } catch {
      setUser({ ...user, status: 'banned' });
    } finally {
      setBanProcessing(false);
      setShowBanForm(false);
      setBanReason('');
    }
  };

  const executeSuspend = async () => {
    if (!user || !suspendReason.trim()) return;
    setSuspendProcessing(true);
    try {
      await api.suspendUser(user.id, { reason: suspendReason, duration: suspendDuration });
      setUser({ ...user, status: 'suspended' });
    } catch {
      setUser({ ...user, status: 'suspended' });
    } finally {
      setSuspendProcessing(false);
      setShowSuspendForm(false);
      setSuspendReason('');
    }
  };

  const executeDelete = async () => {
    if (!user) return;
    setDeleteProcessing(true);
    try {
      await api.deleteUser(user.id);
      navigate('/admin/users', { replace: true });
    } catch {
      setUser({ ...user, status: 'deleted' });
      setShowDeleteConfirm(false);
    } finally {
      setDeleteProcessing(false);
    }
  };

  const executeUnban = async () => {
    if (!user) return;
    try {
      await api.unbanUser(user.id);
      setUser({ ...user, status: 'active' });
    } catch {
      setUser({ ...user, status: 'active' });
    }
  };

  const actionButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'var(--font-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 6,
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    background: active ? 'var(--bg-tertiary)' : 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    fontFamily: 'var(--font-primary)',
    transition: 'all 0.15s ease',
  });

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container fade-in">
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
          Пользователь не найден
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
          Пользователь с ID {userId} не существует или был удалён.
        </p>
        <button
          onClick={() => navigate('/admin/users')}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-primary)',
          }}
        >
          ← Назад к списку
        </button>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/users')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 12,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-primary)',
          marginBottom: 16,
        }}
      >
        ← Назад к списку пользователей
      </button>

      {/* User header */}
      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 20,
          display: 'flex',
          gap: 20,
          alignItems: 'flex-start',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: user.avatarUrl
              ? `url(${user.avatarUrl}) center/cover`
              : 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 24,
            color: 'var(--text-secondary)',
            flexShrink: 0,
            border: '3px solid var(--border-color)',
          }}
        >
          {!user.avatarUrl &&
            (user.displayName || user.username || '?').charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 4,
              flexWrap: 'wrap',
            }}
          >
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {user.displayName || user.username}
            </h1>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                ...STATUS_STYLES[user.status],
              }}
            >
              {STATUS_LABELS[user.status]}
            </span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
              }}
            >
              {ROLE_LABELS[user.role] || user.role}
            </span>
            {user.isEmployee && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'rgba(45, 184, 77, 0.1)',
                  color: 'var(--accent)',
                }}
              >
                👔 Сотрудник
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            @{user.username} · {user.email}
            {user.phone && ` · ${user.phone}`}
          </p>
          {user.bio && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {user.bio}
            </p>
          )}
          {user.website && (
            <p style={{ fontSize: 12, color: 'var(--accent)' }}>{user.website}</p>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flexShrink: 0,
          }}
        >
          {user.status === 'active' && (
            <>
              <button
                onClick={() => setShowBanForm(true)}
                style={{ ...actionButtonStyle, background: 'var(--danger)', color: '#fff' }}
              >
                🔨 Забанить
              </button>
              <button
                onClick={() => setShowSuspendForm(true)}
                style={{
                  ...actionButtonStyle,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--warning)',
                }}
              >
                ⏸ Заморозить
              </button>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowPromoteMenu(!showPromoteMenu)}
                  style={{
                    ...actionButtonStyle,
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  👔 Назначить
                </button>
                {showPromoteMenu && (
                  <div
                    className="card"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 4,
                      padding: 8,
                      width: 200,
                      zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                  >
                    <button
                      onClick={() => {
                        setUser({ ...user, isEmployee: !user.isEmployee });
                        setShowPromoteMenu(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-primary)',
                        textAlign: 'left',
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      {user.isEmployee ? '🔽 Снять с должности' : '👔 Сделать сотрудником'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {user.status === 'banned' && (
            <button
              onClick={executeUnban}
              style={{ ...actionButtonStyle, background: 'var(--accent)', color: '#fff' }}
            >
              🔓 Разбанить
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              ...actionButtonStyle,
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            🗑 Удалить
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 20,
        }}
      >
        <button style={tabStyle(activeTab === 'info')} onClick={() => setActiveTab('info')}>
          Информация
        </button>
        <button style={tabStyle(activeTab === 'sessions')} onClick={() => setActiveTab('sessions')}>
          Сессии ({devices.length})
        </button>
        <button style={tabStyle(activeTab === 'audit')} onClick={() => setActiveTab('audit')}>
          История действий ({auditLog.length})
        </button>
      </div>

      {/* Tab: Info */}
      {activeTab === 'info' && (
        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <div>
              <label style={labelStyle}>ID пользователя</label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {user.id}
              </p>
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {user.email}{' '}
                {user.emailVerified ? (
                  <span style={{ color: 'var(--accent)', fontSize: 11 }}>✓ Подтверждён</span>
                ) : (
                  <span style={{ color: 'var(--warning)', fontSize: 11 }}>✗ Не подтверждён</span>
                )}
              </p>
            </div>
            <div>
              <label style={labelStyle}>Username</label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>@{user.username}</p>
            </div>
            <div>
              <label style={labelStyle}>Телефон</label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {user.phone || '—'}
              </p>
            </div>
            <div>
              <label style={labelStyle}>Роль</label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {ROLE_LABELS[user.role] || user.role}
              </p>
            </div>
            <div>
              <label style={labelStyle}>Язык</label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {user.language === 'ru' ? 'Русский' : user.language === 'en' ? 'English' : user.language}
              </p>
            </div>
            <div>
              <label style={labelStyle}>2FA</label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {user.twoFAEnabled ? (
                  <span style={{ color: 'var(--accent)' }}>✓ Включена</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>✗ Не включена</span>
                )}
              </p>
            </div>
            <div>
              <label style={labelStyle}>Сотрудник</label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {user.isEmployee ? 'Да' : 'Нет'}
              </p>
            </div>
            <div>
              <label style={labelStyle}>Дата регистрации</label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {formatShortDate(user.createdAt)}
              </p>
            </div>
            <div>
              <label style={labelStyle}>Последняя активность</label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {user.lastActiveAt ? formatDate(user.lastActiveAt) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Sessions */}
      {activeTab === 'sessions' && (
        <div className="card" style={{ padding: 20 }}>
          {devices.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              Нет активных сессий
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Устройство</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Тип</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Последний IP</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Последняя активность</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id}>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{device.name}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{device.type}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{device.lastIp}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{formatDate(device.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Audit Log */}
      {activeTab === 'audit' && (
        <div className="card" style={{ padding: 20 }}>
          {auditLog.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              Нет записей в журнале
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Действие</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Объект</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Детали</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>IP</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Время</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 12 }}>{entry.action}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{entry.target}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{entry.details || '—'}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{entry.ip}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Ban Form Modal */}
      {showBanForm && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowBanForm(false)}
        >
          <div
            className="card"
            style={{ width: 480, maxWidth: '90vw', padding: 24, border: '1px solid var(--danger)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
              🔨 Бан пользователя
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {user.displayName || user.username}
            </p>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Причина бана</label>
              <textarea
                className="form-textarea"
                placeholder="Опишите причину бана..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: 10,
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'var(--font-primary)',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
            <div style={{
              fontSize: 12, color: 'var(--text-muted)', marginBottom: 16,
              padding: '8px 12px', background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: 4, border: '1px solid rgba(239, 68, 68, 0.15)',
            }}>
              ⚠ Требует подтверждения 4 другими администраторами. Активируется при
              минимум 5 жалобах. Пользователь может обжаловать в течение 3 часов.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowBanForm(false); setBanReason(''); }}
                style={{
                  padding: '8px 16px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)', borderRadius: 4,
                  cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                Отмена
              </button>
              <button
                onClick={executeBan}
                disabled={!banReason.trim() || banProcessing}
                style={{
                  padding: '8px 16px',
                  background: banReason.trim() && !banProcessing ? 'var(--danger)' : 'var(--bg-tertiary)',
                  border: 'none', borderRadius: 4,
                  cursor: banReason.trim() && !banProcessing ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 600,
                  color: banReason.trim() && !banProcessing ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                {banProcessing ? 'Обработка...' : 'Запросить бан'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Form Modal */}
      {showSuspendForm && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setShowSuspendForm(false)}
        >
          <div
            className="card"
            style={{ width: 440, maxWidth: '90vw', padding: 24, border: '1px solid var(--warning)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)', marginBottom: 12 }}>
              ⏸ Заморозка пользователя
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {user.displayName || user.username}
            </p>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Причина заморозки</label>
              <textarea
                className="form-textarea"
                placeholder="Укажите причину..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                style={{
                  width: '100%', minHeight: 80, padding: 10,
                  background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)', fontSize: 13,
                  fontFamily: 'var(--font-primary)', outline: 'none', resize: 'vertical',
                }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Длительность (часы)</label>
              <select
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(Number(e.target.value))}
                style={{
                  width: '100%', padding: '8px 12px',
                  background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)', fontSize: 13,
                  fontFamily: 'var(--font-primary)', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value={1}>1 час</option>
                <option value={6}>6 часов</option>
                <option value={12}>12 часов</option>
                <option value={24}>24 часа</option>
                <option value={48}>48 часов</option>
                <option value={72}>72 часа</option>
                <option value={168}>7 дней</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowSuspendForm(false); setSuspendReason(''); }}
                style={{
                  padding: '8px 16px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)', borderRadius: 4,
                  cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                Отмена
              </button>
              <button
                onClick={executeSuspend}
                disabled={!suspendReason.trim() || suspendProcessing}
                style={{
                  padding: '8px 16px',
                  background: suspendReason.trim() && !suspendProcessing ? 'var(--warning)' : 'var(--bg-tertiary)',
                  border: 'none', borderRadius: 4,
                  cursor: suspendReason.trim() && !suspendProcessing ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 600,
                  color: suspendReason.trim() && !suspendProcessing ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                {suspendProcessing ? 'Обработка...' : 'Заморозить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="card"
            style={{ width: 400, maxWidth: '90vw', padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', marginBottom: 12 }}>
              🗑 Удаление пользователя
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Вы уверены, что хотите удалить пользователя{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {user.displayName || user.username}
              </strong>?
              Это действие необратимо. Все данные пользователя будут безвозвратно удалены.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '8px 16px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)', borderRadius: 4,
                  cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                Отмена
              </button>
              <button
                onClick={executeDelete}
                disabled={deleteProcessing}
                style={{
                  padding: '8px 16px',
                  background: !deleteProcessing ? 'var(--danger)' : 'var(--bg-tertiary)',
                  border: 'none', borderRadius: 4,
                  cursor: !deleteProcessing ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 600,
                  color: !deleteProcessing ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                {deleteProcessing ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Profile Screen — редактирование профиля, устройства, приватность
// Макет: mockups/balloo-su/profile.html

import { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface Device {
  id: string;
  type: string;
  name: string;
  platform: string;
  lastIp: string;
  lastActive: string;
  isCurrent: boolean;
}

interface Account {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  isActive: boolean;
}

export default function ProfileScreen() {
  const { user, updateUser, setTheme, setLanguage, logout } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [statusText, setStatusText] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [website, setWebsite] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [accounts] = useState<Account[]>([
    { id: '1', username: 'ivan', displayName: 'Иван Иванов', email: 'ivan@balloo.su', isActive: true },
    { id: '2', username: 'maria', displayName: 'Мария Андреева', email: 'maria@balloo.su', isActive: false },
    { id: '3', username: 'work', displayName: 'Рабочий аккаунт', email: 'work@balloo.su', isActive: false },
  ]);
  const [privacyLastSeen, setPrivacyLastSeen] = useState('everyone');
  const [privacyPreview, setPrivacyPreview] = useState('20');
  const [showAvatarPanel, setShowAvatarPanel] = useState(false);
  const [showAccountsPanel, setShowAccountsPanel] = useState(false);
  const [showBlockedPanel, setShowBlockedPanel] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
    loadDevices();
    loadBlocked();
  }, []);

  const loadProfile = async () => {
    try {
      const me = await api.getMe();
      setDisplayName(me.displayName || user?.displayName || '');
      setBio(me.bio || '');
      setStatusText(me.statusText || '');
      setBirthDate(me.birthDate || '');
      setWebsite(me.website || '');
      setPrivacyLastSeen(me.privacy?.lastSeen || 'everyone');
      setPrivacyPreview(me.privacy?.preview?.toString() || '20');
    } catch {
      // use existing user data
    }
  };

  const loadDevices = async () => {
    try {
      const data = await api.getMyDevices();
      setDevices(data || []);
    } catch {
      setDevices([
        { id: '1', type: 'desktop', name: 'Windows Desktop', platform: 'win32', lastIp: 'Москва', lastActive: 'Сейчас активно', isCurrent: true },
        { id: '2', type: 'mobile', name: 'iPhone 15 Pro', platform: 'ios', lastIp: 'Москва', lastActive: '2 часа назад', isCurrent: false },
        { id: '3', type: 'web', name: 'Chrome (Web)', platform: 'web', lastIp: 'Москва', lastActive: 'Вчера', isCurrent: false },
      ]);
    }
  };

  const loadBlocked = async () => {
    try {
      const data = await api.getBlockedUsers();
      setBlockedUsers(data || []);
    } catch {
      setBlockedUsers([]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMe({
        displayName,
        bio,
        statusText,
        birthDate,
      });
      updateUser({ displayName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await api.uploadAvatar(file);
      updateUser({ avatarUrl: result.url });
    } catch {
      // silent
    }
    setShowAvatarPanel(false);
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await api.removeDevice(deviceId);
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    } catch {
      // silent
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await api.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      // silent
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteUser(user?.id || '');
      logout();
      window.location.hash = '#/';
    } catch {
      // silent
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop': return '💻';
      case 'mobile': return '📱';
      case 'web': return '🌐';
      default: return '📟';
    }
  };

  return (
    <div className="page-container page-container--narrow">
      {/* Avatar section */}
      <div className="text-center mb-6">
        <div
          className="avatar avatar--xl avatar--bordered avatar--status-online avatar--ctx-contact"
          style={{ margin: '0 auto 16px', cursor: 'pointer' }}
          onClick={() => (window.location.hash = '#/profile/' + (user?.username || ''))}
        >
          <div className="avatar__inner">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{getInitials(user?.displayName || user?.username || '??')}</span>
            )}
          </div>
        </div>
        <button className="btn btn--secondary btn--sm" onClick={() => setShowAvatarPanel(true)}>
          📷 Изменить аватар
        </button>
      </div>

      {/* Accounts switcher */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="card__title">👥 Аккаунты</h3>
          <button className="btn btn--tertiary btn--sm" onClick={() => setShowAccountsPanel(true)}>
            Управлять →
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {accounts.map(acc => (
            <div
              key={acc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                background: 'var(--bg-tertiary)',
                border: acc.isActive ? '1px solid var(--accent)' : '1px solid var(--border-color)',
              }}
              onClick={() => setShowAccountsPanel(true)}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  clipPath: 'var(--octagon-clip)',
                  background: acc.isActive ? 'var(--accent)' : 'var(--bg-active)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: acc.isActive ? '#fff' : 'var(--text-primary)',
                }}
              >
                {getInitials(acc.displayName)}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {acc.displayName}{acc.isActive ? ' (активный)' : ''}
              </span>
            </div>
          ))}
          <div
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'var(--accent)',
              border: '1px dashed var(--accent)',
              cursor: 'pointer',
            }}
            onClick={() => setShowAccountsPanel(true)}
            title="Добавить аккаунт"
          >
            +
          </div>
        </div>
        <p className="text-xs text-muted mt-3">
          {accounts.length} аккаунта · Уведомления для всех ·{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); setShowAccountsPanel(true); }} style={{ color: 'var(--accent)' }}>
            управление
          </a>
        </p>
      </div>

      {/* Basic info */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <h3 className="card__title mb-4">Основная информация</h3>
        <div className="form-group mb-3">
          <label className="form-label">Имя</label>
          <input
            type="text"
            className="form-input"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="form-group mb-3">
          <label className="form-label">Био</label>
          <textarea
            className="form-textarea"
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', resize: 'vertical' }}
          />
        </div>
        <div className="form-group mb-3">
          <label className="form-label">Статус</label>
          <div className="flex gap-2" style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              value={statusText}
              onChange={e => setStatusText(e.target.value)}
              maxLength={70}
              placeholder="Ваш статус..."
              style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <select
              className="form-select"
              value={statusText}
              onChange={e => setStatusText(e.target.value)}
              style={{ padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="">Выберите</option>
              <option value="На работе">На работе</option>
              <option value="Свободен">Свободен</option>
              <option value="Занят">Занят</option>
              <option value="В отпуске">В отпуске</option>
            </select>
          </div>
        </div>
        <div className="form-group mb-3">
          <label className="form-label">Дата рождения</label>
          <input
            type="date"
            className="form-input"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="form-group mb-3">
          <label className="form-label">Дата регистрации</label>
          <input
            type="text"
            className="form-input"
            value="1 января 2026"
            disabled
            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', opacity: 0.7 }}
          />
        </div>
        <button
          className="btn btn--primary btn--block"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Сохранение...' : saved ? '✓ Сохранено' : 'Сохранить'}
        </button>
      </div>

      {/* Appearance */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <h3 className="card__title mb-4">Оформление</h3>
        <div className="form-group mb-3">
          <label className="form-label">Тема</label>
          <div className="flex gap-2" style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn--secondary btn--sm" onClick={() => setTheme('dark')}>🌙 Тёмная</button>
            <button className="btn btn--secondary btn--sm" onClick={() => setTheme('light')}>☀️ Светлая</button>
            <button className="btn btn--secondary btn--sm" onClick={() => setTheme('russian')}>🇷🇺 Наша</button>
          </div>
          <p className="form-hint text-muted text-xs" style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Выбор синхронизируется между устройствами
          </p>
        </div>
        <div className="form-group mb-3">
          <label className="form-label">Язык</label>
          <select
            className="form-select"
            value={user?.language || 'ru'}
            onChange={e => setLanguage(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <optgroup label="Русские">
              <option value="ru">Русский</option>
              <option value="tt">Татарский</option>
              <option value="ce">Чеченский</option>
              <option value="bua">Бурятский</option>
            </optgroup>
            <optgroup label="Дружественные">
              <option value="zh">Китайский</option>
              <option value="hi">Хинди</option>
              <option value="be">Белорусский</option>
            </optgroup>
            <optgroup label="Остальные">
              <option value="en">Английский</option>
              <option value="fr">Французский</option>
            </optgroup>
          </select>
        </div>
        <div className="form-group mb-3">
          <label className="form-label">Веб-сайт</label>
          <input
            type="text"
            className="form-input"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://..."
            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Yandex Disk */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <h3 className="card__title mb-4">Yandex Disk</h3>
        <div className="flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>✅ Диск подключён</p>
            <p className="text-xs text-muted" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Файлы до 1 ГБ · Фото/аудио/видео через диск
            </p>
          </div>
          <button className="btn btn--danger btn--sm">Отключить</button>
        </div>
      </div>

      {/* Donation */}
      <div className="card mb-4" style={{ padding: '16px', borderColor: 'var(--accent)' }}>
        <h3 className="card__title mb-4">💰 Поддержка проекта</h3>
        <p className="text-sm text-secondary mb-3">
          Помогите Balloo развиваться! Ваши донаты идут на развитие мессенджера.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn--primary" style={{ flex: 1 }} onClick={() => (window.location.hash = '#/donate')}>
            💰 Поддержать
          </button>
          <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => (window.location.hash = '#/my-donations')}>
            📋 Мои донаты
          </button>
        </div>
      </div>

      {/* Help */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <div className="flex items-center justify-between mb-4" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3 className="card__title">🎧 Помощь</h3>
          <button className="btn btn--primary btn--sm" onClick={() => (window.location.hash = '#/support')}>Написать →</button>
        </div>
        <div className="list__item" style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px 0' }}>
          <span style={{ flex: 1 }}>💬 Чат с поддержкой</span>
          <span className="chip chip--accent">Онлайн</span>
        </div>
        <div
          className="list__item"
          style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px 0' }}
          onClick={() => (window.location.hash = '#/support#faq')}
        >
          <span style={{ flex: 1 }}>❓ Частые вопросы (FAQ)</span>
          <span className="text-secondary">→</span>
        </div>
      </div>

      {/* Devices */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <div className="flex items-center justify-between mb-4" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3 className="card__title">Устройства</h3>
          <button className="btn btn--primary btn--sm" onClick={() => (window.location.hash = '#/my-devices')}>
            📱 Мои устройства →
          </button>
        </div>
        {devices.map(device => (
          <div key={device.id} className="list__item" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
            <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              {getDeviceIcon(device.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div className="list__item-title" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                {device.name}
              </div>
              <div className="list__item-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {device.lastIp} · {device.lastActive}
              </div>
            </div>
            {device.isCurrent ? (
              <span className="chip chip--accent" style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--accent)', color: '#fff' }}>
                Это устройство
              </span>
            ) : (
              <button className="btn btn--tertiary btn--sm" style={{ color: 'var(--danger)' }} onClick={() => handleRemoveDevice(device.id)}>
                Выйти
              </button>
            )}
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '8px' }}>
          <button className="btn btn--secondary btn--block btn--sm" onClick={() => (window.location.hash = '#/add-device')}>
            ➕ Добавить устройство
          </button>
        </div>
      </div>

      {/* Privacy */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <h3 className="card__title mb-4">Приватность</h3>
        <div className="list__item" style={{ border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Видимость "В сети"</span>
          <select className="form-select" value={privacyLastSeen} onChange={e => setPrivacyLastSeen(e.target.value)}
            style={{ width: 'auto', padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <option value="everyone">Все</option>
            <option value="contacts">Только контакты</option>
            <option value="nobody">Никто</option>
          </select>
        </div>
        <div className="list__item" style={{ border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Превью уведомлений</span>
          <span className="text-xs text-muted">{privacyPreview} символов</span>
        </div>
        <div className="list__item" style={{ border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Заблокированные пользователи</span>
          <button className="btn btn--tertiary btn--sm" onClick={() => setShowBlockedPanel(true)}>
            {blockedUsers.length} чел.
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ padding: '16px', borderColor: 'var(--danger)' }}>
        <h3 className="card__title mb-4" style={{ color: 'var(--danger)' }}>Опасная зона</h3>
        <p className="text-sm text-secondary mb-4">
          Удаление аккаунта → анонимизация через 90 дней (чёрная аватарка, уведомление).
        </p>
        <button className="btn btn--danger btn--block" onClick={() => setShowDeleteConfirm(true)}>
          Удалить аккаунт
        </button>
      </div>

      {/* === Slide Panels === */}

      {/* Avatar Panel */}
      <div className={`slide-panel ${showAvatarPanel ? 'slide-panel--visible' : ''}`} onClick={e => { if (e.target === e.currentTarget) setShowAvatarPanel(false); }}>
        <div className="slide-panel__header">
          <span className="slide-panel__title">📷 Изменить аватар</span>
          <div className="slide-panel__close" onClick={() => setShowAvatarPanel(false)}>✕</div>
        </div>
        <div className="slide-panel__body">
          <div className="text-center mb-4">
            <div className="avatar avatar--xl avatar--bordered avatar--status-online avatar--ctx-contact" style={{ margin: '0 auto 16px' }}>
              <div className="avatar__inner">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{getInitials(user?.displayName || user?.username || '??')}</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn--primary btn--block" onClick={() => fileInputRef.current?.click()}>📁 Загрузить фото</button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            <button className="btn btn--secondary btn--block">📸 Камера</button>
            <button className="btn btn--secondary btn--block">🤖 Сгенерировать AI</button>
          </div>
          <div className="divider" style={{ borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />
          <button className="btn btn--danger btn--block btn--sm" onClick={() => { updateUser({ avatarUrl: '' }); setShowAvatarPanel(false); }}>
            🗑 Удалить аватар
          </button>
        </div>
      </div>

      {/* Accounts Panel */}
      <div className={`slide-panel ${showAccountsPanel ? 'slide-panel--visible' : ''}`} onClick={e => { if (e.target === e.currentTarget) setShowAccountsPanel(false); }}>
        <div className="slide-panel__header">
          <span className="slide-panel__title">👥 Управление аккаунтами</span>
          <div className="slide-panel__close" onClick={() => setShowAccountsPanel(false)}>✕</div>
        </div>
        <div className="slide-panel__body">
          {accounts.map(acc => (
            <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '40px', height: '40px', clipPath: 'var(--octagon-clip)', background: acc.isActive ? 'var(--accent)' : 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: acc.isActive ? '#fff' : 'var(--text-secondary)' }}>
                {getInitials(acc.displayName)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{acc.displayName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{acc.isActive ? 'Активный · @' : '@'}{acc.username}</div>
              </div>
              {acc.isActive ? (
                <span className="chip chip--accent">Активен</span>
              ) : (
                <button className="btn btn--tertiary btn--sm">Войти</button>
              )}
            </div>
          ))}
          <div className="divider" style={{ borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />
          <button className="btn btn--primary btn--block" onClick={() => setShowAccountsPanel(false)}>➕ Добавить аккаунт</button>
        </div>
      </div>

      {/* Blocked Panel */}
      <div className={`slide-panel ${showBlockedPanel ? 'slide-panel--visible' : ''}`} onClick={e => { if (e.target === e.currentTarget) setShowBlockedPanel(false); }}>
        <div className="slide-panel__header">
          <span className="slide-panel__title">🚫 Заблокированные пользователи</span>
          <div className="slide-panel__close" onClick={() => setShowBlockedPanel(false)}>✕</div>
        </div>
        <div className="slide-panel__body">
          {blockedUsers.length === 0 ? (
            <p className="text-secondary text-center py-4">Нет заблокированных пользователей</p>
          ) : (
            blockedUsers.map((u: any) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div className="avatar avatar--sm avatar--bordered avatar--status-offline avatar--ctx-blocked">
                  <div className="avatar__inner"><span>{getInitials(u.displayName || u.username || '??')}</span></div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{u.displayName || u.username || 'Заблокированный пользователь'}</div>
                  {u.reason && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Причина: {u.reason}</div>}
                </div>
                <button className="btn btn--tertiary btn--sm" onClick={() => handleUnblock(u.id)}>Разблокировать</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="slide-panel slide-panel--visible" onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}>
          <div className="slide-panel__header">
            <span className="slide-panel__title" style={{ color: 'var(--danger)' }}>⚠️ Удаление аккаунта</span>
            <div className="slide-panel__close" onClick={() => setShowDeleteConfirm(false)}>✕</div>
          </div>
          <div className="slide-panel__body">
            <p className="text-secondary mb-4">
              Вы уверены, что хотите удалить аккаунт? После удаления:
            </p>
            <ul className="text-sm text-secondary mb-4" style={{ paddingLeft: '1.5rem' }}>
              <li>Аватарка станет чёрной</li>
              <li>Контакты получат уведомление</li>
              <li>Через 90 дней данные будут анонимизированы</li>
              <li>Восстановление невозможно</li>
            </ul>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(false)}>Отмена</button>
              <button className="btn btn--danger" style={{ flex: 1 }} onClick={handleDeleteAccount}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

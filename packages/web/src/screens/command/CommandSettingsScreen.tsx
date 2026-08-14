// Command Settings Screen — Настройки портала сотрудников (command.balloo.su)
// Профиль сотрудника, отдел, уведомления, безопасность

import { useState } from 'react';

interface EmployeeProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  manager: string;
  joinDate: string;
  avatarUrl: string;
  bio: string;
  website: string;
  socialLinks: { platform: string; url: string }[];
}

interface NotificationPrefs {
  pushEnabled: boolean;
  emailEnabled: boolean;
  chatEnabled: boolean;
  meetingReminders: boolean;
  taskNotifications: boolean;
  blogNotifications: boolean;
  dndStart: string;
  dndEnd: string;
  dndEnabled: boolean;
}

interface SecuritySettings {
  twoFAEnabled: boolean;
  twoFAMethod: 'totp' | 'sms' | 'email';
  activeSessions: { id: string; device: string; browser: string; ip: string; lastActive: string; isCurrent: boolean }[];
  passwordChangedAt: string;
}

const mockProfile: EmployeeProfile = {
  id: '1',
  name: 'Иван Иванов',
  username: 'ivanov',
  email: 'ivan@balloo.su',
  phone: '+7 (999) 123-45-67',
  position: 'Tech Lead',
  department: 'Разработка',
  manager: 'Алексей Сидоров',
  joinDate: '15 марта 2024',
  avatarUrl: '',
  bio: 'Tech Lead в команде разработки. Отвечаю за архитектуру и менторинг.',
  website: 'https://ivanov.dev',
  socialLinks: [
    { platform: 'github', url: 'https://github.com/ivanov' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/ivanov' },
  ],
};

const mockNotifications: NotificationPrefs = {
  pushEnabled: true,
  emailEnabled: false,
  chatEnabled: true,
  meetingReminders: true,
  taskNotifications: true,
  blogNotifications: false,
  dndStart: '22:00',
  dndEnd: '08:00',
  dndEnabled: false,
};

const mockSecurity: SecuritySettings = {
  twoFAEnabled: true,
  twoFAMethod: 'totp',
  activeSessions: [
    { id: '1', device: 'Chrome', browser: 'Chrome 126', ip: '192.168.1.1', lastActive: 'Сейчас', isCurrent: true },
    { id: '2', device: 'Firefox', browser: 'Firefox 127', ip: '192.168.1.2', lastActive: '2 часа назад', isCurrent: false },
    { id: '3', device: 'Mobile', browser: 'Balloo App', ip: '10.0.0.1', lastActive: '1 день назад', isCurrent: false },
  ],
  passwordChangedAt: '15 июля 2025',
};

type TabType = 'profile' | 'department' | 'notifications' | 'security';

export function CommandSettingsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profile, setProfile] = useState<EmployeeProfile>(mockProfile);
  const [notifications, setNotifications] = useState<NotificationPrefs>(mockNotifications);
  const [security, setSecurity] = useState<SecuritySettings>(mockSecurity);
  const [editing, setEditing] = useState(false);
  const [showTerminateSession, setShowTerminateSession] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'profile', label: 'Профиль', icon: '👤' },
    { id: 'department', label: 'Отдел', icon: '🏢' },
    { id: 'notifications', label: 'Уведомления', icon: '🔔' },
    { id: 'security', label: 'Безопасность', icon: '🔒' },
  ];

  const handleSave = () => {
    setEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancel = () => {
    setProfile(mockProfile);
    setNotifications(mockNotifications);
    setSecurity(mockSecurity);
    setEditing(false);
  };

  const handleTerminateSession = (sessionId: string) => {
    setSecurity(prev => ({
      ...prev,
      activeSessions: prev.activeSessions.filter(s => s.id !== sessionId),
    }));
    setShowTerminateSession(null);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) return;
    if (newPassword.length < 8) return;
    setShowChangePassword(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Настройки</h1>
          <p className="page-subtitle">Профиль, отдел, уведомления, безопасность</p>
        </div>
        {editing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn--ghost"
              onClick={handleCancel}
              style={{ padding: '8px 16px' }}
            >
              Отмена
            </button>
            <button
              className="btn btn--accent"
              onClick={handleSave}
              style={{ padding: '8px 16px' }}
            >
              Сохранить
            </button>
          </div>
        )}
      </div>

      {/* Save success toast */}
      {saveSuccess && (
        <div
          style={{
            background: 'var(--accent)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 8,
            marginBottom: 16,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          ✅ Настройки сохранены
        </div>
      )}

      {/* Tabs */}
      <div className="tabs mb-4" data-tab-group="settings">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ cursor: 'pointer' }}
          >
            <span style={{ marginRight: 6 }}>{tab.icon}</span>
            {tab.label}
          </div>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div>
          <div className="card mb-4" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 'var(--octagon-clip)',
                    background: 'linear-gradient(135deg, var(--accent), #1a8f3a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 32,
                    fontWeight: 800,
                    border: '3px solid var(--bg-secondary)',
                    boxShadow: '0 0 0 2px var(--accent)',
                  }}
                >
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </div>
                {editing && (
                  <button
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--octagon-clip)',
                      background: 'var(--accent)',
                      color: 'white',
                      border: '2px solid var(--bg-secondary)',
                      cursor: 'pointer',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Изменить аватар"
                  >
                    📷
                  </button>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700 }}>
                  {editing ? (
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      style={{ fontSize: 24, fontWeight: 700, width: '100%', border: 'none', borderBottom: '2px solid var(--accent)', background: 'transparent', padding: '4px 0' }}
                    />
                  ) : (
                    profile.name
                  )}
                </h2>
                <p style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: 14 }}>
                  @{profile.username}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="chip chip--info">{profile.position}</span>
                  <span className="chip chip--accent">{profile.department}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Личные данные</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Имя
                </label>
                {editing ? (
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                ) : (
                  <div style={{ padding: '10px 0', fontSize: 14, color: 'var(--text-primary)' }}>{profile.name}</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Email
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                ) : (
                  <div style={{ padding: '10px 0', fontSize: 14, color: 'var(--text-primary)' }}>{profile.email}</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Телефон
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                ) : (
                  <div style={{ padding: '10px 0', fontSize: 14, color: 'var(--text-primary)' }}>{profile.phone}</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Должность
                </label>
                {editing ? (
                  <input
                    value={profile.position}
                    onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                ) : (
                  <div style={{ padding: '10px 0', fontSize: 14, color: 'var(--text-primary)' }}>{profile.position}</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Сайт
                </label>
                {editing ? (
                  <input
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                ) : (
                  <div style={{ padding: '10px 0', fontSize: 14 }}>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{profile.website}</a>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                О себе
              </label>
              {editing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }}
                />
              ) : (
                <div style={{ padding: '10px 0', fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{profile.bio}</div>
              )}
            </div>

            {!editing && (
              <button
                className="btn btn--accent"
                onClick={() => setEditing(true)}
                style={{ marginTop: 20 }}
              >
                ✏️ Редактировать
              </button>
            )}
          </div>
        </div>
      )}

      {/* Department Tab */}
      {activeTab === 'department' && (
        <div>
          <div className="card mb-4" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Информация об отделе</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Отдел</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{profile.department}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Должность</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{profile.position}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Руководитель</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 'var(--octagon-clip)',
                      background: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>
                      АС
                    </div>
                    {profile.manager}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Дата найма</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{profile.joinDate}</div>
              </div>
            </div>
          </div>

          {/* Team members */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Моя команда</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
              {[
                { name: 'Иван Иванов', initials: 'ИВ', role: 'Tech Lead', online: true, isMe: true },
                { name: 'Алексей Козлов', initials: 'АК', role: 'Backend Developer', online: true, isMe: false },
                { name: 'Ольга Смирнова', initials: 'ОС', role: 'DevOps Engineer', online: false, isMe: false },
                { name: 'Елена Волкова', initials: 'ЕВ', role: 'UI/UX Designer', online: true, isMe: false },
                { name: 'Дмитрий Соколов', initials: 'ДС', role: 'Backend Developer', online: true, isMe: false },
              ].map((member) => (
                <div
                  key={member.name}
                  className="card"
                  style={{
                    padding: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    opacity: member.isMe ? 1 : 0.85,
                    border: member.isMe ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--octagon-clip)',
                      background: member.isMe ? 'var(--accent)' : 'var(--info)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 13, fontWeight: 700,
                    }}>
                      {member.initials}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0, width: 12, height: 12,
                      borderRadius: '50%', background: member.online ? 'var(--accent)' : 'var(--text-muted)',
                      border: '2px solid var(--bg-primary)',
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.name} {member.isMe && <span style={{ color: 'var(--accent)', fontSize: 11 }}>(Вы)</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{member.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Предпочтения уведомлений</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Push */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Push-уведомления</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Получать push-уведомления в браузере</div>
              </div>
              <label style={{ position: 'relative', width: 48, height: 26, display: 'inline-block' }}>
                <input
                  type="checkbox"
                  checked={notifications.pushEnabled}
                  onChange={(e) => setNotifications({ ...notifications, pushEnabled: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <span
                  style={{
                    position: 'absolute', inset: 0, background: notifications.pushEnabled ? 'var(--accent)' : 'var(--border-color)',
                    borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s',
                  }}
                />
                <span
                  style={{
                    position: 'absolute', top: 2,
                    left: notifications.pushEnabled ? 26 : 2,
                    width: 22, height: 22, background: 'white', borderRadius: '50%',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </label>
            </div>

            {/* Email */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Email-уведомления</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Получать уведомления на email</div>
              </div>
              <label style={{ position: 'relative', width: 48, height: 26, display: 'inline-block' }}>
                <input
                  type="checkbox"
                  checked={notifications.emailEnabled}
                  onChange={(e) => setNotifications({ ...notifications, emailEnabled: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <span
                  style={{
                    position: 'absolute', inset: 0, background: notifications.emailEnabled ? 'var(--accent)' : 'var(--border-color)',
                    borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s',
                  }}
                />
                <span
                  style={{
                    position: 'absolute', top: 2,
                    left: notifications.emailEnabled ? 26 : 2,
                    width: 22, height: 22, background: 'white', borderRadius: '50%',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </label>
            </div>

            {/* Chat */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Уведомления чата</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Новые сообщения в чатах</div>
              </div>
              <label style={{ position: 'relative', width: 48, height: 26, display: 'inline-block' }}>
                <input
                  type="checkbox"
                  checked={notifications.chatEnabled}
                  onChange={(e) => setNotifications({ ...notifications, chatEnabled: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <span
                  style={{
                    position: 'absolute', inset: 0, background: notifications.chatEnabled ? 'var(--accent)' : 'var(--border-color)',
                    borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s',
                  }}
                />
                <span
                  style={{
                    position: 'absolute', top: 2,
                    left: notifications.chatEnabled ? 26 : 2,
                    width: 22, height: 22, background: 'white', borderRadius: '50%',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </label>
            </div>

            {/* Meeting reminders */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Напоминания о совещаниях</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>За 15 минут до начала встречи</div>
              </div>
              <label style={{ position: 'relative', width: 48, height: 26, display: 'inline-block' }}>
                <input
                  type="checkbox"
                  checked={notifications.meetingReminders}
                  onChange={(e) => setNotifications({ ...notifications, meetingReminders: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <span
                  style={{
                    position: 'absolute', inset: 0, background: notifications.meetingReminders ? 'var(--accent)' : 'var(--border-color)',
                    borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s',
                  }}
                />
                <span
                  style={{
                    position: 'absolute', top: 2,
                    left: notifications.meetingReminders ? 26 : 2,
                    width: 22, height: 22, background: 'white', borderRadius: '50%',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </label>
            </div>

            {/* Task notifications */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Уведомления задач</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Новые и изменённые задачи</div>
              </div>
              <label style={{ position: 'relative', width: 48, height: 26, display: 'inline-block' }}>
                <input
                  type="checkbox"
                  checked={notifications.taskNotifications}
                  onChange={(e) => setNotifications({ ...notifications, taskNotifications: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <span
                  style={{
                    position: 'absolute', inset: 0, background: notifications.taskNotifications ? 'var(--accent)' : 'var(--border-color)',
                    borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s',
                  }}
                />
                <span
                  style={{
                    position: 'absolute', top: 2,
                    left: notifications.taskNotifications ? 26 : 2,
                    width: 22, height: 22, background: 'white', borderRadius: '50%',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </label>
            </div>

            {/* Blog notifications */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Уведомления блога</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Новые посты в корпоративном блоге</div>
              </div>
              <label style={{ position: 'relative', width: 48, height: 26, display: 'inline-block' }}>
                <input
                  type="checkbox"
                  checked={notifications.blogNotifications}
                  onChange={(e) => setNotifications({ ...notifications, blogNotifications: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <span
                  style={{
                    position: 'absolute', inset: 0, background: notifications.blogNotifications ? 'var(--accent)' : 'var(--border-color)',
                    borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s',
                  }}
                />
                <span
                  style={{
                    position: 'absolute', top: 2,
                    left: notifications.blogNotifications ? 26 : 2,
                    width: 22, height: 22, background: 'white', borderRadius: '50%',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </label>
            </div>

            {/* DND */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Не беспокоить</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Отключить уведомления в указанное время</div>
                </div>
                <label style={{ position: 'relative', width: 48, height: 26, display: 'inline-block' }}>
                  <input
                    type="checkbox"
                    checked={notifications.dndEnabled}
                    onChange={(e) => setNotifications({ ...notifications, dndEnabled: e.target.checked })}
                    style={{ display: 'none' }}
                  />
                  <span
                    style={{
                      position: 'absolute', inset: 0, background: notifications.dndEnabled ? 'var(--accent)' : 'var(--border-color)',
                      borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute', top: 2,
                      left: notifications.dndEnabled ? 26 : 2,
                      width: 22, height: 22, background: 'white', borderRadius: '50%',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </label>
              </div>
              {notifications.dndEnabled && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingLeft: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                      С
                    </label>
                    <input
                      type="time"
                      value={notifications.dndStart}
                      onChange={(e) => setNotifications({ ...notifications, dndStart: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                      До
                    </label>
                    <input
                      type="time"
                      value={notifications.dndEnd}
                      onChange={(e) => setNotifications({ ...notifications, dndEnd: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div>
          {/* 2FA */}
          <div className="card mb-4" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Двухфакторная аутентификация</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {security.twoFAEnabled ? '✅ 2FA включена' : '❌ 2FA отключена'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Метод: {security.twoFAMethod === 'totp' ? 'Google Authenticator' : security.twoFAMethod === 'sms' ? 'SMS' : 'Email'}
                </div>
              </div>
              <button
                className="btn btn--outline"
                style={{ padding: '8px 16px' }}
              >
                {security.twoFAEnabled ? 'Настроить' : 'Включить'}
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="card mb-4" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Пароль</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Последнее изменение</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{security.passwordChangedAt}</div>
              </div>
              <button
                className="btn btn--accent"
                onClick={() => setShowChangePassword(true)}
                style={{ padding: '8px 16px' }}
              >
                Сменить пароль
              </button>
            </div>

            {/* Change password modal */}
            {showChangePassword && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Новый пароль</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="password"
                    placeholder="Текущий пароль"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                  <input
                    type="password"
                    placeholder="Новый пароль (мин. 8 символов)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                  <input
                    type="password"
                    placeholder="Подтвердите пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn--accent"
                      onClick={handleChangePassword}
                      disabled={newPassword !== confirmPassword || newPassword.length < 8}
                      style={{ padding: '8px 16px', opacity: (newPassword !== confirmPassword || newPassword.length < 8) ? 0.5 : 1 }}
                    >
                      Обновить
                    </button>
                    <button
                      className="btn btn--ghost"
                      onClick={() => {
                        setShowChangePassword(false);
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      style={{ padding: '8px 16px' }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active sessions */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Активные сессии</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {security.activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="card"
                  style={{
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: session.isCurrent ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {session.device === 'Mobile' ? '📱' : '💻'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {session.browser}
                      {session.isCurrent && (
                        <span className="chip chip--accent" style={{ fontSize: 10 }}>Текущая</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      IP: {session.ip} • {session.lastActive}
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      className="btn btn--danger"
                      onClick={() => setShowTerminateSession(session.id)}
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      Завершить
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Terminate session modal */}
            {showTerminateSession && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13 }}>
                  Завершить эту сессию? Устройство будет отключено.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn--danger"
                    onClick={() => handleTerminateSession(showTerminateSession)}
                    style={{ padding: '8px 16px' }}
                  >
                    Завершить
                  </button>
                  <button
                    className="btn btn--ghost"
                    onClick={() => setShowTerminateSession(null)}
                    style={{ padding: '8px 16px' }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

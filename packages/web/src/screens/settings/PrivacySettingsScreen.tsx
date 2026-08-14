// Privacy Settings — настройки приватности
// Макет: mockups/balloo-su/privacy-settings.html

import { useState } from 'react';
import { api } from '@/services/api';

type PrivTab = 'visibility' | 'security' | 'blacklist' | 'secret' | 'history';

export default function PrivacySettingsScreen() {
  const [activeTab, setActiveTab] = useState<PrivTab>('visibility');
  const [saving, setSaving] = useState(false);

  const tabs: { key: PrivTab; label: string; icon: string }[] = [
    { key: 'visibility', label: 'Видимость', icon: '👁' },
    { key: 'security', label: 'Безопасность', icon: '🔒' },
    { key: 'blacklist', label: 'Чёрный список', icon: '🚫' },
    { key: 'secret', label: 'Секретные чаты', icon: '🔐' },
    { key: 'history', label: 'История', icon: '📊' },
  ];

  const handleSave = async () => {
    try {
      setSaving(true);
      // await api.updatePrivacySettings(settings);
    } catch {
      // error toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 260,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        overflowY: 'auto',
        flexShrink: 0,
      }}>
        <div style={{ padding: '16px 8px' }}>
          {tabs.map(tab => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                margin: '2px 0',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                background: activeTab === tab.key ? 'rgba(45,184,77,0.1)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 720 }}>
          {activeTab === 'visibility' && renderVisibilityTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'blacklist' && renderBlacklistTab()}
          {activeTab === 'secret' && renderSecretTab()}
          {activeTab === 'history' && renderHistoryTab()}
        </div>

        {/* Save button */}
        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <button
            className="btn btn--primary"
            onClick={handleSave}
            disabled={saving}
            style={{ minWidth: 160 }}
          >
            {saving ? 'Сохранение...' : '💾 Сохранить'}
          </button>
        </div>
      </main>
    </div>
  );
}

// --- Tab: Visibility ---
function renderVisibilityTab() {
  const [profileVisibility, setProfileVisibility] = useState('all');
  const [phoneVisibility, setPhoneVisibility] = useState('nobody');
  const [onlineVisibility, setOnlineVisibility] = useState('all');

  const showCombo = (visibility: string) =>
    ['except', 'specific', 'nobody-except'].includes(visibility);

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>👁 Видимость</h1>

      {/* Profile */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Профиль</h3>

        <div className="form-group">
          <label className="form-label">Кто видит мой профиль</label>
          <select
            value={profileVisibility}
            onChange={e => setProfileVisibility(e.target.value)}
            className="form-select"
          >
            <option value="all">Все</option>
            <option value="contacts">Только контакты</option>
            <option value="except">Все кроме...</option>
            <option value="specific">Только...</option>
          </select>
          {showCombo(profileVisibility) && (
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Поиск контактов..."
                style={{ marginBottom: 4 }}
              />
              <div style={{
                maxHeight: 120,
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
              }}>
                <label className="form-checkbox" style={{ padding: '4px 8px' }}>
                  <input type="checkbox" /> Анна Иванова
                </label>
                <label className="form-checkbox" style={{ padding: '4px 8px' }}>
                  <input type="checkbox" /> Сергей Морозов
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">Кто видит номер телефона</label>
          <select
            value={phoneVisibility}
            onChange={e => setPhoneVisibility(e.target.value)}
            className="form-select"
          >
            <option value="nobody">Никто</option>
            <option value="contacts">Только контакты</option>
            <option value="nobody-except">Никто кроме...</option>
          </select>
          {showCombo(phoneVisibility) && (
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Поиск контактов..."
              />
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">Кто видит статус «в сети»</label>
          <select
            value={onlineVisibility}
            onChange={e => setOnlineVisibility(e.target.value)}
            className="form-select"
          >
            <option value="all">Все</option>
            <option value="contacts">Только контакты</option>
            <option value="nobody">Никто</option>
            <option value="except">Все кроме...</option>
          </select>
          {showCombo(onlineVisibility) && (
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Поиск контактов..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Сообщения</h3>

        <SettingRow>
          <span className="flex-1">Кто может мне писать</span>
          <select className="form-select" style={{ width: 'auto' }}>
            <option>Все</option>
            <option>Только контакты</option>
            <option>Никто</option>
          </select>
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Кто может добавлять в группы</span>
          <select className="form-select" style={{ width: 'auto' }}>
            <option>Все</option>
            <option>Только контакты</option>
            <option>Никто</option>
          </select>
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Кто видит последние seen</span>
          <select className="form-select" style={{ width: 'auto' }}>
            <option>Все</option>
            <option>Только контакты</option>
            <option>Никто</option>
          </select>
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Кто видит «печатает»</span>
          <select className="form-select" style={{ width: 'auto' }}>
            <option>Все</option>
            <option>Только контакты</option>
            <option>Никто</option>
          </select>
        </SettingRow>
      </div>

      {/* Data */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Данные</h3>

        <SettingRow>
          <span className="flex-1">Кто видит историю сообщений</span>
          <select className="form-select" style={{ width: 'auto' }}>
            <option>Все</option>
            <option>Только я</option>
            <option>Никто</option>
          </select>
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Кто видит мои Stories</span>
          <select className="form-select" style={{ width: 'auto' }}>
            <option>Все</option>
            <option>Только контакты</option>
            <option>Все кроме...</option>
          </select>
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Разрешить поисковым системам индексировать профиль</span>
          <Switch checked={false} onChange={() => {}} />
        </SettingRow>
      </div>

      {/* Profile link */}
      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>🔗 Ссылка-профиль</h3>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Ваш @username</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="form-input flex-1"
              value="@ivanov"
              placeholder="@username"
            />
            <button className="btn btn--tertiary btn--sm">Копировать</button>
          </div>
          <div className="form-hint">
            По этой ссылке вас найдут: https://balloo.su/ivanov
          </div>
        </div>
      </div>
    </>
  );
}

// --- Tab: Security ---
function renderSecurityTab() {
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🔒 Безопасность</h1>

      {/* E2EE */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>End-to-End шифрование</h3>

        <SettingRow>
          <div className="flex-1">
            <div className="text-sm font-bold">🔐 Секретные чаты</div>
            <div className="text-xs text-secondary">
              Сквозное шифрование. Сообщения не хранятся на сервере.
            </div>
          </div>
          <button className="btn btn--primary btn--sm">Начать</button>
        </SettingRow>

        <SettingRow>
          <div className="flex-1">
            <div className="text-sm font-bold">🛡️ Обычные чаты</div>
            <div className="text-xs text-secondary">
              Защищённые серверные сообщения. Хранятся на сервере.
            </div>
          </div>
          <span className="chip chip--accent">Активно</span>
        </SettingRow>
      </div>

      {/* Auto-delete */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Удаление сообщений</h3>

        <div className="form-group">
          <label className="form-label">Автоудаление сообщений (личные чаты)</label>
          <select className="form-select">
            <option>Не удалять</option>
            <option>Через 1 день</option>
            <option>Через 1 неделю</option>
            <option>Через 1 месяц</option>
            <option>Через 1 год</option>
          </select>
        </div>

        <SettingRow style={{ marginTop: 12 }}>
          <span className="flex-1">Удалить для всех при выходе</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>
      </div>

      {/* Incoming requests */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Входящие запросы</h3>

        <SettingRow>
          <span className="flex-1">Принимать запросы только от контактов</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Подтверждать вступление в группы</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>
      </div>

      {/* 2FA */}
      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>🔑 Двухфакторная аутентификация</h3>

        <SettingRow>
          <span className="flex-1">2FA TOTP</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Резервные коды</span>
          <a href="#" style={{ color: 'var(--accent)' }}>📥 Скачать</a>
        </SettingRow>

        <button
          className="btn btn--secondary btn--block"
          style={{ marginTop: 12 }}
          onClick={() => window.location.href = '/two-factor'}
        >
          ⚙️ Управление 2FA
        </button>
      </div>
    </>
  );
}

// --- Tab: Blacklist ---
function renderBlacklistTab() {
  const [blockedUsers, setBlockedUsers] = useState([
    { id: '1', name: 'Блокированный 1', date: '10.07.2026', phone: '+7 (999) ***-**-01', attempts: 5 },
    { id: '2', name: 'Блокированный 2', date: '05.07.2026', phone: '+7 (999) ***-**-02', attempts: 4 },
    { id: '3', name: 'Блокированный 3', date: '01.07.2026', phone: '+7 (999) ***-**-03', attempts: 3 },
  ]);

  const [blockedChannels, setBlockedChannels] = useState([
    { id: '1', name: 'Спам-канал', date: '12.07.2026' },
  ]);

  const handleUnblockUser = (id: string) => {
    setBlockedUsers(prev => prev.filter(u => u.id !== id));
    // await api.unblockUser(id);
  };

  const handleUnblockChannel = (id: string) => {
    setBlockedChannels(prev => prev.filter(c => c.id !== id));
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>🚫 Чёрный список</h1>
          <p className="text-sm text-secondary">
            Пользователи, которых вы заблокировали. Они не видят ваш профиль и не могут вам написать.
          </p>
        </div>
        <button
          className="btn btn--primary btn--sm"
          onClick={() => { /* open block modal */ }}
        >
          ➕ Заблокировать
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="card flex-1" style={{ minWidth: 140 }}>
          <div className="text-xs text-muted">Всего заблокировано</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--danger)' }}>
            {blockedUsers.length + blockedChannels.length}
          </div>
        </div>
        <div className="card flex-1" style={{ minWidth: 140 }}>
          <div className="text-xs text-muted">Попыток написать</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>
            {blockedUsers.reduce((sum, u) => sum + u.attempts, 0)}
          </div>
          <div className="text-xs text-muted">за последние 7 дней</div>
        </div>
      </div>

      {/* Users */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Заблокированные пользователи</h3>

        {blockedUsers.map(user => (
          <div key={user.id} style={{
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div className="avatar avatar--md avatar--bordered avatar--status-offline avatar--ctx-blocked">
              <div className="avatar__inner"><span>{user.name.charAt(0)}{user.name.charAt(1)}</span></div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">{user.name}</div>
              <div className="text-xs text-muted">📞 {user.phone} · Заблокирован: {user.date}</div>
              <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                Попыток написать: {user.attempts}
              </div>
            </div>
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => handleUnblockUser(user.id)}
            >
              Разблокировать
            </button>
          </div>
        ))}

        {blockedUsers.length === 0 && (
          <div className="text-sm text-secondary" style={{ padding: 24, textAlign: 'center' }}>
            Нет заблокированных пользователей
          </div>
        )}
      </div>

      {/* Channels */}
      {blockedChannels.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className="card__title" style={{ marginBottom: 16 }}>🚫 Заблокированные каналы</h3>
          {blockedChannels.map(ch => (
            <div key={ch.id} style={{
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: '1px solid var(--border-color)',
            }}>
              <div className="avatar avatar--md avatar--bordered avatar--status-offline avatar--ctx-blocked" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="avatar__inner"><span>📢</span></div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{ch.name}</div>
                <div className="text-xs text-muted">Заблокирован: {ch.date}</div>
              </div>
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => handleUnblockChannel(ch.id)}
              >
                Разблокировать
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>ℹ️ Что происходит при блокировке</h3>
        <ul className="text-sm text-secondary" style={{ paddingLeft: 20 }}>
          <li>Заблокированный не видит ваш профиль</li>
          <li>Не видит ваш статус «в сети»</li>
          <li>Ваши сообщения от него не доставляются</li>
          <li>Он не может вам позвонить</li>
          <li>Он не может добавить вас в группы</li>
          <li>Вы не получаете от него уведомления</li>
        </ul>
      </div>
    </>
  );
}

// --- Tab: Secret Chats ---
function renderSecretTab() {
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🔐 Секретные чаты</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>О секретных чатах</h3>
        <p className="text-sm text-secondary">
          Секретные чаты используют сквозное шифрование (E2EE). Сообщения хранятся только на устройствах участников и не сохраняются на сервере.
        </p>

        <SettingRow style={{ marginTop: 12 }}>
          <span className="flex-1">🔑 End-to-End шифрование</span>
          <span className="chip chip--accent">Активно</span>
        </SettingRow>

        <SettingRow>
          <span className="flex-1">🚫 Нет пересылки</span>
          <span className="chip chip--accent">Включено</span>
        </SettingRow>

        <SettingRow>
          <span className="flex-1">📸 Запрет скриншотов</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">⏰ Саморазрушение</span>
          <select className="form-select" style={{ width: 'auto' }}>
            <option>Выкл</option>
            <option>1 секунда</option>
            <option>5 секунд</option>
            <option>30 секунд</option>
            <option>1 минута</option>
            <option>1 день</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>🔑 Код безопасности</h3>
        <div style={{ textAlign: 'center' }}>
          <p className="text-sm text-secondary" style={{ marginBottom: 8 }}>
            Сравните этот код с собеседником для подтверждения E2EE
          </p>
          <div className="card" style={{
            display: 'inline-block',
            padding: 16,
            background: 'var(--bg-tertiary)',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 20,
              letterSpacing: 2,
              color: 'var(--accent)',
            }}>
              🔒 4A 7B 2C 9D E1 F3
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Tab: History ---
function renderHistoryTab() {
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>📊 История сообщений</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Хранение истории</h3>

        <SettingRow>
          <span className="flex-1">Хранить историю на сервере</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Автоудаление старых сообщений</span>
          <Switch checked={false} onChange={() => {}} />
        </SettingRow>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Удалять после</label>
          <select className="form-select">
            <option>Никогда</option>
            <option>30 дней</option>
            <option>90 дней</option>
            <option>180 дней</option>
            <option>1 год</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>Экспорт истории</h3>
        <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
          Скачайте всю историю сообщений
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--primary btn--sm">📄 Экспорт в JSON</button>
          <button className="btn btn--secondary btn--sm">📋 Экспорт в TXT</button>
          <button className="btn btn--secondary btn--sm">📑 Экспорт в PDF</button>
        </div>
      </div>
    </>
  );
}

// --- Small components ---

function SettingRow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      padding: '8px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="switch__slider" />
    </label>
  );
}

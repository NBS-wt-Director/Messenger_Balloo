// Settings Screen — главный экран настроек с табами
// Макет: mockups/balloo-su/settings.html
// Переиспользует: NotificationSettingsScreen, PrivacySettingsScreen, BlockedUsersScreen

import { useState } from 'react';
import NotificationSettingsScreen from './NotificationSettingsScreen';
import PrivacySettingsScreen from './PrivacySettingsScreen';
import BlockedUsersScreen from './BlockedUsersScreen';

type SettingsTab =
  | 'notifications'
  | 'appearance'
  | 'language'
  | 'privacy'
  | 'storage'
  | 'devices'
  | 'accounts'
  | 'security'
  | 'cache'
  | 'disk'
  | 'donate'
  | 'support'
  | 'about';

// --- Inner settings sub-screens ---
function AppearanceSettingsScreen() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'russian'>('dark');

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🎨 Оформление</h1>

      {/* Theme */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Тема</h3>

        <div
          onClick={() => setTheme('dark')}
          style={{
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            background: theme === 'dark' ? 'var(--bg-active)' : 'transparent',
            marginBottom: 4,
            borderRadius: 6,
          }}
        >
          <span className="flex-1">🌙 Тёмная</span>
          {theme === 'dark' && <span className="chip chip--accent">Активна</span>}
        </div>

        <div
          onClick={() => setTheme('light')}
          style={{
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            background: theme === 'light' ? 'var(--bg-active)' : 'transparent',
            marginBottom: 4,
            borderRadius: 6,
          }}
        >
          <span className="flex-1">☀️ Светлая</span>
          {theme === 'light' && <span className="chip chip--accent">Активна</span>}
        </div>

        <div
          onClick={() => setTheme('russian')}
          style={{
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            background: theme === 'russian' ? 'var(--bg-active)' : 'transparent',
            marginBottom: 4,
            borderRadius: 6,
          }}
        >
          <span className="flex-1">🇷🇺 Российская</span>
          <span className="text-xs text-muted">(флаг + драгметаллы)</span>
        </div>
      </div>

      {/* Calls settings */}
      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>📞 Звонки</h3>

        <SettingRow>
          <span className="flex-1">Прерывающий звонок</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Вибрация при звонке</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>
      </div>
    </div>
  );
}

function LanguageSettingsScreen() {
  const languages = [
    { code: 'ru', flag: '🇷🇺', name: 'Русский', group: 'primary' },
    { code: 'en', flag: '🇬🇧', name: 'English', group: 'other' },
    { code: 'fr', flag: '🇫🇷', name: 'Français', group: 'other' },
    { code: 'zh', flag: '🇨🇳', name: '中文', group: 'friendly' },
    { code: 'hi', flag: '🇮🇳', name: 'हिन्दी', group: 'friendly' },
    { code: 'be', flag: '🇧🇾', name: 'Беларуская', group: 'friendly' },
    { code: 'tt', flag: '🇹🇷', name: 'Татарский', group: 'primary' },
    { code: 'ba', flag: '🇧🇦', name: 'Башкирский', group: 'primary' },
    { code: 'ce', flag: '🇨🇪', name: 'Чеченский', group: 'primary' },
    { code: 'cv', flag: '🇨🇻', name: 'Чувашский', group: 'primary' },
    { code: 'av', flag: '🇦🇻', name: 'Аварский', group: 'primary' },
    { code: 'dar', flag: '🇩🇦', name: 'Даргинский', group: 'primary' },
    { code: 'udm', flag: '🇺🇩', name: 'Удмуртский', group: 'primary' },
    { code: 'lez', flag: '🇱🇪', name: 'Лезгинский', group: 'primary' },
    { code: 'kbd', flag: '🇰🇩', name: 'Кабардино-черкесский', group: 'primary' },
    { code: 'chm', flag: '🇨🇭', name: 'Марийский', group: 'primary' },
    { code: 'os', flag: '🇴🇸', name: 'Осетинский', group: 'primary' },
    { code: 'sah', flag: '🇾🇦', name: 'Якутский', group: 'primary' },
    { code: 'bua', flag: '🇧🇺', name: 'Бурятский', group: 'primary' },
    { code: 'uk', flag: '🇺🇦', name: 'Українська', group: 'primary' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🌍 Язык</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Интерфейс</h3>
        <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>
          20 языков: 3 группы — Русские, Дружественные, Остальные
        </p>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <select className="form-select form-select--lg">
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Language groups info */}
      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>Группы языков</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <LanguageGroup
            title="Русские (15 языков)"
            desc="Русский + 14 языков народов РФ"
            languages={languages.filter(l => l.group === 'primary')}
          />
          <LanguageGroup
            title="Дружественные (3 языка)"
            desc="中文, हिन्दी, Беларуская"
            languages={languages.filter(l => l.group === 'friendly')}
          />
          <LanguageGroup
            title="Остальные (2 языка)"
            desc="English, Français"
            languages={languages.filter(l => l.group === 'other')}
          />
        </div>
      </div>
    </div>
  );
}

function LanguageGroup({
  title,
  desc,
  languages,
}: {
  title: string;
  desc: string;
  languages: { code: string; flag: string; name: string }[];
}) {
  return (
    <div style={{
      padding: 12,
      background: 'var(--bg-secondary)',
      borderRadius: 8,
    }}>
      <div className="text-sm font-bold">{title}</div>
      <div className="text-xs text-secondary" style={{ marginBottom: 8 }}>{desc}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {languages.map(l => (
          <span key={l.code} className="chip" style={{ fontSize: 12 }}>
            {l.flag} {l.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function StorageSettingsScreen() {
  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>💾 Хранилище</h1>

      {/* Auto-download */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Автозагрузка медиа</h3>

        <SettingRow>
          <span className="flex-1">WiFi</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Мобильные данные</span>
          <Switch checked={false} onChange={() => {}} />
        </SettingRow>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Мобильные данные в чатах</span>
          <select className="form-select" style={{ width: 'auto' }}>
            <option>Все чаты</option>
            <option>Избранные</option>
            <option>Не загружать</option>
          </select>
        </div>
      </div>

      {/* Cache management */}
      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>Управление кэшем</h3>

        <SettingRow>
          <span className="flex-1">Очистить кэш медиа</span>
          <span className="chip">340 МБ</span>
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Очистить кэш файлов</span>
          <span className="chip">507 МБ</span>
        </SettingRow>

        <button className="btn btn--danger btn--sm" style={{ marginTop: 12 }}>
          Очистить всё
        </button>
      </div>
    </div>
  );
}

function DevicesSettingsScreen() {
  const [devices] = useState([
    { id: '1', icon: '💻', name: 'Windows PC', detail: 'IP: 192.168.1.42 • Chrome 120 • Москва', current: true },
    { id: '2', icon: '📱', name: 'iPhone 15 Pro', detail: 'iOS 17 • IP: 10.0.0.15 • Москва • 2ч назад', current: false },
    { id: '3', icon: '📱', name: 'Samsung Galaxy S24', detail: 'Android 14 • IP: 10.0.0.22 • Казань • 1д назад', current: false },
  ]);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>📱 Мои устройства</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Активные сессии</h3>

        {devices.map(device => (
          <div
            key={device.id}
            style={{
              padding: 12,
              marginBottom: device.current ? 12 : 0,
              background: device.current ? 'rgba(45,184,77,0.06)' : 'transparent',
              borderColor: device.current ? 'var(--accent)' : 'transparent',
              border: device.current ? '1px solid var(--accent)' : 'none',
              borderRadius: 8,
              borderBottom: device.current ? undefined : '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28 }}>{device.icon}</div>
              <div className="flex-1">
                <div className="text-sm" style={{ fontWeight: device.current ? 700 : 600 }}>
                  {device.name}
                  {device.current && <span className="chip chip--accent" style={{ marginLeft: 8 }}>Текущее</span>}
                </div>
                <div className="text-xs text-secondary">{device.detail}</div>
              </div>
              {!device.current && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn--secondary btn--sm">🔔 Вызвать</button>
                  <button className="btn btn--danger btn--sm">Завершить</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 12 }}>Push-уведомления на устройства</h3>
        <SettingRow>
          <span className="flex-1">Звук уведомлений</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>
        <button className="btn btn--secondary btn--block" style={{ marginBottom: 8 }}>
          📷 Добавить устройство (QR)
        </button>
        <button className="btn btn--danger btn--block">Завершить все сессии</button>
      </div>
    </div>
  );
}

function AccountsSettingsScreen() {
  const [accounts] = useState([
    { id: '1', avatar: 'ИИ', name: 'Иван Иванов', phone: '+7 (999) 123-45-67', username: '@ivanov', active: true },
    { id: '2', avatar: 'ББ', name: 'Баллоо Блог', username: '@ballooblog', type: 'Корпоративный', active: false },
    { id: '3', avatar: 'РР', name: 'Рабочий', username: 'work@balloo.su', type: 'Рабочий', active: false },
  ]);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>👤 Аккаунты</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Мультиаккаунт</h3>
        <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>
          Неограниченное количество аккаунтов. Уведомления для всех.
        </p>

        {accounts.map(acc => (
          <div
            key={acc.id}
            style={{
              padding: 12,
              marginBottom: acc.active ? 12 : 0,
              background: acc.active ? 'rgba(45,184,77,0.06)' : 'transparent',
              borderColor: acc.active ? 'var(--accent)' : 'transparent',
              border: acc.active ? '1px solid var(--accent)' : 'none',
              borderRadius: 8,
              borderBottom: acc.active ? undefined : '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar avatar--md">
                <div className="avatar__inner"><span>{acc.avatar}</span></div>
              </div>
              <div className="flex-1">
                <div className="text-sm" style={{ fontWeight: 700 }}>{acc.name}</div>
                <div className="text-xs text-secondary">
                  {acc.phone || acc.username}
                  {acc.type ? ` • ${acc.type}` : ''}
                </div>
              </div>
              {acc.active ? (
                <span className="chip chip--accent">Активный</span>
              ) : (
                <button className="btn btn--secondary btn--sm">Переключить</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn--primary btn--block">+ Добавить аккаунт</button>
    </div>
  );
}

function SecuritySettingsScreen() {
  const [totpEnabled, setTotpEnabled] = useState(true);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🔐 Безопасность</h1>

      {/* 2FA Status */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Двухфакторная аутентификация</h3>
        <SettingRow>
          <div className="flex-1">
            <div className="text-sm" style={{ fontWeight: 700 }}>2FA TOTP</div>
            <div className="text-xs text-secondary">Дополнительный код при входе</div>
          </div>
          <Switch checked={totpEnabled} onChange={e => setTotpEnabled(e.target.checked)} />
        </SettingRow>
      </div>

      {/* TOTP Setup */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Настройка TOTP</h3>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div className="card" style={{
            display: 'inline-block',
            padding: 16,
            background: 'var(--bg-tertiary)',
          }}>
            <div style={{
              width: 160,
              height: 160,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* QR code placeholder */}
              <div style={{
                width: 140,
                height: 140,
                display: 'grid',
                gridTemplateColumns: 'repeat(21, 1fr)',
                gridTemplateRows: 'repeat(21, 1fr)',
              }}>
                <div style={{ gridColumn: '1/7', gridRow: '1/7', background: '#000' }} />
                <div style={{ gridColumn: '1/3', gridRow: '7/19', background: '#000' }} />
                <div style={{ gridColumn: '16/22', gridRow: '1/7', background: '#000' }} />
                <div style={{ gridColumn: '1/3', gridRow: '14/20', background: '#000' }} />
                <div style={{ gridColumn: '16/22', gridRow: '14/20', background: '#000' }} />
                <div style={{ gridColumn: '7/11', gridRow: '7/11', background: '#000' }} />
                <div style={{ gridColumn: '12/16', gridRow: '12/16', background: '#000' }} />
                <div style={{ gridColumn: '11/15', gridRow: '7/11', background: '#000' }} />
                <div style={{ gridColumn: '7/11', gridRow: '14/18', background: '#000' }} />
              </div>
            </div>
          </div>
          <p className="text-sm text-secondary" style={{ marginTop: 12 }}>
            Отсканируйте QR-код в приложении-аутентификаторе
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Код подтверждения</label>
          <input
            type="text"
            className="form-input"
            placeholder="Введите 6-значный код"
            style={{ textAlign: 'center', letterSpacing: 8, fontFamily: "'JetBrains Mono', monospace" }}
          />
        </div>
        <button className="btn btn--primary btn--block">Подтвердить</button>
      </div>

      {/* Backup codes */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Резервные коды</h3>
        <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
          Используйте один раз, если потеряете доступ к аутентификатору
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="card"
              style={{
                background: 'var(--bg-tertiary)',
                textAlign: 'center',
                padding: 10,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 16,
              }}
            >
              XXXX-XXXX
            </div>
          ))}
        </div>
        <button className="btn btn--secondary btn--block" style={{ marginTop: 12 }}>
          📥 Скачать резервные коды
        </button>
      </div>

      {/* Disable 2FA */}
      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>Отключение 2FA</h3>
        <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
          Для отключения нужно 3 подтверждения администратора
        </p>
        <button className="btn btn--danger btn--block">Отключить 2FA</button>
      </div>
    </div>
  );
}

function CacheSettingsScreen() {
  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>💾 Оффлайн-кэш</h1>

      {/* Cache settings */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Настройки кэширования</h3>

        <SettingRow>
          <span className="flex-1">Кэшировать сообщения</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Кэшировать файлы (фото/видео/документы)</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Авто-очистка при превышении лимита</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Очередь отправки (офлайн)</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>
      </div>

      {/* Storage usage */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Использование хранилища</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="card flex-1" style={{ minWidth: 100 }}>
            <div className="text-xs text-muted">Использовано</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>847 МБ</div>
          </div>
          <div className="card flex-1" style={{ minWidth: 100 }}>
            <div className="text-xs text-muted">Лимит</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>2 ГБ</div>
          </div>
          <div className="card flex-1" style={{ minWidth: 100 }}>
            <div className="text-xs text-muted">Свободно</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>1.2 ГБ</div>
          </div>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: '42%', height: '100%', background: 'var(--accent)', borderRadius: 6 }} />
        </div>
        <p className="text-xs text-muted">42% заполнено</p>
      </div>

      {/* Clear cache */}
      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>Очистка кэша</h3>

        <SettingRow>
          <span className="flex-1">Кэш медиа (фото/видео)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="chip">340 МБ</span>
            <button className="btn btn--tertiary btn--sm">Очистить</button>
          </div>
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Кэш файлов</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="chip">507 МБ</span>
            <button className="btn btn--tertiary btn--sm">Очистить</button>
          </div>
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Кэш сообщений</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="chip">0 МБ</span>
            <button className="btn btn--tertiary btn--sm">Очистить</button>
          </div>
        </SettingRow>

        <button className="btn btn--danger btn--block" style={{ marginTop: 12 }}>
          🗑 Очистить всё
        </button>
      </div>
    </div>
  );
}

function YandexDiskSettingsScreen() {
  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>☁️ Yandex Disk</h1>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>Подключение</h3>
        <SettingRow>
          <span className="flex-1">Подключено</span>
          <span className="chip chip--accent">✅ Да</span>
        </SettingRow>
        <SettingRow>
          <span className="flex-1">Использовано</span>
          <span className="text-sm">2.4 ГБ из 10 ГБ</span>
        </SettingRow>
        <button className="btn btn--secondary btn--block" style={{ marginTop: 12 }}>
          🔄 Переключить аккаунт
        </button>
      </div>
    </div>
  );
}

function DonateSettingsScreen() {
  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>💰 Донаты</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Мои донаты</h3>
        <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
          История ваших пожертвований и поддерживаемые проекты
        </p>

        <div style={{
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 4,
        }}>
          <div style={{ fontSize: 24 }}>🎈</div>
          <div className="flex-1">
            <div className="text-sm" style={{ fontWeight: 700 }}>Balloo — развитие мессенджера</div>
            <div className="text-xs text-secondary">Тир: 🥇 Золотой — с 01.07.2026</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">500 ₽/мес</div>
            <span className="chip chip--accent">Активен</span>
          </div>
        </div>

        <div style={{
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{ fontSize: 24 }}>📝</div>
          <div className="flex-1">
            <div className="text-sm" style={{ fontWeight: 700 }}>Блог Balloo — авторский контент</div>
            <div className="text-xs text-secondary">Тир: 🥈 Серебряный — 15.06.2026 → 15.07.2026</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">200 ₽</div>
            <span className="chip">Одноразовый</span>
          </div>
        </div>

        <button className="btn btn--primary btn--block" style={{ marginTop: 12 }}>
          💰 Поддержать проект
        </button>
        <button className="btn btn--secondary btn--block" style={{ marginTop: 8 }}>
          📋 Вся история
        </button>
      </div>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>Управление подпиской</h3>
        <SettingRow>
          <span className="flex-1">Способ оплаты</span>
          <span className="text-sm">Visa ••• 1234</span>
        </SettingRow>
        <SettingRow>
          <span className="flex-1">Следующий платёж</span>
          <span className="text-sm">01.08.2026</span>
        </SettingRow>
        <button className="btn btn--danger btn--block btn--sm" style={{ marginTop: 12 }}>
          Отменить подписку
        </button>
      </div>
    </div>
  );
}

function SupportSettingsScreen() {
  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🎧 Поддержка</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Чат с поддержкой</h3>
        <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
          Среднее время ответа: 15 минут
        </p>

        {/* Chat preview */}
        <div style={{
          background: 'var(--bg-tertiary)',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="avatar avatar--sm" style={{ background: 'var(--accent)' }}>
              <div className="avatar__inner"><span>П</span></div>
            </div>
            <span className="text-sm font-bold">Поддержка Balloo</span>
            <span className="chip chip--accent">Онлайн</span>
          </div>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 4,
            padding: 8,
            marginBottom: 8,
          }}>
            <div className="text-sm">Здравствуйте! Чем можем помочь?</div>
            <div className="text-xs text-muted" style={{ textAlign: 'right' }}>14:30</div>
          </div>
        </div>

        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder="Напишите сообщение в поддержку..."
          />
        </div>
        <button className="btn btn--primary btn--block">📤 Отправить</button>
      </div>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>📚 Самопомощь</h3>
        <SettingRow>
          <span className="flex-1">❓ Частые вопросы (FAQ)</span>
          <span className="text-secondary">→</span>
        </SettingRow>
        <SettingRow>
          <span className="flex-1">📖 База знаний</span>
          <span className="text-secondary">→</span>
        </SettingRow>
        <SettingRow>
          <span className="flex-1">📜 Правила сообщества</span>
          <span className="text-secondary">→</span>
        </SettingRow>
      </div>
    </div>
  );
}

function AboutSettingsScreen() {
  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>ℹ️ О Balloo</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 48 }}>🎈</div>
          <div className="text-lg font-bold" style={{ marginTop: 8 }}>Balloo Messenger</div>
          <div className="text-sm text-secondary">Версия 1.0.0 (сборка 2026.07.18)</div>
        </div>

        <SettingRow>
          <span className="flex-1">Ссылка на поддержку</span>
          <a href="#" style={{ color: 'var(--accent)' }}>help@balloo.su</a>
        </SettingRow>
        <SettingRow>
          <span className="flex-1">Лицензия</span>
          <a href="#" style={{ color: 'var(--accent)' }}>Открыть лицензию</a>
        </SettingRow>
        <SettingRow>
          <span className="flex-1">История изменений</span>
          <a href="https://history.balloo.su" style={{ color: 'var(--accent)' }}>История версий</a>
        </SettingRow>
        <SettingRow>
          <span className="flex-1">О компании</span>
          <a href="#" style={{ color: 'var(--accent)' }}>Открыть</a>
        </SettingRow>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>📜 Лицензия</h3>
        <div style={{
          maxHeight: 200,
          overflowY: 'auto',
          padding: 12,
          background: 'var(--bg-tertiary)',
          borderRadius: 4,
        }}>
          <p className="text-sm">MIT License</p>
          <p className="text-xs" style={{ marginTop: 8 }}>
            Copyright (c) 2026 Balloo.su
          </p>
          <p className="text-xs">
            Permission is hereby granted, free of charge, to any person obtaining a copy...
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>🙏 Благодарности</h3>
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          <p className="text-sm text-secondary">
            Спасибо всем участникам сообщества Balloo за тестирование и обратную связь.
          </p>
          <p className="text-xs" style={{ marginTop: 8 }}>
            Отдельная благодарность:
          </p>
          <ul className="text-xs" style={{ paddingLeft: 20, marginTop: 4 }}>
            <li>Команде разработчиков</li>
            <li>Дизайнерам</li>
            <li>Тестировщикам</li>
            <li>Ранним пользователям</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- Main Settings Screen ---
export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');

  const tabs: { key: SettingsTab; label: string; icon: string }[] = [
    { key: 'notifications', label: '🔔 Уведомления', icon: '🔔' },
    { key: 'appearance', label: '🎨 Оформление', icon: '🎨' },
    { key: 'language', label: '🌍 Язык', icon: '🌍' },
    { key: 'privacy', label: '🔒 Приватность', icon: '🔒' },
    { key: 'storage', label: '💾 Хранилище', icon: '💾' },
    { key: 'devices', label: '📱 Устройства', icon: '📱' },
    { key: 'accounts', label: '👤 Аккаунты', icon: '👤' },
    { key: 'security', label: '🔐 Безопасность', icon: '🔐' },
    { key: 'cache', label: '💾 Оффлайн-кэш', icon: '💾' },
    { key: 'disk', label: '☁️ Yandex Disk', icon: '☁️' },
    { key: 'donate', label: '💰 Донаты', icon: '💰' },
    { key: 'support', label: '🎧 Поддержка', icon: '🎧' },
    { key: 'about', label: 'ℹ️ О Balloo', icon: 'ℹ️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'notifications':
        return <NotificationSettingsScreen />;
      case 'privacy':
        return <PrivacySettingsScreen />;
      case 'appearance':
        return <AppearanceSettingsScreen />;
      case 'language':
        return <LanguageSettingsScreen />;
      case 'storage':
        return <StorageSettingsScreen />;
      case 'devices':
        return <DevicesSettingsScreen />;
      case 'accounts':
        return <AccountsSettingsScreen />;
      case 'security':
        return <SecuritySettingsScreen />;
      case 'cache':
        return <CacheSettingsScreen />;
      case 'disk':
        return <YandexDiskSettingsScreen />;
      case 'donate':
        return <DonateSettingsScreen />;
      case 'support':
        return <SupportSettingsScreen />;
      case 'about':
        return <AboutSettingsScreen />;
      default:
        return <NotificationSettingsScreen />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 280,
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
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              <span>{tab.label.replace(/^[^\s]+\s/, '')}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Content area */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {/* Tabs header */}
        <div style={{
          display: 'flex',
          gap: 4,
          borderBottom: '2px solid var(--border-color)',
          padding: '0 16px',
          marginBottom: 0,
          overflowX: 'auto',
          background: 'var(--bg-primary)',
        }}>
          {tabs.map(tab => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`settings-tab ${activeTab === tab.key ? 'settings-tab--active' : ''}`}
              style={{
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent)' : 'transparent'}`,
                marginBottom: -2,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {tab.icon} {tab.label.replace(/^[^\s]+\s/, '')}
            </div>
          ))}
        </div>

        {/* Sub-content */}
        <div style={{ overflowY: 'auto' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// --- Small shared components ---

function SettingRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '8px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
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

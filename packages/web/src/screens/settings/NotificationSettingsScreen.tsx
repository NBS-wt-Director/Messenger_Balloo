// Notification Settings — детальные настройки уведомлений
// Макет: mockups/balloo-su/notification-settings.html

import { useState } from 'react';
import { api } from '@/services/api';

type NotifTab = 'general' | 'chats' | 'groups' | 'channels' | 'calls' | 'schedule' | 'mute';

interface NotificationSettings {
  pushEnabled: boolean;
  previewChars: number;
  showSenderName: boolean;
  sound: string;
  vibration: string;
  lockScreen: boolean;
  notificationCenter: boolean;
  groupByChat: boolean;
  maxMessagesInGroup: number;
  groupTimeSeconds: number;
  dndEnabled: boolean;
  dndStart: string;
  dndEnd: string;
  dndExceptions: string;
  dndAutoReply: boolean;
  dndAutoReplyText: string;
  callOverrideDND: boolean;
  callVibration: string;
  callSound: string;
  chatSound: boolean;
  chatVibration: boolean;
  chatPreview: string;
  groupSilent: boolean;
  groupMentionsOnly: boolean;
  groupAllMessages: boolean;
  channelSound: boolean;
  channelPush: boolean;
  channelPreview: string;
  muteList: string[];
  quietModeEnabled: boolean;
  quietModeStart: string;
  quietModeEnd: string;
  quietModeDays: string[];
  workingHours: boolean;
}

export default function NotificationSettingsScreen() {
  const [activeTab, setActiveTab] = useState<NotifTab>('general');
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    previewChars: 20,
    showSenderName: true,
    sound: 'standard1',
    vibration: 'weak',
    lockScreen: true,
    notificationCenter: true,
    groupByChat: true,
    maxMessagesInGroup: 5,
    groupTimeSeconds: 30,
    dndEnabled: false,
    dndStart: '22:00',
    dndEnd: '08:00',
    dndExceptions: 'none',
    dndAutoReply: false,
    dndAutoReplyText: 'Сейчас недоступен, отвечу позже.',
    callOverrideDND: true,
    callVibration: 'strong',
    callSound: 'standard',
    chatSound: true,
    chatVibration: true,
    chatPreview: '20',
    groupSilent: true,
    groupMentionsOnly: false,
    groupAllMessages: true,
    channelSound: false,
    channelPush: true,
    channelPreview: '50',
    muteList: [],
    quietModeEnabled: true,
    quietModeStart: '23:00',
    quietModeEnd: '07:00',
    quietModeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    workingHours: false,
  });
  const [saving, setSaving] = useState(false);

  const tabs: { key: NotifTab; label: string; icon: string }[] = [
    { key: 'general', label: 'Общие', icon: '🔔' },
    { key: 'chats', label: 'Чаты', icon: '💬' },
    { key: 'groups', label: 'Группы', icon: '👥' },
    { key: 'channels', label: 'Каналы', icon: '📢' },
    { key: 'calls', label: 'Звонки', icon: '📞' },
    { key: 'schedule', label: 'Отложенные', icon: '⏰' },
    { key: 'mute', label: 'Mute-список', icon: '🔕' },
  ];

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateNotificationSettings(settings);
    } catch {
      // error toast
    } finally {
      setSaving(false);
    }
  };

  const dayNames: Record<string, string> = {
    Mon: 'Пн', Tue: 'Вт', Wed: 'Ср', Thu: 'Чт', Fri: 'Пт', Sat: 'Сб', Sun: 'Вс',
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
          {activeTab === 'general' && renderGeneralTab(settings, updateSetting)}
          {activeTab === 'chats' && renderChatsTab(settings, updateSetting)}
          {activeTab === 'groups' && renderGroupsTab(settings, updateSetting)}
          {activeTab === 'channels' && renderChannelsTab(settings, updateSetting)}
          {activeTab === 'calls' && renderCallsTab(settings, updateSetting)}
          {activeTab === 'schedule' && renderScheduleTab(settings, updateSetting, dayNames)}
          {activeTab === 'mute' && renderMuteTab()}
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

function renderGeneralTab(
  s: NotificationSettings,
  update: <K extends keyof NotificationSettings>(key: K, value: any) => void,
) {
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🔔 Уведомления</h1>

      {/* Push notifications */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Push-уведомления</h3>

        <SettingRow>
          <span className="flex-1">Включить push-уведомления</span>
          <Switch checked={s.pushEnabled} onChange={e => update('pushEnabled', e.target.checked)} />
        </SettingRow>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Превью текста</span>
          <select
            value={s.previewChars}
            onChange={e => update('previewChars', Number(e.target.value))}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value={20}>20 символов</option>
            <option value={50}>50 символов</option>
            <option value={100}>100 символов</option>
            <option value={0}>Скрыть текст</option>
          </select>
        </div>

        <SettingRow>
          <span className="flex-1">Показывать имя отправителя</span>
          <Switch checked={s.showSenderName} onChange={e => update('showSenderName', e.target.checked)} />
        </SettingRow>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Звук уведомлений</span>
          <select
            value={s.sound}
            onChange={e => update('sound', e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="standard1">Стандартный 1</option>
            <option value="standard2">Стандартный 2</option>
            <option value="standard3">Стандартный 3</option>
            <option value="custom">Свой звук...</option>
            <option value="none">Без звука</option>
          </select>
        </div>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Вибрация</span>
          <select
            value={s.vibration}
            onChange={e => update('vibration', e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="weak">Слабая</option>
            <option value="medium">Средняя</option>
            <option value="strong">Сильная</option>
            <option value="none">Без вибрации</option>
          </select>
        </div>

        <SettingRow>
          <span className="flex-1">Блок-экран (Lock screen)</span>
          <Switch checked={s.lockScreen} onChange={e => update('lockScreen', e.target.checked)} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Уведомления в центре уведомлений</span>
          <Switch checked={s.notificationCenter} onChange={e => update('notificationCenter', e.target.checked)} />
        </SettingRow>
      </div>

      {/* Grouping */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Группировка уведомлений</h3>

        <SettingRow>
          <span className="flex-1">Группировать по чатам</span>
          <Switch checked={s.groupByChat} onChange={e => update('groupByChat', e.target.checked)} />
        </SettingRow>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Макс. сообщений в группе</span>
          <select
            value={s.maxMessagesInGroup}
            onChange={e => update('maxMessagesInGroup', Number(e.target.value))}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Время группировки (сек)</span>
          <input
            type="number"
            value={s.groupTimeSeconds}
            onChange={e => update('groupTimeSeconds', Number(e.target.value))}
            className="form-input"
            style={{ width: 100 }}
          />
          <span className="text-xs text-secondary" style={{ marginLeft: 8 }}>
            Уведомления от одного чата будут объединены
          </span>
        </div>
      </div>

      {/* DND */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Не беспокоить (DND)</h3>

        <SettingRow>
          <span className="flex-1">Включить DND</span>
          <Switch
            checked={s.dndEnabled}
            onChange={e => update('dndEnabled', e.target.checked)}
          />
        </SettingRow>

        {s.dndEnabled && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
            <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="flex-1">По расписанию</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="time"
                  value={s.dndStart}
                  onChange={e => update('dndStart', e.target.value)}
                  className="form-input"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 8px' }}
                />
                <span>—</span>
                <input
                  type="time"
                  value={s.dndEnd}
                  onChange={e => update('dndEnd', e.target.value)}
                  className="form-input"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 8px' }}
                />
              </div>
            </div>

            <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="flex-1">Исключения</span>
              <select
                value={s.dndExceptions}
                onChange={e => update('dndExceptions', e.target.value)}
                className="form-select"
                style={{ width: 'auto' }}
              >
                <option value="none">Никто</option>
                <option value="favorites">Избранные</option>
                <option value="contacts">Все контакты</option>
              </select>
            </div>

            <SettingRow>
              <span className="flex-1">Авто-ответ при DND</span>
              <Switch checked={s.dndAutoReply} onChange={e => update('dndAutoReply', e.target.checked)} />
            </SettingRow>

            {s.dndAutoReply && (
              <div style={{ marginTop: 8 }}>
                <textarea
                  value={s.dndAutoReplyText}
                  onChange={e => update('dndAutoReplyText', e.target.value)}
                  className="form-textarea"
                  style={{ minHeight: 60 }}
                  placeholder="Сейчас недоступен, отвечу позже..."
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calls */}
      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>Звонки</h3>

        <SettingRow>
          <span className="flex-1">Прерывающий звонок (override DND)</span>
          <Switch checked={s.callOverrideDND} onChange={e => update('callOverrideDND', e.target.checked)} />
        </SettingRow>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Видеозвонок — вибрация</span>
          <select
            value={s.callVibration}
            onChange={e => update('callVibration', e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="weak">Слабая</option>
            <option value="strong">Сильная</option>
          </select>
        </div>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Звук входящего</span>
          <select
            value={s.callSound}
            onChange={e => update('callSound', e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="standard">Стандартный</option>
            <option value="soft">Мягкий</option>
            <option value="melody">Мелодия</option>
          </select>
        </div>
      </div>
    </>
  );
}

function renderChatsTab(
  s: NotificationSettings,
  update: (key: string, value: any) => void,
) {
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>💬 Уведомления чатов</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>По умолчанию для всех чатов</h3>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Звук</span>
          <select
            value={s.chatSound ? 'on' : 'off'}
            onChange={e => update('chatSound', e.target.value === 'on')}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="on">Вкл</option>
            <option value="off">Выкл</option>
          </select>
        </div>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Вибрация</span>
          <select
            value={s.chatVibration ? 'on' : 'off'}
            onChange={e => update('chatVibration', e.target.value === 'on')}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="on">Вкл</option>
            <option value="off">Выкл</option>
          </select>
        </div>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Превью</span>
          <select
            value={s.chatPreview}
            onChange={e => update('chatPreview', e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="20">20 символов</option>
            <option value="hidden">Скрыть текст</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>Индивидуальные настройки</h3>

        <ChatNotificationItem
          avatar="МА"
          name="Мария Андреева"
          subtitle="Избранный"
          checked={true}
        />
        <ChatNotificationItem
          avatar="РД"
          name="Команда разработки"
          subtitle="Группа"
          checked={true}
        />
      </div>
    </>
  );
}

function renderGroupsTab(
  s: NotificationSettings,
  update: (key: string, value: any) => void,
) {
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>👥 Уведомления групп</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Поведение по умолчанию</h3>

        <SettingRow>
          <span className="flex-1">Тихие уведомления (без звука)</span>
          <Switch checked={s.groupSilent} onChange={e => update('groupSilent', e.target.checked)} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Только @упоминания</span>
          <Switch checked={s.groupMentionsOnly} onChange={e => update('groupMentionsOnly', e.target.checked)} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Все сообщения</span>
          <Switch checked={s.groupAllMessages} onChange={e => update('groupAllMessages', e.target.checked)} />
        </SettingRow>
      </div>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>Режим «Только важные»</h3>
        <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
          Уведомления только от администраторов и при @упоминании
        </p>
        <SettingRow>
          <span className="flex-1">Включить для всех групп</span>
          <Switch checked={false} onChange={() => {}} />
        </SettingRow>
      </div>
    </>
  );
}

function renderChannelsTab(
  s: NotificationSettings,
  update: (key: string, value: any) => void,
) {
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>📢 Уведомления каналов</h1>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>По умолчанию</h3>

        <SettingRow>
          <span className="flex-1">Звук при новом посте</span>
          <Switch checked={s.channelSound} onChange={e => update('channelSound', e.target.checked)} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Push-уведомление</span>
          <Switch checked={s.channelPush} onChange={e => update('channelPush', e.target.checked)} />
        </SettingRow>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Превью текста</span>
          <select
            value={s.channelPreview}
            onChange={e => update('channelPreview', e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="50">50 символов</option>
            <option value="100">100 символов</option>
            <option value="hidden">Скрыть текст</option>
          </select>
        </div>
      </div>
    </>
  );
}

function renderCallsTab(
  s: NotificationSettings,
  update: (key: string, value: any) => void,
) {
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>📞 Уведомления звонков</h1>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>Настройки звонков</h3>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Звук входящего звонка</span>
          <select
            value={s.callSound}
            onChange={e => update('callSound', e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="standard">Стандартный</option>
            <option value="soft">Мягкий</option>
            <option value="melody">Мелодия</option>
          </select>
        </div>

        <SettingRow>
          <span className="flex-1">Вибрация при звонке</span>
          <Switch checked={true} onChange={() => {}} />
        </SettingRow>

        <SettingRow>
          <span className="flex-1">Автоответчик</span>
          <Switch checked={false} onChange={() => {}} />
        </SettingRow>

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex-1">Звонки от незнакомых</span>
          <select className="form-select" style={{ width: 'auto' }}>
            <option>Всегда</option>
            <option>Только контакты</option>
            <option>Никогда</option>
          </select>
        </div>
      </div>
    </>
  );
}

function renderScheduleTab(
  s: NotificationSettings,
  update: (key: string, value: any) => void,
  dayNames: Record<string, string>,
) {
  const toggleDay = (day: string) => {
    const days = s.quietModeDays.includes(day)
      ? s.quietModeDays.filter(d => d !== day)
      : [...s.quietModeDays, day];
    update('quietModeDays', days);
  };

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>⏰ Отложенные уведомления</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title" style={{ marginBottom: 16 }}>Режим тишины</h3>

        <SettingRow>
          <span className="flex-1">Включить</span>
          <Switch checked={s.quietModeEnabled} onChange={e => update('quietModeEnabled', e.target.checked)} />
        </SettingRow>

        {s.quietModeEnabled && (
          <div style={{ marginTop: 8 }}>
            <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="flex-1">С</span>
              <input
                type="time"
                value={s.quietModeStart}
                onChange={e => update('quietModeStart', e.target.value)}
                className="form-input"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 8px' }}
              />
              <span className="text-secondary">по</span>
              <input
                type="time"
                value={s.quietModeEnd}
                onChange={e => update('quietModeEnd', e.target.value)}
                className="form-input"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 8px' }}
              />
            </div>

            <div style={{ padding: '8px 0' }}>
              <span className="flex-1">Дни</span>
              <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <span
                    key={day}
                    className={`chip ${s.quietModeDays.includes(day) ? 'chip--accent' : ''}`}
                    onClick={() => toggleDay(day)}
                    style={{ cursor: 'pointer', padding: '4px 8px' }}
                  >
                    {dayNames[day]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: 16 }}>Расписание уведомлений</h3>
        <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
          Получать уведомления только в указанные часы
        </p>
        <SettingRow>
          <span className="flex-1">Рабочие часы (Пн–Пт, 10:00–19:00)</span>
          <Switch checked={s.workingHours} onChange={e => update('workingHours', e.target.checked)} />
        </SettingRow>
      </div>
    </>
  );
}

function renderMuteTab() {
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🔕 Mute-список</h1>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="card__title" style={{ marginBottom: 0 }}>Заглушённые чаты</h3>
          <button className="btn btn--primary btn--sm" onClick={() => {}}>
            ➕ Добавить
          </button>
        </div>

        <MutedChatItem
          avatar="РД"
          name="Команда разработки"
          subtitle="Заглушён до 20.07.2026"
        />
        <MutedChatItem
          avatar="РТ"
          name="Российская Газета"
          subtitle="Навсегда"
        />
      </div>
    </>
  );
}

// --- Small components ---

function SettingRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '8px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-color)',
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

function ChatNotificationItem({
  avatar,
  name,
  subtitle,
  checked,
}: {
  avatar: string;
  name: string;
  subtitle: string;
  checked: boolean;
}) {
  return (
    <div style={{
      padding: '12px 0',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div className="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-contact">
        <div className="avatar__inner"><span>{avatar}</span></div>
      </div>
      <div>
        <div className="text-sm font-bold">{name}</div>
        <div className="text-xs text-muted">{subtitle}</div>
      </div>
      <Switch checked={checked} onChange={() => {}} />
    </div>
  );
}

function MutedChatItem({
  avatar,
  name,
  subtitle,
}: {
  avatar: string;
  name: string;
  subtitle: string;
}) {
  return (
    <div style={{
      padding: '12px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-new">
          <div className="avatar__inner"><span>{avatar}</span></div>
        </div>
        <div>
          <div className="text-sm font-bold">{name}</div>
          <div className="text-xs text-muted">{subtitle}</div>
        </div>
      </div>
      <button className="btn btn--secondary btn--sm">Разглушить</button>
    </div>
  );
}

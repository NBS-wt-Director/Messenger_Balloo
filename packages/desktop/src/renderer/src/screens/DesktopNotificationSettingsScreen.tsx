// DesktopNotificationSettingsScreen — notification settings
// Mockup: mockups/desktop/notification-settings.html (1_09_20)

import React, { useState } from 'react';

interface NotifSetting { label: string; key: string; default: boolean }

const groups: Array<{ icon: string; title: string; items: NotifSetting[] }> = [
  { icon: '🔔', title: 'Общие уведомления', items: [
    { label: 'Включить уведомления', key: 'global', default: true },
    { label: 'Звук уведомлений', key: 'sound', default: true },
    { label: 'Показывать превью сообщений', key: 'preview', default: true },
  ]},
  { icon: '💬', title: 'Уведомления чатов', items: [
    { label: 'Личные сообщения', key: 'dm', default: true },
    { label: 'Групповые чаты', key: 'groups', default: true },
    { label: 'Упоминания (@)', key: 'mentions', default: true },
    { label: 'Ответы на мои сообщения', key: 'replies', default: true },
  ]},
  { icon: '📢', title: 'Уведомления каналов', items: [
    { label: 'Все каналы', key: 'channels', default: false },
    { label: 'Только @admin', key: 'channel_admin', default: true },
  ]},
  { icon: '📞', title: 'Звонки', items: [
    { label: 'Входящие звонки', key: 'calls', default: true },
    { label: 'Пропущенные звонки', key: 'missed_calls', default: true },
  ]},
  { icon: '🔇', title: 'Не беспокоить', items: [
    { label: 'Режим "Не беспокоить"', key: 'dnd', default: false },
    { label: 'Только упоминания в DND', key: 'dnd_mentions', default: true },
  ]},
  { icon: '🖥', title: 'Системная интеграция', items: [
    { label: 'Показывать в трее', key: 'tray', default: true },
    { label: 'Мигание в панели задач', key: 'taskbar', default: true },
    { label: 'Нативные уведомления ОС', key: 'native', default: true },
  ]},
];

export function DesktopNotificationSettingsScreen() {
  const [settings, setSettings] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    groups.forEach((g) => g.items.forEach((i) => { init[i.key] = i.default; }));
    return init;
  });

  const toggle = (key: string) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: '0 auto', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: 20, color: 'var(--text-primary, #fff)' }}>🔔 Настройки уведомлений</h2>
      {groups.map((group) => (
        <div key={group.title} style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary, #8a8aa0)', margin: '0 0 12px' }}>{group.icon} {group.title}</h3>
          {group.items.map((item) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color, #222)' }}>
              <span style={{ fontSize: 14, color: 'var(--text-primary, #fff)' }}>{item.label}</span>
              <button onClick={() => toggle(item.key)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: settings[item.key] ? 'var(--accent, #2db84d)' : 'var(--bg-tertiary, #2a2a3a)', position: 'relative' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: settings[item.key] ? 23 : 3, transition: 'left 0.2s' }} />
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

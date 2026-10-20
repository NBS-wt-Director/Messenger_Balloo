// DesktopSettingsScreen — app settings (desktop-specific)
// Mockup: mockups/desktop/settings.html (1_09_18)

import React, { useState } from 'react';
import { DesktopPasswordChangeScreen } from './DesktopPasswordChangeScreen';

interface SettingSection {
  icon: string;
  title: string;
  items: Array<{ label: string; type: 'toggle' | 'select' | 'button'; value?: any; options?: string[] }>;
}

const sections: SettingSection[] = [
  {
    icon: '🎨', title: 'Внешний вид',
    items: [
      { label: 'Тема оформления', type: 'select', value: 'dark', options: ['dark', 'light', 'russian'] },
      { label: 'Размер шрифта', type: 'select', value: 'medium', options: ['small', 'medium', 'large'] },
      { label: 'Компактный режим', type: 'toggle', value: false },
    ],
  },
  {
    icon: '🔔', title: 'Уведомления',
    items: [
      { label: 'Звук уведомлений', type: 'toggle', value: true },
      { label: 'Показывать превью', type: 'toggle', value: true },
      { label: 'В системном трее', type: 'toggle', value: true },
    ],
  },
  {
    icon: '🌐', title: 'Общие',
    items: [
      { label: 'Язык интерфейса', type: 'select', value: 'ru', options: ['ru', 'en', 'zh', 'fr'] },
      { label: 'Автозапуск при старте ОС', type: 'toggle', value: false },
      { label: 'Свернуть в трей при закрытии', type: 'toggle', value: true },
    ],
  },
  {
    icon: '🔒', title: 'Приватность',
    items: [
      { label: 'Показывать статус онлайн', type: 'toggle', value: true },
      { label: 'Подтверждения прочтения', type: 'toggle', value: true },
    ],
  },
  {
    icon: '🔐', title: 'Безопасность',
    items: [
      { label: 'Смена пароля', type: 'button', value: 'Сменить пароль' },
    ],
  },
  {
    icon: '💾', title: 'Данные',
    items: [
      { label: 'Кэш медиафайлов', type: 'button', value: 'Очистить кэш' },
      { label: 'Экспорт данных', type: 'button', value: 'Экспортировать' },
    ],
  },
];

export function DesktopSettingsScreen() {
  const [values, setValues] = useState<Record<string, any>>({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const getValue = (label: string, fallback: any) => values[label] ?? fallback;
  const setValue = (label: string, val: any) => setValues((prev) => ({ ...prev, [label]: val }));

  if (showPasswordChange) {
    return <DesktopPasswordChangeScreen onBack={() => setShowPasswordChange(false)} />;
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: 20, color: 'var(--text-primary, #fff)' }}>⚙️ Настройки приложения</h2>
      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary, #8a8aa0)', margin: '0 0 12px' }}>{section.icon} {section.title}</h3>
          {section.items.map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color, #222)' }}>
              <span style={{ fontSize: 14, color: 'var(--text-primary, #fff)' }}>{item.label}</span>
              {item.type === 'toggle' && (
                <button onClick={() => setValue(item.label, !getValue(item.label, item.value))} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: getValue(item.label, item.value) ? 'var(--accent, #2db84d)' : 'var(--bg-tertiary, #2a2a3a)', position: 'relative' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: getValue(item.label, item.value) ? 23 : 3, transition: 'left 0.2s' }} />
                </button>
              )}
              {item.type === 'select' && (
                <select value={getValue(item.label, item.value)} onChange={(e) => setValue(item.label, e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg-tertiary, #2a2a3a)', border: '1px solid var(--border-color, #333)', color: 'var(--text-primary, #fff)', fontSize: 13 }}>
                  {item.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {item.type === 'button' && (
                <button
                  onClick={item.label === 'Смена пароля' ? () => setShowPasswordChange(true) : undefined}
                  style={{ padding: '6px 14px', background: 'var(--bg-tertiary, #2a2a3a)', border: '1px solid var(--border-color, #333)', color: 'var(--text-primary, #fff)', fontSize: 13, cursor: 'pointer', borderRadius: 4 }}
                >
                  {item.value}
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

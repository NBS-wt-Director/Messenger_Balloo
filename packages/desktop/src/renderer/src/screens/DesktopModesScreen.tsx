// DesktopModesScreen.tsx — Desktop modes/settings screen
// Quick access to desktop modes: DND, Invisible, Work, etc.

import React, { useState } from 'react';

interface ModeOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export function DesktopModesScreen() {
  const [activeMode, setActiveMode] = useState('online');

  const modes: ModeOption[] = [
    { id: 'online', label: 'Онлайн', icon: '🟢', description: 'Все видят, что вы в сети' },
    { id: 'away', label: 'Отошёл', icon: '🟡', description: 'Показывает статус "Отошёл"' },
    { id: 'dnd', label: 'Не беспокоить', icon: '🔴', description: 'Уведомления отключены' },
    { id: 'invisible', label: 'Невидимка', icon: '⚫', description: 'Вы онлайн, но другие видят вас офлайн' },
    { id: 'work', label: 'Работа', icon: '💼', description: 'Только рабочие чаты' },
    { id: 'meeting', label: 'На встрече', icon: '📅', description: 'Автоответ: "Сейчас на встрече"' },
  ];

  const handleModeChange = (modeId: string) => {
    setActiveMode(modeId);
    const api = (window as any).electronAPI;
    if (api) {
      api.presence.set(modeId);
    }
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const modeCardStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: isActive ? 'var(--accent, #2db84d)' : 'var(--bg-card, #1e1e32)',
    border: `1px solid ${isActive ? 'var(--accent, #2db84d)' : 'var(--border-color, #2a2a40)'}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: isActive ? '#fff' : 'var(--text-primary, #fff)',
  });

  return (
    <div style={containerStyle}>
      <h2 style={{ margin: '0 0 20px', fontSize: '20px', color: 'var(--text-primary, #fff)' }}>
        Режимы
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary, #8a8aa0)', margin: '0 0 20px' }}>
        Выберите режим работы приложения
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {modes.map(mode => (
          <div
            key={mode.id}
            style={modeCardStyle(activeMode === mode.id)}
            onClick={() => handleModeChange(mode.id)}
          >
            <span style={{ fontSize: '24px' }}>{mode.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{mode.label}</div>
              <div style={{
                fontSize: '12px',
                marginTop: '2px',
                opacity: 0.8,
                color: activeMode === mode.id ? '#fff' : 'var(--text-secondary, #8a8aa0)',
              }}>
                {mode.description}
              </div>
            </div>
            {activeMode === mode.id && (
              <span style={{ marginLeft: 'auto', fontSize: '14px' }}>✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
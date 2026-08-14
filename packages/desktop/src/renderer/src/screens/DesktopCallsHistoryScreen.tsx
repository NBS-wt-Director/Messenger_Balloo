// DesktopCallsHistoryScreen.tsx — Desktop calls history screen
// Shows recent calls with filters and search

import React, { useState } from 'react';

interface CallRecord {
  id: string;
  contactName: string;
  contactAvatar?: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
  duration: number;
}

export function DesktopCallsHistoryScreen() {
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing' | 'missed'>('all');

  // Placeholder data — will be replaced with API data
  const calls: CallRecord[] = [
    { id: '1', contactName: 'Иван Иванов', type: 'incoming', timestamp: Date.now() - 3600000, duration: 325 },
    { id: '2', contactName: 'Мария Петрова', type: 'outgoing', timestamp: Date.now() - 7200000, duration: 180 },
    { id: '3', contactName: 'Алексей Смирнов', type: 'missed', timestamp: Date.now() - 10800000, duration: 0 },
    { id: '4', contactName: 'Елена Козлова', type: 'incoming', timestamp: Date.now() - 14400000, duration: 600 },
  ];

  const filteredCalls = filter === 'all' ? calls : calls.filter(c => c.type === filter);

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--accent, #2db84d)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary, #8a8aa0)',
    border: `1px solid ${active ? 'var(--accent, #2db84d)' : 'var(--border-color, #2a2a40)'}`,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: '13px',
  });

  const callItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid var(--border-color, #2a2a40)',
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary, #fff)' }}>
          История звонков
        </h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'incoming', 'outgoing', 'missed'] as const).map(f => (
            <button
              key={f}
              style={filterBtnStyle(filter === f)}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Все' : f === 'incoming' ? 'Входящие' : f === 'outgoing' ? 'Исходящие' : 'Пропущенные'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {filteredCalls.map(call => (
          <div key={call.id} style={callItemStyle}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--bg-surface, #2a2a40)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: 'var(--text-secondary, #8a8aa0)',
              flexShrink: 0,
            }}>
              {call.contactName.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary, #fff)', fontSize: '14px' }}>
                {call.contactName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #8a8aa0)', marginTop: '2px' }}>
                {call.type === 'incoming' ? '📞 Входящий' : call.type === 'outgoing' ? '📞 Исходящий' : '📞 Пропущенный'}
                {call.duration > 0 && ` — ${formatDuration(call.duration)}`}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary, #8a8aa0)', flexShrink: 0 }}>
              {formatTime(call.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
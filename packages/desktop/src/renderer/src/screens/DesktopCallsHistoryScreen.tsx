// DesktopCallsHistoryScreen.tsx — Desktop calls history screen
// Shows recent calls with filters and search

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@balloo/web/services/api';

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
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getCallHistory(filter === 'all' ? undefined : filter);
      setCalls(result.calls || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки истории звонков');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary, #8a8aa0)' }}>
            <p style={{ fontSize: '16px' }}>Загрузка...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#e74c3c' }}>
            <p style={{ fontSize: '16px' }}>{error}</p>
            <button onClick={fetchCalls} style={{ marginTop: '12px', padding: '6px 14px', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Повторить
            </button>
          </div>
        ) : calls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary, #8a8aa0)' }}>
            <p style={{ fontSize: '16px' }}>Нет звонков</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>История звонков появится здесь</p>
          </div>
        ) : (
          calls.map(call => (
            <div key={call.id} style={callItemStyle}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: call.type === 'missed' ? 'rgba(231, 76, 60, 0.2)' : 'var(--bg-surface, #2a2a40)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: call.type === 'missed' ? '#e74c3c' : 'var(--text-secondary, #8a8aa0)',
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
          ))
        )}
      </div>
    </div>
  );
}
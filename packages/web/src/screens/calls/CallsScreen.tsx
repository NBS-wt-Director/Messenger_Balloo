// Calls Screen — история звонков с цветопиктограммами статуса
// Макет: mockups/balloo-su/calls.html
// Функция: 0_01_08 — Звонки
// Тикет: 1792137287

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';

// --- Types ---

interface CallItem {
  id: string;
  chatId: string;
  chatName: string;
  chatAvatar: string | null;
  chatInitials: string;
  type: 'audio' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  status: 'accepted' | 'missed';
  duration: string;
  startTime: string;
  date: string;
}

// --- StatusPictogram ---

/**
 * Цветопиктограмма статуса звонка:
 * - зелёный круг ✓ — принятый / исходящий
 * - красный круг ✕ — пропущенный
 * Текстовых чипов нет — только пиктограмма.
 */
function StatusPictogram({ status }: { status: 'accepted' | 'missed' }) {
  const isAccepted = status === 'accepted';
  return (
    <span
      className="chip chip--pictogram"
      title={isAccepted ? 'Принятый' : 'Пропущенный'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        backgroundColor: isAccepted ? 'var(--accent, #2db84d)' : '#e74c3c',
        borderRadius: '50%',
        color: '#fff',
        fontSize: 12,
        fontWeight: 900,
        flexShrink: 0,
      }}
    >
      {isAccepted ? '✓' : '✕'}
    </span>
  );
}

// --- CallRow ---

function CallRow({ call }: { call: CallItem }) {
  const isVideo = call.type === 'video';
  const isGroup = call.chatName.startsWith('Команда') || call.chatName.startsWith('Технологии');

  const typeLabel = isVideo ? '📹 Видео' : '📞 Аудио';
  const groupLabel = isGroup ? ' группа' : '';
  const directionLabel =
    call.direction === 'missed' ? 'Пропущенный' : call.direction === 'incoming' ? 'Принятый' : 'Исходящий';

  return (
    <div className="list__item" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Avatar */}
      <div
        className="avatar avatar--sm avatar--bordered"
        style={{
          clipPath: 'var(--octagon-clip)',
          flexShrink: 0,
        }}
      >
        {call.chatAvatar ? (
          <img
            src={call.chatAvatar}
            alt={call.chatName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="avatar__inner">
            <span>{call.chatInitials}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="list__item-title" style={{ fontSize: 14, marginBottom: 2 }}>
          {call.chatName}
        </div>
        <div className="list__item-subtitle" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {typeLabel}{groupLabel} • {directionLabel} • {call.startTime} • {call.duration}
        </div>
      </div>

      {/* Status pictogram */}
      <StatusPictogram status={call.status} />
    </div>
  );
}

// --- FilterButtons ---

function FilterButtons({
  filter,
  onFilterChange,
}: {
  filter: string;
  onFilterChange: (f: string) => void;
}) {
  return (
    <div className="flex gap-2 mb-4" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <button
        className={`btn ${filter === 'audio' ? 'btn--primary' : 'btn--secondary'}`}
        onClick={() => onFilterChange(filter === 'audio' ? '' : 'audio')}
        style={{ padding: '8px 16px', fontSize: 18 }}
        title="Только аудио"
      >
        📞
      </button>
      <button
        className={`btn ${filter === 'video' ? 'btn--primary' : 'btn--secondary'}`}
        onClick={() => onFilterChange(filter === 'video' ? '' : 'video')}
        style={{ padding: '8px 16px', fontSize: 18 }}
        title="Только видео"
      >
        📹
      </button>
    </div>
  );
}

// --- Main Screen ---

function CallsScreen() {
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  const loadCalls = async (pageNum: number, callFilter: string) => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.get<any[]>(
        `/api/calls?filter=${callFilter || 'all'}&page=${pageNum}&limit=${limit}`
      );
      // Transform server response to CallItem shape
      const transformed: CallItem[] = (data || []).map((item: any) => ({
        id: item.id,
        chatId: item.chatId || item.groupId || '',
        chatName: item.chatName || item.name || 'Без имени',
        chatAvatar: item.chatAvatar || item.avatarUrl || null,
        chatInitials: (item.chatInitials || item.name || '??')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        type: item.type === 'video' ? 'video' : 'audio',
        direction: item.direction || 'incoming',
        status: item.status || (item.direction === 'missed' ? 'missed' : 'accepted'),
        duration: item.duration || '0:00',
        startTime: item.startTime || item.time || '--:--',
        date: item.date || '',
      }));
      setCalls(transformed);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls(page, filter);
  }, [page, filter]);

  return (
    <div className="page-container">
      {/* Page header */}
      <h1 className="page-title" style={{ margin: 0, marginBottom: 4 }}>
        Звонки
      </h1>
      <p className="page-subtitle" style={{ margin: 0, marginBottom: 16, color: 'var(--text-secondary)' }}>
        История всех звонков
      </p>

      {/* Filter buttons */}
      <FilterButtons filter={filter} onFilterChange={(f) => { setFilter(f); setPage(1); }} />

      {/* Call list */}
      {loading ? (
        <div className="text-muted" style={{ padding: 24, textAlign: 'center' }}>
          Загрузка звонков...
        </div>
      ) : error ? (
        <div className="text-muted" style={{ padding: 24, textAlign: 'center' }}>
          Не удалось загрузить звонки
        </div>
      ) : calls.length === 0 ? (
        <div className="text-muted" style={{ padding: 24, textAlign: 'center' }}>
          У вас пока нет звонков
        </div>
      ) : (
        <div className="list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {calls.map((call) => (
            <CallRow key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CallsScreen;

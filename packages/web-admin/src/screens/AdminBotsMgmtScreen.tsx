// AdminBotsMgmtScreen — управление ботами
// Макет: mockups/admin-balloo-su/bots-mgmt.html
// Правило: админ не может удалить бота — только приостановить, написать создателю,
// забанить создателя, верифицировать.

import { useState } from 'react';

interface Bot {
  id: string;
  name: string;
  username: string;
  creator: string;
  status: 'active' | 'suspended';
  verified: boolean;
  pendingSupport: boolean;
  complaints: number;
  complaintsList?: Complaint[];
}

interface Complaint {
  type: string;
  date: string;
  status: 'reviewed' | 'rejected' | 'pending';
}

const MOCK_BOTS: Bot[] = [
  {
    id: '1', name: 'WeatherBot', username: '@weather_bot', creator: 'Иван Иванов',
    status: 'active', verified: true, pendingSupport: false, complaints: 0,
  },
  {
    id: '2', name: 'SpamHelper', username: '@spam_helper', creator: 'Спамер',
    status: 'suspended', verified: false, pendingSupport: false, complaints: 3,
    complaintsList: [
      { type: 'Спам', date: '15.07.2026', status: 'reviewed' },
      { type: 'Оскорбления', date: '14.07.2026', status: 'rejected' },
      { type: 'Фейк', date: '13.07.2026', status: 'pending' },
    ],
  },
  {
    id: '3', name: 'TranslateBot', username: '@translate_bot', creator: 'Мария Андреева',
    status: 'active', verified: true, pendingSupport: false, complaints: 0,
  },
  {
    id: '4', name: 'QuizBot', username: '@quiz_bot', creator: 'Алексей Козлов',
    status: 'active', verified: false, pendingSupport: true, complaints: 0,
  },
];

export function AdminBotsMgmtScreen() {
  const [search, setSearch] = useState('');
  const [bots] = useState(MOCK_BOTS);

  const filtered = bots.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.username.toLowerCase().includes(search.toLowerCase()) ||
    b.creator.toLowerCase().includes(search.toLowerCase())
  );

  const statusChip = (status: string, pending?: boolean) => {
    if (pending) return <span className="chip chip--warning">⏳ Ожидание ТП</span>;
    if (status === 'active') return <span className="chip chip--accent">Активен</span>;
    return <span className="chip chip--warning">Приостановлен</span>;
  };

  const verifiedChip = (bot: Bot) => {
    if (bot.verified) return <span className="chip chip--info">✓ Верифицирован</span>;
    if (bot.pendingSupport) return <span className="chip chip--warning">⏳ Ожидание ТП</span>;
    return <span className="chip">—</span>;
  };

  return (
    <div className="page-container">
      <h1 className="page-title">🤖 Управление ботами</h1>
      <p className="page-subtitle">
        Администрация НЕ может удалить бота. Доступные действия: приостановить (по жалобе),
        написать создателю, забанить создателя, верифицировать. Удаление бота — только создатель.
      </p>

      <div className="card mb-4" style={{ borderColor: 'var(--warning)', background: 'rgba(232,163,23,0.08)' }}>
        <div className="text-sm" style={{ color: 'var(--warning)' }}>⚠ Правило удаления</div>
        <div className="text-xs text-secondary mt-2">Админ не может удалить бота. Удаление доступно только создателю через пользовательский API. Админ может приостановить работу бота или забанить создателя.</div>
      </div>

      <div className="form-group mb-4">
        <input
          type="text"
          className="form-input"
          placeholder="🔍 Поиск по @username, имени, создателю..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Бот</th>
              <th>@username</th>
              <th>Создатель</th>
              <th>Статус</th>
              <th>Верификация</th>
              <th>Жалобы</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((bot) => (
              <tr key={bot.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="avatar avatar--xs avatar--bordered avatar--ctx-new">
                      <div className="avatar__inner">🤖</div>
                    </div>
                    {bot.name}
                  </div>
                </td>
                <td>{bot.username}</td>
                <td>{bot.creator}</td>
                <td>{statusChip(bot.status, bot.pendingSupport)}</td>
                <td>{verifiedChip(bot)}</td>
                <td>
                  {bot.complaints > 0 ? (
                    <span className="chip chip--danger" style={{ cursor: 'pointer' }}>🔴 {bot.complaints}</span>
                  ) : (
                    <span className="chip">—</span>
                  )}
                </td>
                <td className="flex gap-2">
                  {bot.status === 'active' ? (
                    <button className="btn btn--secondary btn--sm" title="Приостановить">⏸</button>
                  ) : (
                    <button className="btn btn--secondary btn--sm" title="Возобновить">▶</button>
                  )}
                  <button className="btn btn--secondary btn--sm" title="Написать создателю">✉</button>
                  {!bot.verified && !bot.pendingSupport && (
                    <button className="btn btn--secondary btn--sm" title="Верифицировать">✓</button>
                  )}
                  <button className="btn btn--danger btn--sm" title="Забанить создателя">🔨</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

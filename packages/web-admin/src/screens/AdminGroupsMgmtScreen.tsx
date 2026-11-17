// AdminGroupsMgmtScreen — модерация групп
// Макет: mockups/admin-balloo-su/groups-mgmt.html
// Правило: удаление — только создатель/админ группы при 1 участнике.
// При 0 участниках — удаляется автоматически. Админ: передать владение, закрыть,
// скрыть контент, верифицировать.

import { useState } from 'react';

type GroupTab = 'all' | 'media';

interface Group {
  id: string;
  name: string;
  type: 'media' | 'corp' | 'private';
  owner: string;
  members: number | string;
  status: 'active' | 'hidden' | 'closed';
  closeable?: boolean;
  closeNote?: string;
}

const MOCK_GROUPS: Group[] = [
  { id: '1', name: 'Российская Газета', type: 'media', owner: 'Редакция', members: 12480, status: 'active' },
  { id: '2', name: 'Технологии будущего', type: 'corp', owner: 'Витрина', members: 8230, status: 'hidden' },
  { id: '3', name: 'Команда разработки', type: 'private', owner: 'Алексей Козлов', members: 1, status: 'closed', closeable: true, closeNote: 'Может быть удалена создателем (1 участник)' },
];

const MEDIA_APPLICATIONS = [
  { id: '1', applicant: 'Редакция РосГаз', group: 'Российская Газета', docs: '3 файла', date: '15.07.2026' },
  { id: '2', applicant: 'Иван Иванов', group: 'IT Новости', docs: '2 файла', date: '12.07.2026' },
];

export function AdminGroupsMgmtScreen() {
  const [tab, setTab] = useState<GroupTab>('all');

  return (
    <div className="page-container">
      <h1 className="page-title">👥 Модерация групп</h1>
      <p className="page-subtitle">
        Удалить группу может только создатель/админ группы при 1 участнике.
        При 0 участниках — удаляется автоматически. Админ-панель: передать владение,
        закрыть, скрыть контент, верифицировать.
      </p>

      <div className="card mb-4" style={{ borderColor: 'var(--warning)', background: 'rgba(232,163,23,0.08)' }}>
        <div className="text-sm" style={{ color: 'var(--warning)' }}>⚠ Правила удаления группы</div>
        <div className="text-xs text-secondary mt-2">Удаление — только создатель/админ группы, если остался 1 участник. При 0 участниках группа удаляется автоматически. Админ-панель не удаляет группы напрямую.</div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-4">
        <div className={`tab ${tab === 'all' ? 'tab--active' : ''}`} onClick={() => setTab('all')}>Все группы</div>
        <div className={`tab ${tab === 'media' ? 'tab--active' : ''}`} onClick={() => setTab('media')}>
          Заявки СМИ <span className="badge" style={{ marginLeft: 6 }}>3</span>
        </div>
      </div>

      {tab === 'all' && (
        <div className="card mb-6">
          <table className="table">
            <thead>
              <tr>
                <th>Группа</th>
                <th>Тип</th>
                <th>Владелец</th>
                <th>Участников</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_GROUPS.map((g) => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td>
                    <span className={`chip ${g.type === 'media' ? 'chip--info' : g.type === 'corp' ? 'chip--warning' : ''}`}>
                      {g.type === 'media' ? 'СМИ' : g.type === 'corp' ? 'КОРП' : 'PRIVATE'}
                    </span>
                  </td>
                  <td>{g.owner}</td>
                  <td>{g.members}</td>
                  <td>
                    <span className={`chip ${g.status === 'active' ? 'chip--accent' : g.status === 'hidden' ? 'chip--warning' : 'chip--danger'}`}>
                      {g.status === 'active' ? 'Активна' : g.status === 'hidden' ? 'Контент скрыт' : 'Закрыта'}
                    </span>
                  </td>
                  <td className="flex gap-2">
                    <button className="btn btn--secondary btn--sm" title="Передать владение">↗</button>
                    {g.status === 'active' ? (
                      <>
                        <button className="btn btn--secondary btn--sm" title="Закрыть">🔒</button>
                        <button className="btn btn--secondary btn--sm" title="Скрыть контент">🙈</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn--secondary btn--sm" title="Открыть">🔓</button>
                        <button className="btn btn--secondary btn--sm" title="Показать контент">👁</button>
                      </>
                    )}
                    <button className="btn btn--secondary btn--sm" title="Верифицировать">✓</button>
                    {g.closeable && <span className="text-xs text-muted" style={{ fontSize: 11 }}>{g.closeNote}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'media' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Заявитель</th>
                <th>Группа</th>
                <th>Документы</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {MEDIA_APPLICATIONS.map((app) => (
                <tr key={app.id}>
                  <td>{app.applicant}</td>
                  <td>{app.group}</td>
                  <td><a href="#" className="text-accent">{app.docs}</a></td>
                  <td>{app.date}</td>
                  <td><span className="chip chip--warning">На рассмотрении</span></td>
                  <td className="flex gap-2">
                    <button className="btn btn--primary btn--sm">Одобрить</button>
                    <button className="btn btn--danger btn--sm">Отклонить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

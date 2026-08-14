// Group Settings Screen — настройки группы
// Макет: mockups/balloo-su/group-settings.html
// Функция: 0_01_05 — Управление группами

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

type SettingsTab =
  | 'general'
  | 'members'
  | 'roles'
  | 'templates'
  | 'media'
  | 'corporate'
  | 'export'
  | 'danger';

interface GroupMember {
  id: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: number;
}

const TABS: Array<{ id: SettingsTab; label: string; icon: string }> = [
  { id: 'general', label: 'Основное', icon: '⚙️' },
  { id: 'members', label: 'Участники', icon: '👥' },
  { id: 'roles', label: 'Роли', icon: '🔑' },
  { id: 'templates', label: 'Шаблоны', icon: '📝' },
  { id: 'media', label: 'СМИ', icon: '📰' },
  { id: 'corporate', label: 'Корпоративные', icon: '🏢' },
  { id: 'export', label: 'Экспорт/импорт', icon: '💾' },
  { id: 'danger', label: 'Удалить', icon: '🗑️' },
];

function GroupSettingsScreen() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [groupName, setGroupName] = useState('Моя группа');
  const [groupDescription, setGroupDescription] = useState('Описание группы');
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState('https://balloo.su/join/abc123');
  const [members, setMembers] = useState<GroupMember[]>([
    {
      id: '1',
      user: { id: '1', username: 'ivan', displayName: 'Иван Иванов', avatarUrl: undefined },
      role: 'owner',
      joinedAt: Date.now() - 86400000 * 30,
    },
    {
      id: '2',
      user: { id: '2', username: 'anna', displayName: 'Анна Петрова', avatarUrl: undefined },
      role: 'admin',
      joinedAt: Date.now() - 86400000 * 20,
    },
    {
      id: '3',
      user: { id: '3', username: 'sergey', displayName: 'Сергей Сидоров', avatarUrl: undefined },
      role: 'member',
      joinedAt: Date.now() - 86400000 * 10,
    },
  ]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  const filteredMembers = members.filter(
    (m) =>
      m.user.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.user.displayName?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleSaveGeneral = async () => {
    try {
      await api.updateGroup(chatId!, {
        name: groupName,
        description: groupDescription,
      });
      alert('Настройки сохранены');
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Удалить участника из группы?')) return;
    try {
      await api.removeMember(chatId!, memberId);
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: GroupMember['role']) => {
    try {
      await api.updateMemberRole(chatId!, memberId, newRole);
      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (err: any) {
      alert(err.message || 'Ошибка изменения роли');
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Ссылка скопирована');
  };

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      const blob = await api.exportGroupSettings(chatId!);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `group-${chatId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Ошибка экспорта');
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Вы уверены? Группа будет удалена навсегда.')) return;
    try {
      await api.deleteGroup(chatId!);
      navigate('/chat', { replace: true });
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления группы');
    }
  };

  const tabsCount = members.filter((m) => m.role === 'member').length;

  return (
    <div className="page-layout">
      {/* Sidebar */}
      <aside className="settings-sidebar">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {groupAvatar ? (
              <img
                src={groupAvatar}
                alt=""
                className="w-12 h-12"
                style={{ clipPath: 'var(--octagon-clip)', border: '2px solid var(--accent)' }}
              />
            ) : (
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{
                  background: 'var(--surface)',
                  clipPath: 'var(--octagon-clip)',
                  border: '2px solid var(--border)',
                  fontSize: '20px',
                }}
              >
                👥
              </div>
            )}
            <div>
              <h2 className="font-semibold">{groupName}</h2>
              <span className="text-xs text-muted">{tabsCount} участников</span>
            </div>
          </div>
        </div>

        <nav className="settings-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`settings-nav__item ${activeTab === tab.id ? 'settings-nav__item--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="settings-nav__icon">{tab.icon}</span>
              <span className="settings-nav__label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="settings-content">
        {/* --- General --- */}
        {activeTab === 'general' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Основное</h1>

            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Информация о группе</h3>

              <div className="form-group">
                <label className="form-label">Название</label>
                <input
                  type="text"
                  className="form-input"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={64}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea
                  className="form-input form-input--textarea"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ссылка-приглашение</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="form-input flex-1"
                    value={inviteLink}
                    readOnly
                    style={{ background: 'var(--surface)' }}
                  />
                  <button className="btn btn--secondary" onClick={handleCopyInviteLink}>
                    📋 Копировать
                  </button>
                </div>
              </div>

              <button className="btn btn--primary" onClick={handleSaveGeneral}>
                Сохранить
              </button>
            </div>

            {/* Statistics (read-only) */}
            <div className="card" style={{ opacity: 0.7, pointerEvents: 'none' }}>
              <h3 className="text-lg font-semibold mb-4">Статистика</h3>
              <div className="grid grid--3">
                <div className="stat-card">
                  <span className="stat-card__value">{tabsCount}</span>
                  <span className="stat-card__label">Участников</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card__value">1 247</span>
                  <span className="stat-card__label">Сообщений</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card__value">30</span>
                  <span className="stat-card__label">Дней активно</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Members --- */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Участники</h1>
              <button
                className="btn btn--primary btn--sm"
                onClick={() => setShowAddMember(true)}
              >
                ➕ Добавить
              </button>
            </div>

            {/* Search */}
            <div className="card mb-6">
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Поиск участников..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>

            {/* Members list */}
            <div className="card">
              {filteredMembers.map((member) => (
                <div key={member.id} className="member-row">
                  <div className="flex items-center gap-3">
                    {member.user.avatarUrl ? (
                      <img
                        src={member.user.avatarUrl}
                        alt=""
                        className="w-10 h-10"
                        style={{
                          clipPath: 'var(--octagon-clip)',
                          border: '2px solid var(--border)',
                        }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 flex items-center justify-center"
                        style={{
                          background: 'var(--surface)',
                          clipPath: 'var(--octagon-clip)',
                          border: '2px solid var(--border)',
                          fontSize: '16px',
                        }}
                      >
                        😊
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{member.user.displayName || member.user.username}</div>
                      <div className="text-xs text-muted">@{member.user.username}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      className="form-input form-input--sm"
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as GroupMember['role'])}
                      style={{ minWidth: '140px' }}
                    >
                      <option value="owner">👑 Владелец</option>
                      <option value="admin">🔧 Администратор</option>
                      <option value="moderator">🛡️ Модератор</option>
                      <option value="member">👤 Участник</option>
                    </select>

                    {member.role !== 'owner' && (
                      <button
                        className="btn btn--danger btn--sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add member modal */}
            {showAddMember && (
              <div className="modal-overlay" onClick={() => setShowAddMember(false)} />
            )}
            {showAddMember && (
              <div className="modal modal--sm">
                <div className="modal__header">
                  <span className="modal__title">Добавить участника</span>
                  <div className="modal__close" onClick={() => setShowAddMember(false)}>
                    ✕
                  </div>
                </div>
                <div className="modal__body">
                  <p className="text-muted mb-4">
                    Введите username или email участника для добавления в группу.
                  </p>
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="username или email"
                    />
                  </div>
                </div>
                <div className="modal__footer">
                  <button
                    className="btn btn--secondary"
                    onClick={() => setShowAddMember(false)}
                  >
                    Отмена
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={() => {
                      alert('Приглашение отправлено');
                      setShowAddMember(false);
                    }}
                  >
                    Добавить
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Roles --- */}
        {activeTab === 'roles' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Роли и права</h1>

            <div className="card mb-6">
              <p className="text-muted mb-4">
                Определите, что может делать каждая роль в группе.
              </p>

              <div className="roles-table">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted">
                      <th className="pb-3 pr-4">Действие</th>
                      <th className="pb-3 pr-4 text-center">👑 Владелец</th>
                      <th className="pb-3 pr-4 text-center">🔧 Админ</th>
                      <th className="pb-3 pr-4 text-center">🛡️ Модератор</th>
                      <th className="pb-3 text-center">👤 Участник</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { action: 'Управление группой', levels: [true, true, false, false] },
                      { action: 'Удаление сообщений', levels: [true, true, true, false] },
                      { action: 'Закрепление сообщений', levels: [true, true, true, false] },
                      { action: 'Приглашение ссылок', levels: [true, true, true, false] },
                      { action: 'Редактирование группы', levels: [true, true, false, false] },
                      { action: 'Назначение ролей', levels: [true, false, false, false] },
                    ].map((perm) => (
                      <tr key={perm.action} className="border-t border-border">
                        <td className="py-3 pr-4">{perm.action}</td>
                        {perm.levels.map((allowed, i) => (
                          <td key={i} className="py-3 text-center text-xl">
                            {allowed ? '✅' : '❌'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- Templates --- */}
        {activeTab === 'templates' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Шаблоны сообщений</h1>
              <button className="btn btn--primary btn--sm">➕ Создать шаблон</button>
            </div>

            {/* Sub-tabs */}
            <div className="sub-tabs mb-6">
              <button className="sub-tabs__item sub-tabs__item--active">Текст</button>
              <button className="sub-tabs__item">Вложение</button>
              <button className="sub-tabs__item">Интерактив</button>
            </div>

            <div className="card">
              <div className="text-center py-8 text-muted">
                <p className="text-lg mb-2">📝</p>
                <p>Шаблоны сообщений пока не созданы</p>
                <p className="text-sm mt-2">
                  Используйте шаблоны для быстрых ответов и стандартных сообщений
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- Media --- */}
        {activeTab === 'media' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">СМИ</h1>

            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Статус верификации</h3>
              <div className="flex items-center gap-3 mb-4">
                <span className="chip chip--outline">Не верифицировано</span>
                <span className="text-sm text-muted">
                  Для СМИ-групп требуется подтверждение документами
                </span>
              </div>
              <p className="text-sm text-muted">
                Для получения статуса СМИ отправьте подтверждающие документы при создании группы.
              </p>
            </div>

            <div className="card" style={{ opacity: 0.6 }}>
              <h3 className="text-lg font-semibold mb-4">Реклама</h3>
              <p className="text-sm text-muted">
                Размещение рекламы в группе — v2
                <span className="chip chip--outline" style={{ marginLeft: '8px' }}>
                  в разработке
                </span>
              </p>
            </div>
          </div>
        )}

        {/* --- Corporate --- */}
        {activeTab === 'corporate' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Корпоративные настройки</h1>

            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Витрина</h3>
              <p className="text-sm text-muted mb-4">
                Показывайте товары и услуги вашей корпорации
              </p>
              <button className="btn btn--secondary btn--sm mb-4">
                🏪 Открыть витрину
              </button>
            </div>

            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Расписание офисов</h3>
              <p className="text-sm text-muted mb-4">
                Добавьте адреса и часы работы ваших офисов
              </p>
              <button className="btn btn--secondary btn--sm mb-4">
                📍 Добавить офис
              </button>
            </div>

            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Чаты</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Чат клиентов</div>
                    <div className="text-xs text-muted">Для поддержки клиентов</div>
                  </div>
                  <button className="btn btn--secondary btn--sm">⚙️ Настроить</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Чат сотрудников</div>
                    <div className="text-xs text-muted">Внутренний чат для сотрудников</div>
                  </div>
                  <button className="btn btn--secondary btn--sm">⚙️ Настроить</button>
                </div>
              </div>
            </div>

            <div className="card" style={{ opacity: 0.6 }}>
              <h3 className="text-lg font-semibold mb-4">Реклама</h3>
              <p className="text-sm text-muted">
                Настройка рекламных кампаний — v2
                <span className="chip chip--outline" style={{ marginLeft: '8px' }}>
                  в разработке
                </span>
              </p>
            </div>
          </div>
        )}

        {/* --- Export --- */}
        {activeTab === 'export' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Экспорт / Импорт</h1>

            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Экспорт настроек</h3>
              <p className="text-sm text-muted mb-4">
                Скачайте все настройки и данные группы в выбранном формате.
              </p>
              <div className="flex gap-3">
                <button
                  className="btn btn--secondary"
                  onClick={() => handleExport('json')}
                >
                  📄 JSON
                </button>
                <button
                  className="btn btn--secondary"
                  onClick={() => handleExport('csv')}
                >
                  📊 CSV
                </button>
                <button
                  className="btn btn--secondary"
                  onClick={() => handleExport('pdf')}
                >
                  📋 PDF
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Импорт настроек</h3>
              <p className="text-sm text-muted mb-4">
                Загрузите ранее экспортированный файл для восстановления настроек.
              </p>
              <input
                type="file"
                accept=".json,.csv"
                className="form-input"
                style={{ maxWidth: '300px' }}
              />
            </div>
          </div>
        )}

        {/* --- Danger (Delete) --- */}
        {activeTab === 'danger' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Удалить группу</h1>

            <div className="card" style={{ borderColor: 'var(--danger)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--danger)' }}>
                ⚠️ Опасная зона
              </h3>
              <p className="text-muted mb-4">
                Удаление группы необратимо. Все сообщения, файлы и настройки будут удалены.
              </p>

              {tabsCount > 0 ? (
                <div
                  className="p-4 rounded"
                  style={{ background: 'var(--surface)', opacity: 0.6 }}
                >
                  <p className="text-sm text-muted">
                    🚫 Группа не может быть удалена, пока в ней есть участники.
                    Удалите или переназначьте всех участников.
                  </p>
                </div>
              ) : (
                <button
                  className="btn btn--danger"
                  onClick={handleDeleteGroup}
                >
                  🗑️ Удалить группу навсегда
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default GroupSettingsScreen;

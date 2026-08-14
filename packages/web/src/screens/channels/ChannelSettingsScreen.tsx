// Channel Settings Screen — настройки канала
// Макет: основан на group-settings.html, адаптирован для каналов
// Функция: 0_01_06 — Управление каналами

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

type ChannelSettingsTab = 'general' | 'admins' | 'bots' | 'discussion' | 'danger';

interface ChannelAdmin {
  id: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  role: 'owner' | 'admin' | 'moderator';
  permissions: string[];
}

const TABS: Array<{ id: ChannelSettingsTab; label: string; icon: string }> = [
  { id: 'general', label: 'Основное', icon: '⚙️' },
  { id: 'admins', label: 'Администраторы', icon: '👥' },
  { id: 'bots', label: 'Боты', icon: '🤖' },
  { id: 'discussion', label: 'Обсуждение', icon: '💬' },
  { id: 'danger', label: 'Удалить', icon: '🗑️' },
];

function ChannelSettingsScreen() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ChannelSettingsTab>('general');
  const [channelName, setChannelName] = useState('Мой канал');
  const [channelDescription, setChannelDescription] = useState('Описание канала');
  const [channelAvatar, setChannelAvatar] = useState<string | undefined>(undefined);
  const [subscribers, setSubscribers] = useState(1247);
  const [admins, setAdmins] = useState<ChannelAdmin[]>([
    {
      id: '1',
      user: { id: '1', username: 'ivan', displayName: 'Иван Иванов', avatarUrl: undefined },
      role: 'owner',
      permissions: ['all'],
    },
    {
      id: '2',
      user: { id: '2', username: 'anna', displayName: 'Анна Петрова', avatarUrl: undefined },
      role: 'admin',
      permissions: ['post', 'edit', 'delete'],
    },
  ]);
  const [botCommands, setBotCommands] = useState<Array<{ bot: string; command: string }>>([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showAddBot, setShowAddBot] = useState(false);

  const handleSaveGeneral = async () => {
    try {
      await api.updateChannel(chatId!, {
        name: channelName,
        description: channelDescription,
      });
      alert('Настройки сохранены');
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения');
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Удалить администратора?')) return;
    try {
      await api.removeChannelAdmin(chatId!, adminId);
      setAdmins(admins.filter((a) => a.id !== adminId));
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления');
    }
  };

  const handleRoleChange = async (adminId: string, newRole: ChannelAdmin['role']) => {
    try {
      await api.updateChannelAdminRole(chatId!, adminId, newRole);
      setAdmins(
        admins.map((a) => (a.id === adminId ? { ...a, role: newRole } : a))
      );
    } catch (err: any) {
      alert(err.message || 'Ошибка изменения роли');
    }
  };

  const handleAddBot = () => {
    setShowAddBot(true);
  };

  const handleDeleteChannel = async () => {
    if (!confirm('Вы уверены? Канал будет удалён навсегда.')) return;
    try {
      await api.deleteChannel(chatId!);
      navigate('/chat', { replace: true });
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления канала');
    }
  };

  return (
    <div className="page-layout">
      {/* Sidebar */}
      <aside className="settings-sidebar">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {channelAvatar ? (
              <img
                src={channelAvatar}
                alt=""
                className="w-12 h-12"
                style={{
                  clipPath: 'var(--octagon-clip)',
                  border: '2px solid #ffd700',
                }}
              />
            ) : (
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                  clipPath: 'var(--octagon-clip)',
                  border: '2px solid #ffd700',
                  fontSize: '18px',
                }}
              >
                📢
              </div>
            )}
            <div>
              <h2 className="font-semibold">{channelName}</h2>
              <span className="text-xs text-muted">👥 {subscribers} подписчиков</span>
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
              <h3 className="text-lg font-semibold mb-4">Информация о канале</h3>

              <div className="form-group">
                <label className="form-label">Название</label>
                <input
                  type="text"
                  className="form-input"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  maxLength={70}
                />
                <span className="text-xs text-muted">{channelName.length}/70</span>
              </div>

              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea
                  className="form-input form-input--textarea"
                  value={channelDescription}
                  onChange={(e) => setChannelDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <span className="text-xs text-muted">{channelDescription.length}/500</span>
              </div>

              <button className="btn btn--primary" onClick={handleSaveGeneral}>
                Сохранить
              </button>
            </div>

            {/* Statistics */}
            <div className="card" style={{ opacity: 0.7, pointerEvents: 'none' }}>
              <h3 className="text-lg font-semibold mb-4">Статистика</h3>
              <div className="grid grid--3">
                <div className="stat-card">
                  <span className="stat-card__value">{subscribers}</span>
                  <span className="stat-card__label">Подписчиков</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card__value">89</span>
                  <span className="stat-card__label">Постов</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card__value">4.2K</span>
                  <span className="stat-card__label">Охват за месяц</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Admins --- */}
        {activeTab === 'admins' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Администраторы</h1>
              <button
                className="btn btn--primary btn--sm"
                onClick={() => setShowAddAdmin(true)}
              >
                ➕ Добавить
              </button>
            </div>

            <div className="card mb-6">
              <p className="text-sm text-muted mb-4">
                Администраторы могут управлять каналом в зависимости от назначенных прав.
              </p>

              {admins.map((admin) => (
                <div key={admin.id} className="member-row">
                  <div className="flex items-center gap-3">
                    {admin.user.avatarUrl ? (
                      <img
                        src={admin.user.avatarUrl}
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
                        👤
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">
                        {admin.user.displayName || admin.user.username}
                      </div>
                      <div className="text-xs text-muted">
                        @{admin.user.username} · {admin.permissions.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {admin.role !== 'owner' ? (
                      <>
                        <select
                          className="form-input form-input--sm"
                          value={admin.role}
                          onChange={(e) =>
                            handleRoleChange(admin.id, e.target.value as ChannelAdmin['role'])
                          }
                          style={{ minWidth: '120px' }}
                        >
                          <option value="admin">🔧 Администратор</option>
                          <option value="moderator">🛡️ Модератор</option>
                        </select>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => handleRemoveAdmin(admin.id)}
                        >
                          Удалить
                        </button>
                      </>
                    ) : (
                      <span className="chip chip--accent">Создатель</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add admin modal */}
            {showAddAdmin && (
              <>
                <div className="modal-overlay" onClick={() => setShowAddAdmin(false)} />
                <div className="modal modal--sm">
                  <div className="modal__header">
                    <span className="modal__title">Добавить администратора</span>
                    <div
                      className="modal__close"
                      onClick={() => setShowAddAdmin(false)}
                    >
                      ✕
                    </div>
                  </div>
                  <div className="modal__body">
                    <p className="text-muted mb-4">
                      Введите username для добавления в администраторы.
                    </p>
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="@username"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Роль</label>
                      <select className="form-input">
                        <option value="admin">Администратор</option>
                        <option value="moderator">Модератор</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal__footer">
                    <button
                      className="btn btn--secondary"
                      onClick={() => setShowAddAdmin(false)}
                    >
                      Отмена
                    </button>
                    <button
                      className="btn btn--primary"
                      onClick={() => {
                        alert('Администратор добавлен');
                        setShowAddAdmin(false);
                      }}
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- Bots --- */}
        {activeTab === 'bots' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Бот-команды</h1>
              <button className="btn btn--primary btn--sm" onClick={handleAddBot}>
                ➕ Добавить бота
              </button>
            </div>

            <div className="card mb-6">
              <p className="text-sm text-muted mb-4">
                Привяжите бота для автоматической публикации. Бот будет отправлять посты
                по команде, например: `@botname /publish`.
              </p>

              {botCommands.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <p className="text-lg mb-2">🤖</p>
                  <p>Боты пока не подключены</p>
                </div>
              ) : (
                botCommands.map((bot, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-t border-border">
                    <div>
                      <div className="font-semibold">{bot.bot}</div>
                      <div className="text-xs text-muted">Команда: `{bot.command}`</div>
                    </div>
                    <button className="btn btn--danger btn--sm">✕ Отключить</button>
                  </div>
                ))
              )}
            </div>

            {/* Add bot modal */}
            {showAddBot && (
              <>
                <div className="modal-overlay" onClick={() => setShowAddBot(false)} />
                <div className="modal modal--sm">
                  <div className="modal__header">
                    <span className="modal__title">Добавить бота</span>
                    <div className="modal__close" onClick={() => setShowAddBot(false)}>
                      ✕
                    </div>
                  </div>
                  <div className="modal__body">
                    <p className="text-muted mb-4">
                      Введите username бота и команду для публикации.
                    </p>
                    <div className="form-group">
                      <label className="form-label">Username бота</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="@botname"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Команда</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="/publish"
                      />
                    </div>
                  </div>
                  <div className="modal__footer">
                    <button
                      className="btn btn--secondary"
                      onClick={() => setShowAddBot(false)}
                    >
                      Отмена
                    </button>
                    <button
                      className="btn btn--primary"
                      onClick={() => {
                        alert('Бот добавлен');
                        setShowAddBot(false);
                      }}
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- Discussion --- */}
        {activeTab === 'discussion' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Обсуждение</h1>

            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Группа для комментариев</h3>
              <p className="text-sm text-muted mb-4">
                Если включено, к посту автоматически прикрепляется группа-чат для комментариев.
              </p>

              <div className="form-group form-group--flex">
                <div className="flex-1">
                  <label className="form-label">Включить обсуждение</label>
                  <p className="text-xs text-muted">
                    Подписчики смогут комментировать посты в привязанной группе
                  </p>
                </div>
                <label className="switch">
                  <input type="checkbox" />
                  <span className="switch__slider" />
                </label>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Настройки комментариев</h3>
              <div className="form-group form-group--flex">
                <div className="flex-1">
                  <label className="form-label">Модерация комментариев</label>
                  <p className="text-xs text-muted">
                    Все комментарии проходят модерацию перед публикацией
                  </p>
                </div>
                <label className="switch">
                  <input type="checkbox" />
                  <span className="switch__slider" />
                </label>
              </div>

              <div className="form-group form-group--flex mt-4">
                <div className="flex-1">
                  <label className="form-label">Разрешить ссылки</label>
                  <p className="text-xs text-muted">
                    Разрешить подписчикам добавлять ссылки в комментариях
                  </p>
                </div>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="switch__slider" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* --- Danger (Delete) --- */}
        {activeTab === 'danger' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Удалить канал</h1>

            <div className="card" style={{ borderColor: 'var(--danger)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--danger)' }}>
                ⚠️ Опасная зона
              </h3>
              <p className="text-muted mb-4">
                Удаление канала необратимо. Все посты, подписчики и настройки будут удалены.
              </p>

              <button
                className="btn btn--danger"
                onClick={handleDeleteChannel}
              >
                🗑️ Удалить канал навсегда
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ChannelSettingsScreen;

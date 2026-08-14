// Blocked Users Screen — полный экран блокированных пользователей
// Макет: mockups/balloo-su/blocked-users.html

import { useState } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  phone?: string;
  avatarUrl?: string;
  blockedDate: string;
  messageAttempts: number;
}

interface BlockedChannel {
  id: string;
  name: string;
  avatarUrl?: string;
  blockedDate: string;
}

export default function BlockedUsersScreen() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([
    {
      id: '1',
      username: 'blocked1',
      displayName: 'Блокированный пользователь 1',
      phone: '+7 (999) ***-**-01',
      blockedDate: '10.07.2026 14:30',
      messageAttempts: 5,
    },
    {
      id: '2',
      username: 'blocked2',
      displayName: 'Блокированный пользователь 2',
      phone: '+7 (999) ***-**-02',
      blockedDate: '05.07.2026 09:15',
      messageAttempts: 4,
    },
    {
      id: '3',
      username: 'blocked3',
      displayName: 'Блокированный пользователь 3',
      phone: '+7 (999) ***-**-03',
      blockedDate: '01.07.2026 18:45',
      messageAttempts: 3,
    },
  ]);

  const [blockedChannels, setBlockedChannels] = useState<BlockedChannel[]>([
    {
      id: '1',
      name: 'Спам-канал',
      blockedDate: '12.07.2026',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);

  const handleUnblockUser = async (userId: string) => {
    if (!confirm('Разблокировать этого пользователя? Он снова сможет видеть ваш профиль и писать вам.')) {
      return;
    }
    try {
      await api.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      // error toast
    }
  };

  const handleUnblockChannel = async (channelId: string) => {
    try {
      await api.unblockChannel(channelId);
      setBlockedChannels(prev => prev.filter(c => c.id !== channelId));
    } catch {
      // error toast
    }
  };

  const filteredUsers = blockedUsers.filter(u =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAttempts = blockedUsers.reduce((sum, u) => sum + u.messageAttempts, 0);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
              🚫 Блокированные пользователи
            </h1>
            <p className="text-sm text-secondary">
              Пользователи, которых вы заблокировали. Они не видят ваш профиль и не могут вам написать.
            </p>
          </div>
          <button
            className="btn btn--primary"
            onClick={() => setShowBlockModal(true)}
          >
            ➕ Заблокировать
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}>
          <div className="card flex-1" style={{ minWidth: 140 }}>
            <div className="text-xs text-muted">Всего заблокировано</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--danger)' }}>
              {blockedUsers.length + blockedChannels.length}
            </div>
          </div>
          <div className="card flex-1" style={{ minWidth: 140 }}>
            <div className="text-xs text-muted">Попыток написать</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>
              {totalAttempts}
            </div>
            <div className="text-xs text-muted">за последние 7 дней</div>
          </div>
        </div>

        {/* Search */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Поиск по блокированным..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Blocked users */}
        <div className="card" style={{ marginBottom: 16 }}>
          {filteredUsers.map(user => (
            <div
              key={user.id}
              style={{
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div className="avatar avatar--md avatar--bordered avatar--status-offline avatar--ctx-blocked">
                <div className="avatar__inner">
                  <span>{user.displayName.charAt(0)}{user.displayName.charAt(1)}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{user.displayName}</div>
                <div className="text-xs text-muted">
                  📞 {user.phone} · Заблокирован: {user.blockedDate}
                </div>
                <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                  Попыток написать: {user.messageAttempts}
                </div>
              </div>
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => handleUnblockUser(user.id)}
              >
                Разблокировать
              </button>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-sm text-secondary" style={{ padding: 24, textAlign: 'center' }}>
              {searchQuery ? 'Ничего не найдено' : 'Нет заблокированных пользователей'}
            </div>
          )}
        </div>

        {/* Blocked channels */}
        {blockedChannels.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="card__title" style={{ marginBottom: 16 }}>🚫 Заблокированные каналы</h3>
            {blockedChannels.map(ch => (
              <div
                key={ch.id}
                style={{
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div className="avatar avatar--md avatar--bordered avatar--status-offline avatar--ctx-blocked" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="avatar__inner"><span>📢</span></div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{ch.name}</div>
                  <div className="text-xs text-muted">Заблокирован: {ch.blockedDate}</div>
                </div>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => handleUnblockChannel(ch.id)}
                >
                  Разблокировать
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="card">
          <h3 className="card__title" style={{ marginBottom: 16 }}>ℹ️ О блокировке</h3>
          <ul className="text-sm text-secondary" style={{ paddingLeft: 20 }}>
            <li>Заблокированный пользователь не видит ваш профиль</li>
            <li>Не видит ваш статус «в сети»</li>
            <li>Ваши сообщения от него не доставляются</li>
            <li>Он не может вам позвонить</li>
            <li>Он не может добавить вас в группы</li>
            <li>Вы не получаете от него уведомления</li>
          </ul>
        </div>
      </div>

      {/* Block User Modal */}
      {showBlockModal && (
        <BlockUserModal
          onClose={() => setShowBlockModal(false)}
          onBlock={(user) => {
            // add user to blocked list
            setShowBlockModal(false);
          }}
        />
      )}
    </div>
  );
}

// --- Block User Modal ---
function BlockUserModal({
  onClose,
  onBlock,
}: {
  onClose: () => void;
  onBlock: (userId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const suggestedContacts = [
    { id: '1', name: 'Андрей Новиков', username: '@novikov', online: true },
    { id: '2', name: 'Елена Козлова', username: '@kozlova', online: false },
  ];

  const filtered = suggestedContacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Overlay */}
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: 24,
        width: '90%',
        maxWidth: 420,
        zIndex: 1001,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <span className="modal__title">🚫 Заблокировать пользователя</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 20,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Поиск по имени, номеру или @username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
          Введите имя пользователя для блокировки
        </p>

        {/* Search results */}
        <div style={{
          maxHeight: 200,
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          marginBottom: 12,
        }}>
          {filtered.map(contact => (
            <div
              key={contact.id}
              style={{
                padding: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
              onClick={() => onBlock(contact.id)}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className={`avatar avatar--sm avatar--bordered ${contact.online ? 'avatar--status-online' : 'avatar--status-offline'} avatar--ctx-contact`}>
                <div className="avatar__inner"><span>{contact.name.charAt(0)}{contact.name.charAt(1)}</span></div>
              </div>
              <div>
                <div className="text-sm font-bold">{contact.name}</div>
                <div className="text-xs text-muted">
                  {contact.username} · {contact.online ? 'в сети' : 'была 1 час назад'}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-secondary" style={{ padding: 16, textAlign: 'center' }}>
              Ничего не найдено
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-checkbox">
            <input type="checkbox" defaultChecked />
            Заблокировать и предотвратить повторное вступление в группы
          </label>
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end',
          marginTop: 16,
        }}>
          <button className="btn btn--tertiary" onClick={onClose}>
            Отмена
          </button>
          <button
            className="btn btn--danger"
            onClick={() => {
              onBlock('selected');
              onClose();
            }}
          >
            🚫 Заблокировать
          </button>
        </div>
      </div>
    </>
  );
}

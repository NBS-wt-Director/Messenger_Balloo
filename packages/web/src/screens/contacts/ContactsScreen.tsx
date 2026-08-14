// Contacts Screen — список контактов, поиск, блокировка
// Макет: mockups/balloo-su/contacts.html

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  status: string;
  lastSeen?: string;
  mutualChats?: number;
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups' | 'blocked'>('contacts');
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getContacts();
      setContacts(data || []);
    } catch (err) {
      setError('Не удалось загрузить контакты');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBlocked = useCallback(async () => {
    try {
      const data = await api.getBlockedUsers();
      setBlockedUsers(data || []);
    } catch {
      setBlockedUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchBlocked();
  }, [fetchContacts, fetchBlocked]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      fetchContacts();
      return;
    }
    try {
      const results = await api.searchUsers(query);
      setContacts(results || []);
    } catch {
      // fallback
    }
  };

  const handleAddContact = async (userId: string) => {
    try {
      await api.addContact(userId);
      await fetchContacts();
    } catch {
      setError('Не удалось добавить контакт');
    }
  };

  const handleRemoveContact = async (userId: string) => {
    try {
      await api.removeContact(userId);
      setContacts(prev => prev.filter(c => c.id !== userId));
    } catch {
      setError('Не удалось удалить контакт');
    }
  };

  const handleBlock = async (userId: string) => {
    try {
      await api.blockUser(userId);
      await fetchBlocked();
    } catch {
      setError('Не удалось заблокировать');
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await api.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      setError('Не удалось разблокировать');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredContacts = contacts.filter(c =>
    c.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ marginBottom: '1rem' }}>Контакты</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4" style={{ gap: '8px', marginBottom: '1rem', display: 'flex' }}>
        <button
          className={`btn btn--sm ${activeTab === 'contacts' ? 'btn--primary' : 'btn--tertiary'}`}
          onClick={() => setActiveTab('contacts')}
        >
          Контакты
        </button>
        <button
          className={`btn btn--sm ${activeTab === 'groups' ? 'btn--primary' : 'btn--tertiary'}`}
          onClick={() => setActiveTab('groups')}
        >
          👥 Группы
        </button>
        <button
          className={`btn btn--sm ${activeTab === 'blocked' ? 'btn--primary' : 'btn--tertiary'}`}
          onClick={() => setActiveTab('blocked')}
        >
          🚫 Чёрный список
        </button>
      </div>

      {error && (
        <div className="card mb-4" style={{ borderColor: 'var(--danger)', padding: '12px' }}>
          <p style={{ color: 'var(--danger)', fontSize: '14px' }}>{error}</p>
        </div>
      )}

      {/* Search */}
      {activeTab === 'contacts' && (
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Поиск контактов..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
      )}

      {/* Contacts tab */}
      {activeTab === 'contacts' && (
        <>
          {loading ? (
            <div className="text-center text-secondary py-8">Загрузка...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="card text-center py-8" style={{ padding: '2rem' }}>
              <p className="text-secondary" style={{ marginBottom: '1rem' }}>
                {searchQuery ? 'Ничего не найдено' : 'Нет контактов'}
              </p>
              <p className="text-muted text-sm">
                Пригласите друзей в Balloo, чтобы добавить их в контакты
              </p>
            </div>
          ) : (
            <div>
              <p className="page-subtitle" style={{ marginBottom: '0.75rem' }}>
                {filteredContacts.length} контактов
              </p>
              <div className="list">
                {filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    className="card mb-3"
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      className={`avatar avatar--md avatar--bordered avatar--status-${
                        contact.status === 'online' ? 'online' : 'offline'
                      } avatar--ctx-contact`}
                    >
                      <div className="avatar__inner">
                        <span>{contact.avatarUrl ? '' : getInitials(contact.displayName || contact.username)}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {contact.displayName || contact.username}
                      </div>
                      <div className="text-sm text-secondary">
                        {contact.status === 'online'
                          ? 'в сети'
                          : contact.lastSeen
                          ? `был ${contact.lastSeen}`
                          : 'не в сети'}
                      </div>
                    </div>
                    <div className="flex gap-2" style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => (window.location.hash = `#/chat?userId=${contact.id}`)}
                        title="Написать"
                      >
                        💬
                      </button>
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => handleBlock(contact.id)}
                        title="Заблокировать"
                      >
                        🚫
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn btn--primary btn--block"
            style={{ marginTop: '1rem' }}
            onClick={() => (window.location.hash = '#/invites')}
          >
            📨 Пригласить друга
          </button>
        </>
      )}

      {/* Groups tab — placeholder, full in ticket #29 */}
      {activeTab === 'groups' && (
        <div className="card text-center py-8" style={{ padding: '2rem' }}>
          <p className="text-secondary">Управление группами — в разработке (тикет #29)</p>
        </div>
      )}

      {/* Blocked tab */}
      {activeTab === 'blocked' && (
        <>
          {blockedUsers.length === 0 ? (
            <div className="card text-center py-8" style={{ padding: '2rem' }}>
              <p className="text-secondary">Нет заблокированных пользователей</p>
            </div>
          ) : (
            <div className="list">
              {blockedUsers.map((user: any) => (
                <div
                  key={user.id}
                  className="card mb-3"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div className="avatar avatar--sm avatar--bordered avatar--status-offline avatar--ctx-blocked">
                    <div className="avatar__inner">
                      <span>{getInitials(user.displayName || user.username || '??')}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                      {user.displayName || user.username || 'Заблокированный пользователь'}
                    </div>
                    {user.reason && (
                      <div className="text-xs text-muted">Причина: {user.reason}</div>
                    )}
                  </div>
                  <button
                    className="btn btn--tertiary btn--sm"
                    onClick={() => handleUnblock(user.id)}
                  >
                    Разблокировать
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
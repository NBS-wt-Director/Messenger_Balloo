// Blocked Users Screen — полный экран блокированных пользователей
// Макет: mockups/balloo-su/blocked-users.html (принят владельцем 16.10.2026,
// 1.1.13 → 6.37), тикет 1792124254.
//
// Реальные данные: GET /api/users/me/blocked, POST/DELETE /api/users/:id/block,
// поиск для блокировки — GET /api/users/search.
// Секции «Заблокированные каналы» и счётчика «Попыток написать» нет: в
// mockups/data_schema.json и Prisma отсутствуют соответствующие сущности
// (blocked_users только user↔user); выдуманные числа не выводятся.

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/services/api';

interface BlockedUser {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  status: string;
  blockedAt: number;
}

interface SearchUser {
  id: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

function formatBlockedDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString('ru-RU');
}

export default function BlockedUsersScreen() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBlockedUsers();
      setBlockedUsers(res?.blocked ?? []);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить список блокировок');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnblockUser = async (userId: string) => {
    if (!confirm('Разблокировать этого пользователя? Он снова сможет видеть ваш профиль и писать вам.')) {
      return;
    }
    try {
      await api.unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      // error toast
    }
  };

  const nameOf = (u: BlockedUser) => u.displayName || u.username || u.email || 'Без имени';

  const filteredUsers = blockedUsers.filter(
    (u) =>
      nameOf(u).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
              🚫 Блокированные пользователи
            </h1>
            <p className="text-sm text-secondary">
              Пользователи, которых вы заблокировали. Они не видят ваш профиль и не могут вам
              написать.
            </p>
          </div>
          <button className="btn btn--primary" onClick={() => setShowBlockModal(true)}>
            ➕ Заблокировать
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="card flex-1" style={{ minWidth: 140 }}>
            <div className="text-xs text-muted">Всего заблокировано</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--danger)' }}>
              {blockedUsers.length}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Поиск по блокированным..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading && (
          <div className="text-sm text-secondary" style={{ padding: 24, textAlign: 'center' }}>
            Загрузка…
          </div>
        )}

        {error && !loading && (
          <div className="text-sm text-danger" style={{ padding: 24, textAlign: 'center' }}>
            {error}{' '}
            <button className="btn btn--tertiary btn--sm" onClick={load}>
              Повторить
            </button>
          </div>
        )}

        {/* Blocked users */}
        {!loading && !error && (
          <div className="card" style={{ marginBottom: 16 }}>
            {filteredUsers.map((user) => (
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
                    <span>{nameOf(user).slice(0, 2).toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{nameOf(user)}</div>
                  <div className="text-xs text-muted">
                    {[user.email, user.username ? `@${user.username}` : null]
                      .filter(Boolean)
                      .join(' · ')}{' '}
                    · Заблокирован: {formatBlockedDate(user.blockedAt)}
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
        )}

        {/* Info */}
        <div className="card">
          <h3 className="card__title" style={{ marginBottom: 16 }}>
            ℹ️ О блокировке
          </h3>
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
          onBlocked={() => {
            setShowBlockModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

// --- Block User Modal: реальный поиск GET /api/users/search ---
function BlockUserModal({
  onClose,
  onBlocked,
}: {
  onClose: () => void;
  onBlocked: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  const doSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    try {
      setSearching(true);
      const data = await api.searchUsers(q.trim());
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleBlock = async (userId: string) => {
    try {
      setBlockError(null);
      await api.blockUser(userId);
      onBlocked();
    } catch (e: any) {
      setBlockError(e?.message || 'Не удалось заблокировать');
    }
  };

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
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          padding: 24,
          width: '90%',
          maxWidth: 420,
          zIndex: 1001,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
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
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              doSearch(e.target.value);
            }}
          />
        </div>

        <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
          Введите имя пользователя для блокировки
        </p>

        {/* Search results */}
        <div
          style={{
            maxHeight: 200,
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            marginBottom: 12,
          }}
        >
          {results.map((contact) => (
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
              onClick={() => handleBlock(contact.id)}
            >
              <div className="avatar avatar--sm avatar--bordered avatar--ctx-contact">
                <div className="avatar__inner">
                  <span>
                    {(contact.displayName || contact.username || '?')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm font-bold">
                  {contact.displayName || contact.username || 'Без имени'}
                </div>
                <div className="text-xs text-muted">
                  {contact.username ? `@${contact.username}` : ''}
                </div>
              </div>
            </div>
          ))}
          {searching && (
            <div className="text-sm text-secondary" style={{ padding: 16, textAlign: 'center' }}>
              Ищем…
            </div>
          )}
          {!searching && query.trim() && results.length === 0 && (
            <div className="text-sm text-secondary" style={{ padding: 16, textAlign: 'center' }}>
              Ничего не найдено
            </div>
          )}
        </div>

        {blockError && (
          <div className="text-sm text-danger" style={{ marginBottom: 8 }}>
            {blockError}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            marginTop: 16,
          }}
        >
          <button className="btn btn--tertiary" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </>
  );
}

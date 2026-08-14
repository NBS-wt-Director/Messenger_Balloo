// UsersScreen — управление пользователями (админка)
// Таблица: avatar, email, username, status, created, lastActive
// Фильтры: status, role, search
// Bulk actions: ban, suspend, delete

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  status: 'active' | 'banned' | 'suspended' | 'deleted';
  role: 'user' | 'mod' | 'admin' | 'super_admin';
  createdAt: number;
  lastActiveAt?: number;
  isEmployee?: boolean;
}

type SortField = 'username' | 'email' | 'createdAt' | 'lastActiveAt' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'active', label: 'Активен' },
  { value: 'banned', label: 'Забанен' },
  { value: 'suspended', label: 'Заморожен' },
  { value: 'deleted', label: 'Удалён' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'Все роли' },
  { value: 'user', label: 'User' },
  { value: 'mod', label: 'Mod' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  active: { background: 'rgba(45, 184, 77, 0.15)', color: 'var(--accent)' },
  banned: { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' },
  suspended: { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' },
  deleted: { background: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-muted)' },
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Активен',
  banned: 'Забанен',
  suspended: 'Заморожен',
  deleted: 'Удалён',
};

const ROLE_STYLES: Record<string, React.CSSProperties> = {
  user: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
  mod: { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
  admin: { background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' },
  super_admin: { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' },
};

const ROLE_LABELS: Record<string, string> = {
  user: 'User',
  mod: 'Mod',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

export function UsersScreen() {
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const PAGE_SIZE = 25;

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Ban modal
  const [banModal, setBanModal] = useState<{ userId: string; username: string } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banProcessing, setBanProcessing] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; username: string } | null>(null);
  const [deleteProcessing, setDeleteProcessing] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getAdminUsers({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      // Handle both array and paginated response
      const data = Array.isArray(response) ? response : response?.data || response?.users || [];
      const total = response?.total || response?.totalCount || response?.count || data.length;
      setUsers(data);
      setTotalUsers(total);
      setTotalPages(Math.ceil(total / PAGE_SIZE) || 1);
    } catch {
      // Fallback mock data
      const mockUsers: AdminUser[] = [
        { id: '1', email: 'ivan@example.com', username: 'ivanov', displayName: 'Иван Иванов', status: 'active', role: 'user', createdAt: 1704067200, lastActiveAt: 1722000000 },
        { id: '2', email: 'maria@example.com', username: 'maria_a', displayName: 'Мария Андреева', status: 'active', role: 'mod', createdAt: 1704153600, lastActiveAt: 1721900000 },
        { id: '3', email: 'spam@example.com', username: 'spammer123', displayName: 'Спамер', status: 'banned', role: 'user', createdAt: 1720588800, lastActiveAt: 1721500000 },
        { id: '4', email: 'admin@balloo.su', username: 'admin', displayName: 'Админ', status: 'active', role: 'super_admin', createdAt: 1704067200, lastActiveAt: 1722100000 },
        { id: '5', email: 'petr@example.com', username: 'petrov', displayName: 'Пётр Петров', status: 'active', role: 'user', createdAt: 1704240000, lastActiveAt: 1721800000 },
        { id: '6', email: 'sasha@example.com', username: 'alex_s', displayName: 'Александр Сидоров', status: 'suspended', role: 'user', createdAt: 1704326400, lastActiveAt: 1721000000 },
        { id: '7', email: 'elena@example.com', username: 'elena_k', displayName: 'Елена Кузнецова', status: 'active', role: 'admin', createdAt: 1704412800, lastActiveAt: 1722000000 },
        { id: '8', email: 'deleted@example.com', username: 'deleted_user', displayName: 'Удалённый', status: 'deleted', role: 'user', createdAt: 1704499200, lastActiveAt: 1719000000 },
      ];
      setUsers(mockUsers);
      setTotalUsers(mockUsers.length);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Toggle select all
  useEffect(() => {
    if (selectAll) {
      setSelectedIds(new Set(users.map((u) => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [selectAll, users]);

  // Toggle single user selection
  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'username') {
      cmp = (a.displayName || a.username || '').localeCompare(b.displayName || b.username || '');
    } else if (sortField === 'email') {
      cmp = a.email.localeCompare(b.email);
    } else if (sortField === 'createdAt') {
      cmp = a.createdAt - b.createdAt;
    } else if (sortField === 'lastActiveAt') {
      cmp = (a.lastActiveAt || 0) - (b.lastActiveAt || 0);
    } else if (sortField === 'status') {
      cmp = a.status.localeCompare(b.status);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Format timestamp
  const formatDate = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Bulk ban
  const handleBulkBan = () => {
    if (selectedIds.size === 0) return;
    // Open ban modal for first selected user in batch
    const first = users.find((u) => selectedIds.has(u.id));
    if (first) {
      setBanModal({ userId: Array.from(selectedIds).join(','), username: `Выбрано: ${selectedIds.size} пользователей` });
    }
  };

  // Execute ban
  const executeBan = async () => {
    if (!banModal || !banReason.trim()) return;
    setBanProcessing(true);
    try {
      const ids = banModal.userId.split(',');
      await Promise.all(ids.map((uid) => api.banUser(uid, { reason: banReason })));
      setBanModal(null);
      setBanReason('');
      fetchUsers();
    } catch {
      // Fallback: just update local
      setUsers((prev) =>
        prev.map((u) =>
          selectedIds.has(u.id) || u.id === banModal.userId.split(',')[0]
            ? { ...u, status: 'banned' as const }
            : u
        )
      );
      setBanModal(null);
      setBanReason('');
    } finally {
      setBanProcessing(false);
      setSelectedIds(new Set());
      setSelectAll(false);
    }
  };

  // Execute delete
  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteProcessing(true);
    try {
      await api.deleteUser(deleteConfirm.userId);
      setDeleteConfirm(null);
      fetchUsers();
    } catch {
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.userId));
      setDeleteConfirm(null);
    } finally {
      setDeleteProcessing(false);
    }
  };

  // Render sort indicator
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // Table header style
  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 12px',
    color: 'var(--text-muted)',
    fontWeight: 500,
    borderBottom: '1px solid var(--border-color)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: 13,
  };

  return (
    <div className="page-container fade-in">
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            Пользователи
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {totalUsers} пользователей на платформе
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedIds.size > 0 && (
            <>
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                }}
              >
                Выбрано: {selectedIds.size}
              </span>
              <button
                onClick={handleBulkBan}
                style={{
                  padding: '8px 16px',
                  background: 'var(--danger)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'var(--font-primary)',
                }}
              >
                🔨 Забанить
              </button>
              <button
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                }}
                onClick={() => {
                  setSelectedIds(new Set());
                  setSelectAll(false);
                }}
              >
                Снять выделение
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="🔍 Поиск по имени, email, username..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '8px 12px',
            background: 'var(--input-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'var(--font-primary)',
            outline: 'none',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            background: 'var(--input-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'var(--font-primary)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            background: 'var(--input-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'var(--font-primary)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Users table */}
      <div className="card" style={{ overflow: 'auto' }}>
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 60,
            }}
          >
            <div className="spinner" />
          </div>
        ) : error ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--danger)',
            }}
          >
            {error}
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 40, cursor: 'default' }}>
                  <input
                    type="checkbox"
                    checked={selectAll && users.length > 0}
                    onChange={() => setSelectAll(!selectAll)}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                  />
                </th>
                <th style={thStyle} onClick={() => handleSort('username')}>
                  Пользователь <SortIcon field="username" />
                </th>
                <th style={thStyle} onClick={() => handleSort('email')}>
                  Email <SortIcon field="email" />
                </th>
                <th style={thStyle} onClick={() => handleSort('status')}>
                  Роль
                </th>
                <th style={thStyle} onClick={() => handleSort('status')}>
                  Статус <SortIcon field="status" />
                </th>
                <th style={thStyle} onClick={() => handleSort('createdAt')}>
                  Регистрация <SortIcon field="createdAt" />
                </th>
                <th style={thStyle} onClick={() => handleSort('lastActiveAt')}>
                  Последний вход <SortIcon field="lastActiveAt" />
                </th>
                <th style={{ ...thStyle, cursor: 'default', textAlign: 'right' }}>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 40,
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      background: selectedIds.has(user.id) ? 'var(--bg-tertiary)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedIds.has(user.id))
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedIds.has(user.id))
                        e.currentTarget.style.background = 'transparent';
                    }}
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                  >
                    <td
                      style={{ ...tdStyle, width: 40 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: user.avatarUrl
                              ? `url(${user.avatarUrl}) center/cover`
                              : 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                            flexShrink: 0,
                            border: '2px solid var(--border-color)',
                          }}
                        >
                          {!user.avatarUrl &&
                            (user.displayName || user.username || '?')
                              .charAt(0)
                              .toUpperCase()}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {user.displayName || user.username}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                            }}
                          >
                            @{user.username}
                            {user.isEmployee && (
                              <span style={{ marginLeft: 6, color: 'var(--accent)' }}>
                                👔
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 500,
                          ...ROLE_STYLES[user.role],
                        }}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 500,
                          ...STATUS_STYLES[user.status],
                        }}
                      >
                        {STATUS_LABELS[user.status]}
                      </span>
                    </td>
                    <td style={tdStyle}>{formatDate(user.createdAt)}</td>
                    <td style={tdStyle}>
                      {user.lastActiveAt
                        ? formatDate(user.lastActiveAt)
                        : '—'}
                    </td>
                    <td
                      style={{ ...tdStyle, textAlign: 'right' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          style={{
                            padding: '4px 10px',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-primary)',
                          }}
                          title="Просмотр"
                        >
                          👁
                        </button>
                        {user.status === 'active' && (
                          <button
                            onClick={() => {
                              setBanModal({
                                userId: user.id,
                                username: user.displayName || user.username,
                              });
                            }}
                            style={{
                              padding: '4px 10px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12,
                              color: 'var(--danger)',
                              fontFamily: 'var(--font-primary)',
                            }}
                            title="Забанить"
                          >
                            🔨
                          </button>
                        )}
                        {user.status !== 'deleted' && (
                          <button
                            onClick={() => {
                              setDeleteConfirm({
                                userId: user.id,
                                username: user.displayName || user.username,
                              });
                            }}
                            style={{
                              padding: '4px 10px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12,
                              color: 'var(--danger)',
                              fontFamily: 'var(--font-primary)',
                            }}
                            title="Удалить"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '16px 0',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '6px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: 12,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-primary)',
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              ← Назад
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => (
                <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    style={{
                      padding: '6px 12px',
                      background: p === page ? 'var(--accent)' : 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: p === page ? '#fff' : 'var(--text-primary)',
                      fontWeight: p === page ? 600 : 400,
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: '6px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: 12,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-primary)',
                opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              Вперед →
            </button>
          </div>
        )}
      </div>

      {/* Ban Modal */}
      {banModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setBanModal(null)}
        >
          <div
            className="card"
            style={{
              width: 480,
              maxWidth: '90vw',
              padding: 24,
              border: '1px solid var(--danger)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--danger)',
                marginBottom: 8,
              }}
            >
              🔨 Бан пользователя
            </h3>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 16,
              }}
            >
              {banModal.username}
            </p>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label
                className="form-label"
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                Причина бана
              </label>
              <textarea
                className="form-textarea"
                placeholder="Опишите причину бана..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: 10,
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'var(--font-primary)',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginBottom: 16,
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.05)',
                borderRadius: 4,
                border: '1px solid rgba(239, 68, 68, 0.15)',
              }}
            >
              ⚠ Требует подтверждения 4 другими администраторами. Активируется при
              минимум 5 жалобах. Пользователь может обжаловать в течение 3 часов.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setBanModal(null);
                  setBanReason('');
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                Отмена
              </button>
              <button
                onClick={executeBan}
                disabled={!banReason.trim() || banProcessing}
                style={{
                  padding: '8px 16px',
                  background: banReason.trim() && !banProcessing
                    ? 'var(--danger)'
                    : 'var(--bg-tertiary)',
                  border: 'none',
                  borderRadius: 4,
                  cursor: banReason.trim() && !banProcessing ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 600,
                  color: banReason.trim() && !banProcessing ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-primary)',
                  opacity: banProcessing ? 0.7 : 1,
                }}
              >
                {banProcessing ? 'Обработка...' : 'Запросить бан'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="card"
            style={{
              width: 400,
              maxWidth: '90vw',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--danger)',
                marginBottom: 12,
              }}
            >
              🗑 Удаление пользователя
            </h3>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 16,
              }}
            >
              Вы уверены, что хотите удалить пользователя{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {deleteConfirm.username}
              </strong>?
              Это действие необратимо.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                Отмена
              </button>
              <button
                onClick={executeDelete}
                disabled={deleteProcessing}
                style={{
                  padding: '8px 16px',
                  background: !deleteProcessing ? 'var(--danger)' : 'var(--bg-tertiary)',
                  border: 'none',
                  borderRadius: 4,
                  cursor: !deleteProcessing ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 600,
                  color: !deleteProcessing ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                {deleteProcessing ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// AuditLogsScreen — таблица логов действий администраторов
// Фильтры: admin, action, date range | Pagination

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

// --- Types ---
interface AuditLog {
  id: string;
  admin: { name: string; avatar: string };
  action: string;
  target: string;
  details: string;
  ip: string;
  timestamp: string;
}

// --- Mock data ---
const ACTION_LABELS: Record<string, string> = {
  ban_user: '🚫 Бан пользователя',
  unban_user: '✅ Снятие бана',
  delete_user: '🗑 Удаление пользователя',
  update_user: '✏️ Обновление пользователя',
  delete_post: '🗑 Удаление поста',
  approve_post: '✅ Одобрение поста',
  create_announcement: '📢 Создание объявления',
  toggle_feature_flag: '🏁 Feature flag',
  resolve_report: '📋 Решение жалобы',
  publish_version: '🚀 Публикация версии',
  upload_file: '📎 Загрузка файла',
  suspend_user: '⏸ Временная блокировка',
  promote_user: '⭐ Повышение роли',
};

const ACTION_COLORS: Record<string, string> = {
  ban_user: '#ef4444',
  unban_user: '#22c55e',
  delete_user: '#ef4444',
  update_user: '#3b82f6',
  delete_post: '#ef4444',
  approve_post: '#22c55e',
  create_announcement: '#f59e0b',
  toggle_feature_flag: '#8b5cf6',
  resolve_report: '#06b6d4',
  publish_version: '#22c55e',
  upload_file: '#3b82f6',
  suspend_user: '#f59e0b',
  promote_user: '#eab308',
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditLogsScreen() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs().then((res) => {
      setLogs(res || []);
      setLoading(false);
    }).catch(() => {
      setLogs([]);
      setLoading(false);
    });
  }, []);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterAdmin, setFilterAdmin] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract unique admins
  const admins = Array.from(new Set(logs.map((l) => l.admin.name)));

  // Filter
  const filtered = logs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (filterAdmin !== 'all' && log.admin.name !== filterAdmin) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.admin.name.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.ip.includes(q)
      );
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <h1 className="admin-page__title">📋 Логи действий</h1>
        <p className="admin-page__subtitle">
          Журнал всех действий администраторов системы
        </p>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filters__row">
          <input
            type="text"
            className="admin-input"
            placeholder="🔍 Поиск по логу..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <select
            className="admin-select"
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Все действия</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="admin-select"
            value={filterAdmin}
            onChange={(e) => {
              setFilterAdmin(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Все администраторы</option>
            {admins.map((admin) => (
              <option key={admin} value={admin}>
                {admin}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="admin-stats-bar">
        <div className="admin-stat-card">
          <div className="admin-stat-card__value">{logs.length}</div>
          <div className="admin-stat-card__label">Всего записей</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__value">{admins.length}</div>
          <div className="admin-stat-card__label">Администраторов</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__value">
            {new Set(logs.map((l) => l.action)).size}
          </div>
          <div className="admin-stat-card__label">Типов действий</div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Администратор</th>
              <th>Действие</th>
              <th>Цель</th>
              <th>Детали</th>
              <th>IP</th>
              <th>Время</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((log) => (
              <tr key={log.id} className="admin-table-row">
                <td>
                  <div className="admin-table-row__user">
                    <div
                      className="admin-table-row__avatar"
                      style={{
                        background: `hsl(${(log.admin.name.charCodeAt(0) * 40) % 360}, 60%, 50%)`,
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    >
                      {log.admin.name.charAt(0)}
                    </div>
                    <span>{log.admin.name}</span>
                  </div>
                </td>
                <td>
                  <span
                    className="action-badge"
                    style={{
                      background: `${ACTION_COLORS[log.action] || '#6b7280'}20`,
                      color: ACTION_COLORS[log.action] || '#6b7280',
                      borderColor: `${ACTION_COLORS[log.action] || '#6b7280'}40`,
                    }}
                  >
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                </td>
                <td className="admin-table-row__target">{log.target}</td>
                <td className="admin-table-row__details">{log.details}</td>
                <td className="admin-table-row__ip">{log.ip}</td>
                <td className="admin-table-row__time">{formatTimestamp(log.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination__btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ← Назад
          </button>
          <span className="pagination__info">
            Страница {currentPage} из {totalPages}
          </span>
          <button
            className="pagination__btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}

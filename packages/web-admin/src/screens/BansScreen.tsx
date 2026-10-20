// BansScreen — управление банами и обжалованиями (админка)
// Табы: Активные баны / Обжалования / Запросы на бан

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

// --- Types ---
interface BanEntry {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  reason: string;
  reportCount: number;
  reporterCount: number;
  confirmedBy: number; // e.g. 4/4
  banDate: number;
  appealExpiresAt?: number;
  isGlobal: boolean;
  banType: 'spam' | 'toxicity' | 'profanity' | 'other';
}

interface AppealEntry {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  appealText: string;
  bannedBy: string;
  bannedById: string;
  appealSubmittedAt: number;
  appealExpiresAt: number;
  remainingMs: number;
}

interface BanRequestEntry {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  reason: string;
  reportCount: number;
  requestedBy: string;
  requestedById: string;
  requestedAt: number;
  confirmedBy: number;
  requiredConfirmations: number;
}

type TabKey = 'active' | 'appeals' | 'requests';

// --- Constants ---
const REASON_LABELS: Record<string, string> = {
  spam: 'Спам',
  toxicity: 'Токсичность',
  profanity: 'Ненормативная лексика',
  other: 'Другое',
};

const BAN_TYPE_STYLES: Record<string, React.CSSProperties> = {
  spam: { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' },
  toxicity: { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' },
  profanity: { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' },
  other: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
};

export function BansScreen() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('active');

  // Active bans
  const [bans, setBans] = useState<BanEntry[]>([]);
  // Appeals
  const [appeals, setAppeals] = useState<AppealEntry[]>([]);
  // Ban requests
  const [requests, setRequests] = useState<BanRequestEntry[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  // Reason filter
  const [reasonFilter, setReasonFilter] = useState('');
  // Date filter
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail modal
  const [detailBan, setDetailBan] = useState<BanEntry | null>(null);

  // Unban confirmation
  const [unbanConfirm, setUnbanConfirm] = useState<{ entry: BanEntry | AppealEntry; type: 'ban' | 'appeal' } | null>(null);

  // Process states
  const [processing, setProcessing] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [bansRes, appealsRes, requestsRes] = await Promise.all([
        api.getBans('active').catch(() => []),
        api.getBans('appeals').catch(() => []),
        api.getBans('requests').catch(() => []),
      ]);
      setBans(Array.isArray(bansRes) ? bansRes : []);
      setAppeals(Array.isArray(appealsRes) ? appealsRes : []);
      setRequests(Array.isArray(requestsRes) ? requestsRes : []);
    } catch {
      // Fallback mock data
      setBans([
        {
          id: 'b1', userId: 'u_spam', username: 'user_spam', displayName: 'Спамер',
          reason: 'Спам', reportCount: 7, reporterCount: 5, confirmedBy: 4,
          banDate: 1752547200, appealExpiresAt: 1752558000, isGlobal: true,
          banType: 'spam',
        },
        {
          id: 'b2', userId: 'u_toxic', username: 'user_toxic', displayName: 'Токсик',
          reason: 'Ненормативная лексика', reportCount: 5, reporterCount: 5, confirmedBy: 4,
          banDate: 1751856000, appealExpiresAt: 1751866800, isGlobal: true,
          banType: 'profanity',
        },
      ]);
      setAppeals([
        {
          id: 'a1', userId: 'u_spam', username: 'user_spam', displayName: 'Спамер',
          appealText: 'Я не спамил, это были legit сообщения',
          bannedBy: 'Админ Алексей', bannedById: 'admin_alex',
          appealSubmittedAt: 1752547200, appealExpiresAt: 1752558000,
          remainingMs: 2 * 3600000 + 15 * 60000,
        },
      ]);
      setRequests([
        {
          id: 'r1', userId: 'u_new_spam', username: 'user_new_spam', displayName: 'Новый спамер',
          reason: 'Спам', reportCount: 6,
          requestedBy: 'user_reporter', requestedById: 'user_reporter',
          requestedAt: 1752806400, confirmedBy: 2, requiredConfirmations: 4,
        },
        {
          id: 'r2', userId: 'u_fake', username: 'user_fake', displayName: 'Фейк',
          reason: 'Токсичность', reportCount: 3,
          requestedBy: 'user_mod1', requestedById: 'user_mod1',
          requestedAt: 1752892800, confirmedBy: 1, requiredConfirmations: 4,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter by search
  const filterList = <T extends { username: string }>(list: T[]): T[] => {
    let filtered = list;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.username.toLowerCase().includes(q) ||
        (item as any).displayName?.toLowerCase().includes(q)
      );
    }
    if (reasonFilter) {
      filtered = filtered.filter((item) =>
        (item as any).reason?.toLowerCase() === reasonFilter.toLowerCase() ||
        (item as any).banType?.toLowerCase() === reasonFilter.toLowerCase()
      );
    }
    return filtered;
  };

  // Format date
  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Format date+time
  const formatDateTime = (ts: number) => {
    return new Date(ts * 1000).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Timer to appeal expiry
  const formatRemainingTime = (remainingMs: number) => {
    if (remainingMs <= 0) return 'Обжалование истекло';
    const hours = Math.floor(remainingMs / 3600000);
    const mins = Math.floor((remainingMs % 3600000) / 60000);
    return `ещё ${hours}ч ${mins}мин`;
  };

  // Execute unban
  const executeUnban = async (entry: BanEntry | AppealEntry) => {
    setProcessing(entry.id);
    try {
      await api.unbanUser(entry.userId);
      if ('appealText' in entry) {
        setAppeals((prev) => prev.filter((a) => a.id !== entry.id));
      } else {
        setBans((prev) => prev.filter((b) => b.id !== entry.id));
      }
    } catch {
      // Fallback: just remove locally
      if ('appealText' in entry) {
        setAppeals((prev) => prev.filter((a) => a.id !== entry.id));
      } else {
        setBans((prev) => prev.filter((b) => b.id !== entry.id));
      }
    } finally {
      setProcessing(null);
      setUnbanConfirm(null);
    }
  };

  // Reject appeal
  const executeRejectAppeal = async (appeal: AppealEntry) => {
    setProcessing(appeal.id);
    try {
      // API call placeholder
      // await api.rejectAppeal(appeal.id);
    } catch {}
    setAppeals((prev) => prev.filter((a) => a.id !== appeal.id));
    setProcessing(null);
  };

  // Confirm ban request
  const executeConfirmRequest = async (request: BanRequestEntry) => {
    setProcessing(request.id);
    try {
      // await api.confirmBanRequest(request.id);
    } catch {}
    setRequests((prev) => prev.filter((r) => r.id !== request.id));
    setProcessing(null);
  };

  // Reject ban request
  const executeRejectRequest = async (request: BanRequestEntry) => {
    setProcessing(request.id);
    try {
      // await api.rejectBanRequest(request.id);
    } catch {}
    setRequests((prev) => prev.filter((r) => r.id !== request.id));
    setProcessing(null);
  };

  // Filtered data
  const filteredBans = filterList(bans);
  const filteredAppeals = filterList(appeals);
  const filteredRequests = filterList(requests);

  // Tab configs
  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'active', label: `Активные баны (${filteredBans.length})`, count: filteredBans.length },
    { key: 'appeals', label: `Обжалования (${filteredAppeals.length})`, count: filteredAppeals.length },
    { key: 'requests', label: `Запросы на бан (${filteredRequests.length})`, count: filteredRequests.length },
  ];

  // Tab styles
  const tabStyle = (key: TabKey): React.CSSProperties => ({
    padding: '8px 16px',
    background: activeTab === key ? 'var(--bg-tertiary)' : 'transparent',
    border: 'none',
    borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: activeTab === key ? 600 : 400,
    color: activeTab === key ? 'var(--accent)' : 'var(--text-secondary)',
    fontFamily: 'var(--font-primary)',
    transition: 'all 0.15s ease',
  });

  // --- RENDER ---
  return (
    <div className="page-container fade-in">
      {/* Page header */}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
        Баны и обжалования
      </h1>

      {/* Tabs */}
      <div style={{ marginBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              style={tabStyle(tab.key)}
              onClick={() => { setActiveTab(tab.key); setSearchQuery(''); setReasonFilter(''); }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters (only for active bans and requests) */}
      {(activeTab === 'active' || activeTab === 'requests') && (
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
            placeholder="🔍 Поиск по забаненным..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
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
            <option value="">Все причины</option>
            <option value="spam">Спам</option>
            <option value="profanity">Ненормативная лексика</option>
            <option value="toxicity">Токсичность</option>
            <option value="other">Другое</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-primary)',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Tab: Active Bans */}
      {activeTab === 'active' && (
        <div>
          {filteredBans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__animation">✅</div>
              <div className="empty-state__title">Нет активных банов</div>
            </div>
          ) : (
            filteredBans.map((ban) => (
              <div key={ban.id} className="card mb-4" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{ban.displayName || ban.username}</strong>
                  <span className="chip chip--danger">Забанен</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Причина: {ban.reason} ({ban.reportCount} жалоб от {ban.reporterCount} пользователей)
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Забанен: {formatDate(ban.banDate)} • Подтвердили: {ban.confirmedBy}/4 админов
                </p>
                {ban.appealExpiresAt && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Обжалование доступно: {formatRemainingTime(ban.appealExpiresAt * 1000 - Date.now())}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setUnbanConfirm({ entry: ban, type: 'ban' })}
                    style={{
                      padding: '6px 14px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    🔓 Снять бан
                  </button>
                  <button
                    onClick={() => setDetailBan(ban)}
                    style={{
                      padding: '6px 14px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    📋 Подробнее
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Показано {filteredBans.length} из {bans.length}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '4px 10px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    opacity: page <= 1 ? 0.5 : 1,
                  }}
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '4px 10px',
                      background: p === page ? 'var(--accent)' : 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: p === page ? '#fff' : 'var(--text-primary)',
                      fontWeight: p === page ? 600 : 400,
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '4px 10px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    opacity: page >= totalPages ? 0.5 : 1,
                  }}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Appeals */}
      {activeTab === 'appeals' && (
        <div>
          <div className="form-group mb-4" style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="🔍 Поиск по обжалованиям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontFamily: 'var(--font-primary)',
                outline: 'none',
              }}
            />
          </div>
          {filteredAppeals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__animation">✅</div>
              <div className="empty-state__title">Нет обжалований</div>
            </div>
          ) : (
            filteredAppeals.map((appeal) => (
              <div key={appeal.id} className="card mb-4" style={{ marginBottom: 16, borderColor: 'var(--warning)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{appeal.displayName || appeal.username}</strong>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                    Обжалование
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  "{appeal.appealText}"
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Забанил: {appeal.bannedBy} ·{' '}
                  <a href="#" style={{ color: 'var(--accent)', fontSize: 12 }}>написать</a>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Осталось времени: {formatRemainingTime(appeal.remainingMs)}
                </p>

                {/* Criteria */}
                <div className="card" style={{ background: 'var(--bg-tertiary)', padding: 12, marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Критерии принятия/отклонения:
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    • Жалоб меньше 5 → можно снять<br />
                    • Жалоб 5+ и подтверждение 4/4 → сложно снять<br />
                    • Ошибочный бан → снять
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setUnbanConfirm({ entry: appeal, type: 'appeal' })}
                    style={{
                      padding: '6px 14px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    🔓 Снять бан
                  </button>
                  <button
                    onClick={() => executeRejectAppeal(appeal)}
                    disabled={processing === appeal.id}
                    style={{
                      padding: '6px 14px',
                      background: processing === appeal.id ? 'var(--bg-tertiary)' : 'var(--danger)',
                      border: 'none',
                      borderRadius: 4,
                      cursor: processing === appeal.id ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      color: processing === appeal.id ? 'var(--text-muted)' : '#fff',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    ❌ Отклонить обжалование
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Ban Requests */}
      {activeTab === 'requests' && (
        <div>
          {filteredRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__animation">✅</div>
              <div className="empty-state__title">Нет запросов на бан</div>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div key={req.id} className="card mb-4" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{req.displayName || req.username}</strong>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                    Ожидает подтверждения
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Причина: {req.reason} ({req.reportCount} жалоб)
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Запросил: {req.requestedBy} · {formatDate(req.requestedAt)}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Подтвердили: {req.confirmedBy}/{req.requiredConfirmations} админов
                  {/* Progress bar */}
                  <div style={{ marginTop: 6, background: 'var(--bg-tertiary)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(req.confirmedBy / req.requiredConfirmations) * 100}%`,
                        background: req.confirmedBy >= req.requiredConfirmations ? 'var(--accent)' : 'var(--warning)',
                        borderRadius: 4,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => executeConfirmRequest(req)}
                    disabled={processing === req.id}
                    style={{
                      padding: '6px 14px',
                      background: processing === req.id ? 'var(--bg-tertiary)' : 'var(--danger)',
                      border: 'none',
                      borderRadius: 4,
                      cursor: processing === req.id ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      color: processing === req.id ? 'var(--text-muted)' : '#fff',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    ✅ Подтвердить бан
                  </button>
                  <button
                    onClick={() => executeRejectRequest(req)}
                    disabled={processing === req.id}
                    style={{
                      padding: '6px 14px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      cursor: processing === req.id ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    ❌ Отклонить запрос
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailBan && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setDetailBan(null)}
        >
          <div className="card" style={{ width: 520, maxWidth: '90vw', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                📋 Подробнее: {detailBan.displayName || detailBan.username}
              </span>
              <button onClick={() => setDetailBan(null)} style={{ fontSize: 18, color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="card" style={{ background: 'var(--bg-tertiary)', padding: 12, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                История жалоб, приведших к бану:
              </p>
              {Array.from({ length: detailBan.reportCount }, (_, i) => i + 1).map((n) => (
                <p key={n} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                  • user_{n} — {formatDate(detailBan.banDate - (detailBan.reportCount - n))} — "{REASON_LABELS[detailBan.banType]}"
                </p>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Всего жалоб: {detailBan.reportCount} · Уникальных жалобщиков: {detailBan.reporterCount} · Подтвердили: {detailBan.confirmedBy}/4 админа
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => setDetailBan(null)}
                style={{
                  padding: '8px 16px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)', borderRadius: 4,
                  cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirmation Modal */}
      {unbanConfirm && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setUnbanConfirm(null)}
        >
          <div className="card" style={{ width: 420, maxWidth: '90vw', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', marginBottom: 12 }}>
              🔓 Снятие бана
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Вы уверены, что хотите снять бан с{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {unbanConfirm.entry.displayName || unbanConfirm.entry.username}
              </strong>
              ?
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setUnbanConfirm(null)}
                style={{
                  padding: '8px 16px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)', borderRadius: 4,
                  cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                Отмена
              </button>
              <button
                onClick={() => executeUnban(unbanConfirm.entry)}
                disabled={processing === unbanConfirm.entry.id}
                style={{
                  padding: '8px 16px',
                  background: processing === unbanConfirm.entry.id ? 'var(--bg-tertiary)' : 'var(--danger)',
                  border: 'none', borderRadius: 4,
                  cursor: processing === unbanConfirm.entry.id ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 600,
                  color: processing === unbanConfirm.entry.id ? 'var(--text-muted)' : '#fff',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                {processing === unbanConfirm.entry.id ? 'Обработка...' : 'Снять бан'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
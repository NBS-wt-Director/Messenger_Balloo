// ReportsScreen — обработка жалоб пользователей (админка)
// Табы: Ожидают / В работе / Решённые

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

// --- Types ---
interface ReportEntry {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  reason: string;
  reasonChip: 'danger' | 'warning' | 'info';
  reportCount: number;
  uniqueReporters: number;
  messageId?: string;
  reportedAt: number;
  status: 'pending' | 'in_progress' | 'resolved';
  contentWarning?: string;
}

type TabKey = 'pending' | 'in_progress' | 'resolved';

// --- Constants ---
const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  resolved: 'Решено',
};

const REASON_CHIP_STYLES: Record<string, { bg: string; color: string }> = {
  spam: { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' },
  toxicity: { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' },
  profanity: { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' },
  harassment: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' },
  other: { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
};

const REASON_LABELS: Record<string, string> = {
  spam: 'Спам',
  toxicity: 'Токсичность',
  profanity: 'Ненормативная лексика',
  harassment: 'Дразнение',
  other: 'Другое',
};

export function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');

  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected report for detail modal
  const [selectedReport, setSelectedReport] = useState<ReportEntry | null>(null);

  // Action states
  const [banConfirm, setBanConfirm] = useState<{ report: ReportEntry } | null>(null);
  const [banProcessing, setBanProcessing] = useState(false);

  const [dismissConfirm, setDismissConfirm] = useState<{ report: ReportEntry } | null>(null);
  const [dismissProcessing, setDismissProcessing] = useState(false);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getReports('pending').catch(() => []);
      const list = Array.isArray(data) ? data : [];
      setReports(list);
    } catch {
      // Fallback mock data
      const mock: ReportEntry[] = [
        {
          id: 'r1', userId: 'u_spam', username: 'user_spam', displayName: 'Спамер',
          reason: 'spam', reasonChip: 'danger', reportCount: 7, uniqueReporters: 5,
          messageId: 'msg_abc123', reportedAt: 1752547200, status: 'pending',
          contentWarning: 'Содержимое жалобы доступно только как метаданные (без текста сообщения)',
        },
        {
          id: 'r2', userId: 'u_toxic', username: 'user_toxic', displayName: 'Токсик',
          reason: 'profanity', reasonChip: 'warning', reportCount: 5, uniqueReporters: 5,
          reportedAt: 1752460800, status: 'pending',
          contentWarning: 'Содержимое жалобы доступно только как метаданные (без текста сообщения)',
        },
        {
          id: 'r3', userId: 'u_fake', username: 'user_fake', displayName: 'Фейковый аккаунт',
          reason: 'other', reasonChip: 'info', reportCount: 3, uniqueReporters: 2,
          messageId: 'msg_def456', reportedAt: 1752374400, status: 'pending',
          contentWarning: 'Содержимое жалобы доступно только как метаданные (без текста сообщения)',
        },
      ];
      setReports(mock);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filter by tab
  const filteredReports = reports.filter((r) => r.status === activeTab);

  // Format date
  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get chip style for reason
  const getChipStyle = (reason: string): React.CSSProperties => {
    const styles = REASON_CHIP_STYLES[reason] || REASON_CHIP_STYLES.other;
    return {
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 500,
      background: styles.bg,
      color: styles.color,
    };
  };

  // Execute ban request
  const executeBanRequest = async (report: ReportEntry) => {
    setBanProcessing(true);
    try {
      // await api.requestBan(report.id);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch {
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } finally {
      setBanProcessing(false);
      setBanConfirm(null);
    }
  };

  // Execute dismiss
  const executeDismiss = async (report: ReportEntry) => {
    setDismissProcessing(true);
    try {
      // await api.dismissReport(report.id);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: 'resolved' as const } : r))
      );
    } catch {
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: 'resolved' as const } : r))
      );
    } finally {
      setDismissProcessing(false);
      setDismissConfirm(null);
    }
  };

  // Tab config
  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'pending', label: `Ожидают (${reports.filter((r) => r.status === 'pending').length})`, count: reports.filter((r) => r.status === 'pending').length },
    { key: 'in_progress', label: `В работе (${reports.filter((r) => r.status === 'in_progress').length})`, count: reports.filter((r) => r.status === 'in_progress').length },
    { key: 'resolved', label: `Решённые (${reports.filter((r) => r.status === 'resolved').length})`, count: reports.filter((r) => r.status === 'resolved').length },
  ];

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

  // Avatar initials
  const getInitials = (username: string, displayName?: string): string => {
    const name = displayName || username;
    if (name.length <= 2) return name.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // --- RENDER ---
  return (
    <div className="page-container fade-in">
      {/* Page header */}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
        Жалобы
      </h1>

      {/* Tabs */}
      <div style={{ marginBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              style={tabStyle(tab.key)}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports list */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : activeTab === 'pending' ? (
        <div>
          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__animation">✅</div>
              <div className="empty-state__title">Нет ожидающих жалоб</div>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div key={report.id} className="card mb-4" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Octagon avatar */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 9,
                        color: 'var(--text-secondary)',
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(report.username, report.displayName)}
                    </div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>
                      {report.displayName || report.username}
                    </strong>
                  </div>
                  <span style={getChipStyle(report.reason)}>
                    {REASON_LABELS[report.reason] || report.reason}
                  </span>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Жалоб: {report.reportCount} от {report.uniqueReporters} разных пользователей
                </p>

                {report.messageId && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    ID сообщения: {report.messageId} • {formatDate(report.reportedAt)}
                  </p>
                )}

                {/* Content warning */}
                {report.contentWarning && (
                  <div className="card" style={{ background: 'var(--bg-tertiary)', padding: 12, marginBottom: 12 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      ⚠ {report.contentWarning}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setBanConfirm({ report })}
                    disabled={banProcessing}
                    style={{
                      padding: '6px 14px',
                      background: banProcessing ? 'var(--bg-tertiary)' : 'var(--danger)',
                      border: 'none',
                      borderRadius: 4,
                      cursor: banProcessing ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      color: banProcessing ? 'var(--text-muted)' : '#fff',
                      fontWeight: 600,
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    Запросить бан
                  </button>
                  <button
                    onClick={() => setDismissConfirm({ report })}
                    disabled={dismissProcessing}
                    style={{
                      padding: '6px 14px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      cursor: dismissProcessing ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    Отклонить
                  </button>
                  <button
                    onClick={() => setSelectedReport(report)}
                    style={{
                      padding: '6px 14px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'in_progress' ? (
        <div className="empty-state">
          <div className="empty-state__animation">📋</div>
          <div className="empty-state__title">Нет жалоб в работе</div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__animation">✅</div>
          <div className="empty-state__title">Нет решённых жалоб</div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setSelectedReport(null)}
        >
          <div className="card" style={{ width: 480, maxWidth: '90vw', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Детали жалобы
              </span>
              <button onClick={() => setSelectedReport(null)} style={{ fontSize: 18, color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
            </div>

            {/* User info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 40, height: 40, clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                  background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)',
                }}
              >
                {getInitials(selectedReport.username, selectedReport.displayName)}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedReport.displayName || selectedReport.username}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{selectedReport.username}</div>
              </div>
            </div>

            {/* Details */}
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <p><strong>Причина:</strong> {REASON_LABELS[selectedReport.reason] || selectedReport.reason}</p>
              <p><strong>Жалоб:</strong> {selectedReport.reportCount} от {selectedReport.uniqueReporters} пользователей</p>
              {selectedReport.messageId && <p><strong>ID сообщения:</strong> {selectedReport.messageId}</p>}
              <p><strong>Дата:</strong> {formatDate(selectedReport.reportedAt)}</p>
              <p><strong>Статус:</strong> {STATUS_LABELS[selectedReport.status]}</p>
            </div>

            {/* Content warning */}
            {selectedReport.contentWarning && (
              <div className="card" style={{ background: 'var(--bg-tertiary)', padding: 12, marginTop: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  ⚠ {selectedReport.contentWarning}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => setSelectedReport(null)}
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

      {/* Ban Confirmation Modal */}
      {banConfirm && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setBanConfirm(null)}
        >
          <div className="card" style={{ width: 420, maxWidth: '90vw', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', marginBottom: 12 }}>
              🔨 Запрос на бан
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Отправить запрос на бан пользователя{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {banConfirm.report.displayName || banConfirm.report.username}
              </strong>
              ?
            </p>
            <div style={{
              fontSize: 12, color: 'var(--text-muted)', marginBottom: 16,
              padding: '8px 12px', background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: 4, border: '1px solid rgba(239, 68, 68, 0.15)',
            }}>
              ⚠ Бан активируется при минимум 5 жалобах и подтверждении 4 администраторами.
              Пользователь может обжаловать в течение 3 часов.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setBanConfirm(null)}
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
                onClick={() => executeBanRequest(banConfirm.report)}
                disabled={banProcessing}
                style={{
                  padding: '8px 16px',
                  background: banProcessing ? 'var(--bg-tertiary)' : 'var(--danger)',
                  border: 'none', borderRadius: 4,
                  cursor: banProcessing ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 600,
                  color: banProcessing ? 'var(--text-muted)' : '#fff',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                {banProcessing ? 'Отправка...' : 'Запросить бан'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Confirmation Modal */}
      {dismissConfirm && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setDismissConfirm(null)}
        >
          <div className="card" style={{ width: 420, maxWidth: '90vw', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)', marginBottom: 12 }}>
              ❌ Отклонение жалобы
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Отклонить жалобу на пользователя{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {dismissConfirm.report.displayName || dismissConfirm.report.username}
              </strong>
              ?
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDismissConfirm(null)}
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
                onClick={() => executeDismiss(dismissConfirm.report)}
                disabled={dismissProcessing}
                style={{
                  padding: '8px 16px',
                  background: dismissProcessing ? 'var(--bg-tertiary)' : 'var(--warning)',
                  border: 'none', borderRadius: 4,
                  cursor: dismissProcessing ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 600,
                  color: dismissProcessing ? 'var(--text-muted)' : '#fff',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                {dismissProcessing ? 'Обработка...' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
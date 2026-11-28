// TeamApplicationsScreen — заявки в команду Balloo (тик. 1795888510).
//
// Доступен администраторам и суперадминистраторам: суперадмин даёт доступ к
// разделу, выдавая роль admin (UserDetailScreen / PATCH /api/admin/users/:id/role).
// Действия прямо из строки заявки: принять (выдаёт доступ и отправляет
// сообщение), отклонить, написать сообщение заявителю.

import { useCallback, useEffect, useState } from 'react';
import { adminApi, AdminApiError, type TeamApplication } from '../api';

const STATUS_LABELS: Record<string, string> = {
  new: 'Новая',
  accepted: 'Принята',
  rejected: 'Отклонена',
};

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  new: { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning, #f59e0b)' },
  accepted: { background: 'rgba(45, 184, 77, 0.15)', color: 'var(--accent)' },
  rejected: { background: 'rgba(213, 43, 30, 0.15)', color: 'var(--danger)' },
};

function formatDate(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TeamApplicationsScreen() {
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'accepted' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Форма сообщения: какая заявка открыта и текст.
  const [messageFor, setMessageFor] = useState<TeamApplication | null>(null);
  const [messageText, setMessageText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.listTeamApplications(statusFilter);
      setApplications(res.applications);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (app: TeamApplication, action: 'accept' | 'reject') => {
    if (busyId) return;
    try {
      setBusyId(app.id);
      setError(null);
      const res =
        action === 'accept'
          ? await adminApi.acceptTeamApplication(app.id)
          : await adminApi.rejectTeamApplication(app.id);
      setApplications((prev) => prev.map((a) => (a.id === app.id ? res.application : a)));
      setNotice(
        action === 'accept'
          ? `Заявка принята: ${res.application.username || res.application.userId} получил доступ в админку.`
          : 'Заявка отклонена.'
      );
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Не удалось обработать заявку');
    } finally {
      setBusyId(null);
    }
  };

  const sendMessage = async () => {
    if (!messageFor || !messageText.trim()) return;
    try {
      setBusyId(messageFor.id);
      setError(null);
      await adminApi.messageTeamApplicant(messageFor.id, messageText.trim());
      setNotice('Сообщение отправлено заявителю в мессенджер.');
      setMessageFor(null);
      setMessageText('');
      load();
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Не удалось отправить сообщение');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ fontSize: 20, margin: 0, color: 'var(--text-primary)' }}>
          📨 Заявки в команду
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            style={{ minWidth: 160 }}
          >
            <option value="all">Все статусы</option>
            <option value="new">Новые</option>
            <option value="accepted">Принятые</option>
            <option value="rejected">Отклонённые</option>
          </select>
          <button className="btn btn--tertiary btn--sm" onClick={load} disabled={loading}>
            ↻ Обновить
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 14 }}>⚠ {error}</div>
      )}
      {notice && (
        <div style={{ color: 'var(--accent)', marginBottom: 12, fontSize: 14 }}>{notice}</div>
      )}

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <div className="spinner" />
        </div>
      ) : applications.length === 0 ? (
        <div
          className="card"
          style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}
        >
          Заявок нет
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {applications.map((app) => (
            <div
              key={app.id}
              className="card"
              style={{
                padding: 16,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {(app.displayName || app.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {app.displayName || app.username || 'Без имени'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      id Balloo: {app.username || app.userId}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      ...(STATUS_COLORS[app.status] ?? {}),
                      padding: '2px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {STATUS_LABELS[app.status] ?? app.status}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatDate(app.createdAt)}
                  </span>
                </div>
              </div>

              {app.message && (
                <div
                  style={{
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    marginBottom: 10,
                  }}
                >
                  {app.message}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {app.status !== 'accepted' && (
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => act(app, 'accept')}
                    disabled={busyId === app.id}
                  >
                    ✅ Принять
                  </button>
                )}
                {app.status !== 'rejected' && (
                  <button
                    className="btn btn--tertiary btn--sm"
                    onClick={() => act(app, 'reject')}
                    disabled={busyId === app.id}
                  >
                    ✕ Отклонить
                  </button>
                )}
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => {
                    setMessageFor(app);
                    setMessageText('');
                  }}
                  disabled={busyId === app.id}
                >
                  ✉ Написать
                </button>
                {app.lastMessageAt && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
                    последнее сообщение: {formatDate(app.lastMessageAt)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Форма сообщения заявителю — прямо из заявки */}
      {messageFor && (
        <>
          <div
            onClick={() => setMessageFor(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          />
          <div
            role="dialog"
            aria-label="Сообщение заявителю"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90vw',
              maxWidth: 520,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              zIndex: 1001,
              padding: 18,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
              ✉ Сообщение заявителю
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              {messageFor.displayName || messageFor.username} · id Balloo:{' '}
              {messageFor.username || messageFor.userId}
            </div>
            <textarea
              className="form-input"
              rows={5}
              maxLength={4000}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Текст сообщения — придёт заявителю в мессенджер"
              style={{ width: '100%', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn btn--tertiary" onClick={() => setMessageFor(null)}>
                Отмена
              </button>
              <button
                className="btn btn--primary"
                onClick={sendMessage}
                disabled={!messageText.trim() || busyId === messageFor.id}
              >
                Отправить
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

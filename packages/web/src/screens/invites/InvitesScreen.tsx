// Invites Screen — управление приглашениями
// Макет: mockups/balloo-su/invites.html

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

interface Invite {
  id: string;
  chatId: string;
  chatName?: string;
  chatType?: string;
  code: string;
  status: string;
  ttlType: string;
  maxUses?: number | null;
  usedCount: number;
  expiresAt: number | null;
  createdAt: number;
}

type ActiveTab = 'my' | 'create';
type DurationType = 'permanent' | 'timed' | 'onetime';

export default function InvitesScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('my');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  // Форма создания
  const [email, setEmail] = useState('');
  const [durationType, setDurationType] = useState<DurationType>('permanent');
  const [durationDays, setDurationDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getInvites();
      setInvites(data || []);
    } catch {
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const cancelInvite = useCallback(async (inviteId: string) => {
    try {
      await api.deleteInvite(inviteId);
      await fetchInvites();
    } catch {
      // ошибка
    }
  }, [fetchInvites]);

  const createInvite = useCallback(async () => {
    if (!email) return;
    try {
      setSubmitting(true);
      await api.createInvite({
        email,
        durationType,
        durationDays: durationType === 'timed' ? durationDays : undefined,
      });
      setEmail('');
      setDurationType('permanent');
      setDurationDays(7);
      setActiveTab('my');
      await fetchInvites();
    } catch {
      // ошибка
    } finally {
      setSubmitting(false);
    }
  }, [email, durationType, durationDays, fetchInvites]);

  const formatDate = (ts: number | null) => {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString('ru-RU');
  };

  const statusChip = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="chip chip--accent">✅ Принято</span>;
      case 'pending':
        return <span className="chip chip--warning">⏳ Ожидает</span>;
      case 'expired':
        return <span className="chip">⌛ Истекло</span>;
      default:
        return <span className="chip">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Приглашения</h1>
      <p className="page-subtitle">Управление приглашениями в группы</p>

      {/* Табы */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'my' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          Мои приглашения
        </button>
        <button
          className={`tab ${activeTab === 'create' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Создать
        </button>
      </div>

      {/* Tab: Мои приглашения */}
      {activeTab === 'my' && (
        <div className="invite-list">
          {loading ? (
            <p>Загрузка...</p>
          ) : invites.length === 0 ? (
            <p className="empty-state">Приглашений нет</p>
          ) : (
            invites.map((invite) => (
              <div key={invite.id} className="invite-card">
                <div className="invite-card__header">
                  <span className="invite-card__code">Код: {invite.code}</span>
                  {statusChip(invite.status)}
                </div>
                <div className="invite-card__chat">
                  <span className="invite-card__chat-label">Группа:</span>
                  <span className="invite-card__chat-name">{invite.chatName || invite.chatId}</span>
                </div>
                <div className="invite-card__dates">
                  <span>Создано: {formatDate(invite.createdAt)}</span>
                  <span>Истекает: {formatDate(invite.expiresAt)}</span>
                  <span>Использовано: {invite.usedCount}{invite.maxUses ? `/${invite.maxUses}` : ''}</span>
                </div>
                {invite.status === 'pending' && (
                  <button
                    className="btn btn--tertiary btn--sm"
                    onClick={() => cancelInvite(invite.id)}
                  >
                    Отменить
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Создать */}
      {activeTab === 'create' && (
        <div className="create-invite-form">
          <div className="form-group">
            <label className="form-label">Email приглашаемого</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Срок действия</label>
            <div className="duration-switch">
              <button
                className={`btn btn--sm ${durationType === 'permanent' ? 'btn--primary' : 'btn--tertiary'}`}
                onClick={() => setDurationType('permanent')}
              >
                Бессрочный
              </button>
              <button
                className={`btn btn--sm ${durationType === 'timed' ? 'btn--primary' : 'btn--tertiary'}`}
                onClick={() => setDurationType('timed')}
              >
                Срочный
              </button>
              <button
                className={`btn btn--sm ${durationType === 'onetime' ? 'btn--primary' : 'btn--tertiary'}`}
                onClick={() => setDurationType('onetime')}
              >
                Единоразовый
              </button>
            </div>
          </div>

          {durationType === 'timed' && (
            <div className="form-group">
              <label className="form-label">Дней: {durationDays}</label>
              <input
                type="range"
                min="1"
                max="90"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="form-range"
              />
            </div>
          )}

          <button
            className="btn btn--primary"
            onClick={createInvite}
            disabled={submitting || !email}
          >
            {submitting ? 'Отправка...' : 'Отправить приглашение'}
          </button>
          <p className="form-hint">Приглашённые автоматически добавляются в контакты</p>
        </div>
      )}
    </div>
  );
}

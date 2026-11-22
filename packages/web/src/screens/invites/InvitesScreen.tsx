// InvitesScreen — управление приглашениями по ссылке.
// Макет: mockups/balloo-su/invites.html (+ invites.md).
// Тик. 1792160016, 1795270823.
//
// Табы: «Мои приглашения» / «Создать» / «Я присоединил к Balloo» (рефералы).
// Приглашение — ссылка на страницу /join/:code (письма не отправляются).

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { PageChrome } from '@/components/chrome/PageChrome';

interface Invite {
  id: string;
  chatId: string;
  chatName?: string;
  chatType?: string;
  groupIds?: string[];
  code: string;
  url?: string;
  status: string;
  ttlType: string;
  maxUses?: number | null;
  usedCount: number;
  addToContacts?: boolean;
  message?: string | null;
  expiresAt: number | null;
  createdAt: number;
}

interface Referral {
  id: string;
  userId: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  code: string;
  joinedAt: number;
}

interface ChatOption {
  id: string;
  name?: string;
  type?: string;
}

type ActiveTab = 'my' | 'create' | 'referrals';
type DurationType = 'permanent' | 'timed' | 'onetime';

export default function InvitesScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('my');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [chats, setChats] = useState<ChatOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Форма создания
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [addToContacts, setAddToContacts] = useState(true);
  const [message, setMessage] = useState('');
  const [durationType, setDurationType] = useState<DurationType>('permanent');
  const [durationDays, setDurationDays] = useState(7);
  const [maxUses, setMaxUses] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getInvites();
      setInvites(Array.isArray(data) ? data : []);
    } catch {
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReferrals = useCallback(async () => {
    try {
      const data = await api.getReferrals();
      setReferrals(data?.referrals ?? []);
    } catch {
      setReferrals([]);
    }
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const data: any = await api.getChats();
      const list: ChatOption[] = Array.isArray(data) ? data : data?.chats ?? [];
      setChats(list.filter((c) => c.type === 'group' || c.type === 'channel'));
    } catch {
      setChats([]);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
    fetchReferrals();
    fetchChats();
  }, [fetchInvites, fetchReferrals, fetchChats]);

  const cancelInvite = useCallback(async (inviteId: string) => {
    try {
      await api.deleteInvite(inviteId);
      await fetchInvites();
    } catch {
      // ошибка
    }
  }, [fetchInvites]);

  const copyLink = useCallback(async (invite: Invite) => {
    const url = invite.url || `https://balloo.su/join/${invite.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(invite.code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // clipboard недоступен
    }
  }, []);

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createInvite = useCallback(async () => {
    setFormError('');
    if (selectedGroupIds.length === 0) {
      setFormError('Выберите хотя бы одну группу');
      return;
    }
    try {
      setSubmitting(true);
      const [primary, ...extra] = selectedGroupIds;
      await api.createInvite({
        chatId: primary,
        groupIds: extra,
        addToContacts,
        message: message.trim() || undefined,
        ttlType: durationType,
        maxUses: durationType === 'onetime' ? 1 : null,
        expiresAt:
          durationType === 'timed'
            ? Math.floor(Date.now() / 1000) + durationDays * 86400
            : null,
      });
      setSelectedGroupIds([]);
      setMessage('');
      setDurationType('permanent');
      setDurationDays(7);
      setActiveTab('my');
      await fetchInvites();
    } catch (err: any) {
      setFormError(err.message || 'Не удалось создать приглашение');
    } finally {
      setSubmitting(false);
    }
  }, [selectedGroupIds, addToContacts, message, durationType, durationDays, fetchInvites]);

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

  const selectedNames = selectedGroupIds
    .map((id) => chats.find((c) => c.id === id)?.name || id)
    .join(', ');

  return (
    <PageChrome title="Приглашения">
      <div className="page-container">
        <h1 className="page-title">Приглашения</h1>
        <p className="page-subtitle">Создавайте ссылки-приглашения для групп</p>

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
        <button
          className={`tab ${activeTab === 'referrals' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('referrals')}
        >
          Я присоединил к Balloo{referrals.length > 0 ? ` (${referrals.length})` : ''}
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
                  <span className="invite-card__chat-name">
                    {invite.chatName || invite.chatId}
                    {invite.groupIds && invite.groupIds.length > 1
                      ? ` + ещё ${invite.groupIds.length - 1}`
                      : ''}
                  </span>
                </div>
                <div className="invite-card__dates">
                  <span>Создано: {formatDate(invite.createdAt)}</span>
                  <span>Истекает: {formatDate(invite.expiresAt)}</span>
                  <span>
                    Использовано: {invite.usedCount}
                    {invite.maxUses ? `/${invite.maxUses}` : ''}
                  </span>
                  <span>В контакты: {invite.addToContacts ? '✅' : '❌'}</span>
                </div>
                <div className="flex gap-2" style={{ marginTop: '8px' }}>
                  <button className="btn btn--secondary btn--sm" onClick={() => copyLink(invite)}>
                    {copiedCode === invite.code ? '✓ Скопировано' : '📋 Копировать ссылку'}
                  </button>
                  {invite.status === 'pending' && (
                    <button
                      className="btn btn--tertiary btn--sm"
                      onClick={() => cancelInvite(invite.id)}
                    >
                      Отменить
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Создать */}
      {activeTab === 'create' && (
        <div className="create-invite-form">
          <div className="form-group">
            <label className="form-label">Выберите группы</label>
            {chats.length === 0 ? (
              <p className="form-hint">У вас нет групп. Сначала создайте группу.</p>
            ) : (
              <div
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                }}
              >
                {chats.map((c) => (
                  <label
                    key={c.id}
                    className="form-checkbox"
                    style={{ padding: '8px 14px', cursor: 'pointer', display: 'flex', gap: '8px' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(c.id)}
                      onChange={() => toggleGroup(c.id)}
                    />
                    <span>
                      {c.type === 'channel' ? '📢' : '👥'} {c.name || c.id}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {selectedNames && (
              <p className="form-hint">Выбрано: {selectedNames}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Добавлять приглашённых в контакты</label>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={addToContacts}
                onChange={(e) => setAddToContacts(e.target.checked)}
              />
              <span>Автоматически добавлять в контакты создавшего</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">
              Текст на странице приглашения <span className="text-muted">(опционально)</span>
            </label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '60px' }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Привет! Присоединяйся к нашей группе..."
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

          {durationType === 'onetime' && (
            <div className="form-group">
              <p className="form-hint">Ссылка сработает один раз (лимит: 1).</p>
            </div>
          )}

          {formError && <p style={{ color: 'var(--danger)' }}>{formError}</p>}

          <button
            className="btn btn--primary"
            onClick={createInvite}
            disabled={submitting || selectedGroupIds.length === 0}
          >
            {submitting ? 'Создание...' : 'Создать ссылку'}
          </button>
          <p className="form-hint">
            Ссылку можно скопировать и отправить в любом мессенджере.
          </p>
        </div>
      )}

      {/* Tab: Я присоединил к Balloo (рефералы) */}
      {activeTab === 'referrals' && (
        <div className="invite-list">
          <div
            className="card mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(45,184,77,0.08), rgba(45,184,77,0.02))' }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '24px' }}>🚀</span>
              <div>
                <div className="text-sm font-bold">Я присоединил к Balloo</div>
                <div className="text-xs text-secondary">
                  Приглашено: {referrals.length}. В MVP2/3 за рефералов будут бонусы.
                </div>
              </div>
            </div>
          </div>

          {referrals.length === 0 ? (
            <p className="empty-state">Пока никто не присоединился по вашей ссылке</p>
          ) : (
            referrals.map((r) => {
              const name = r.displayName || r.username || 'Пользователь';
              return (
                <div key={r.id} className="invite-card">
                  <div className="flex items-center gap-3">
                    <div className="avatar avatar--sm avatar--bordered avatar--ctx-contact">
                      <div className="avatar__inner">
                        {r.avatarUrl ? (
                          <img src={r.avatarUrl} alt={name} />
                        ) : (
                          <span>{name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{name}</div>
                      <div className="text-xs text-muted">
                        Присоединился: {formatDate(r.joinedAt)} · код {r.code}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      </div>
    </PageChrome>
  );
}

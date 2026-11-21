// JoinInviteScreen — публичная страница приглашения (/join/:code).
// Тик. 1795270823. Приглашения в Balloo работают как ссылка на страницу:
// письма не отправляются. Гость видит, кто пригласил, в какие группы и текст
// приглашения; по кнопке — присоединяется. Если не авторизован — уходит на
// регистрацию с id-меткой приглашения (?invite=<code>), чтобы засчитаться
// в рефералы пригласившего.

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { AppTopbar } from '@/components/chrome/AppTopbar';
import { AppFooter } from '@/components/chrome/AppFooter';

interface InvitePreview {
  code: string;
  messenger: string;
  inviter: {
    id: string;
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
  groups: { id: string; name: string | null; type: string; avatarUrl: string | null }[];
  message: string | null;
  addToContacts: boolean;
  expiresAt: number | null;
  active: boolean;
  reason: 'expired' | 'limit' | null;
}

export default function JoinInviteScreen() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!code) {
      setError('Некорректная ссылка приглашения');
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .previewInvite(code)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message || 'Приглашение не найдено');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const inviterName = preview?.inviter.displayName || preview?.inviter.username || 'Пользователь';

  const handleJoin = async () => {
    if (!code || !preview) return;
    if (!isAuthenticated) {
      // id-метка приглашения передаётся в регистрацию (тик. 1795270823)
      navigate(`/register?invite=${encodeURIComponent(code)}`);
      return;
    }
    setJoining(true);
    setError('');
    try {
      await api.acceptInviteByCode(code);
      navigate('/chat');
    } catch (err: any) {
      setError(err.message || 'Не удалось присоединиться');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="app-shell">
      <AppTopbar />
      <div className="page-container" style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 16px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px' }}>Загрузка приглашения…</p>
        ) : error && !preview ? (
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px' }}>🔗</div>
            <h1 className="page-title">Приглашение недоступно</h1>
            <p className="page-subtitle">{error}</p>
            <button className="btn btn--primary" onClick={() => navigate('/')}>
              На главную
            </button>
          </div>
        ) : preview ? (
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Приглашение в {preview.messenger}
              </div>
            </div>

            {/* Кто пригласил */}
            <div className="flex items-center gap-3" style={{ justifyContent: 'center', marginBottom: '20px' }}>
              <div className="avatar avatar--md avatar--bordered avatar--ctx-contact">
                <div className="avatar__inner">
                  {preview.inviter.avatarUrl ? (
                    <img src={preview.inviter.avatarUrl} alt={inviterName} />
                  ) : (
                    <span>{inviterName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{inviterName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>приглашает вас</div>
              </div>
            </div>

            {/* Сообщение приглашения */}
            {preview.message && (
              <div
                className="card"
                style={{
                  padding: '12px 16px',
                  marginBottom: '16px',
                  background: 'var(--bg-tertiary)',
                  fontStyle: 'italic',
                }}
              >
                «{preview.message}»
              </div>
            )}

            {/* Группы */}
            <div style={{ marginBottom: '20px' }}>
              <div className="form-label">
                {preview.groups.length > 1 ? 'Группы' : 'Группа'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {preview.groups.map((g) => (
                  <div key={g.id} className="flex items-center gap-2">
                    <span>{g.type === 'channel' ? '📢' : '👥'}</span>
                    <span>{g.name || 'Без названия'}</span>
                  </div>
                ))}
              </div>
              {preview.addToContacts && (
                <p className="form-hint">Пригласивший также добавит вас в свои контакты.</p>
              )}
            </div>

            {!preview.active ? (
              <div className="card" style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {preview.reason === 'expired' ? 'Срок приглашения истёк' : 'Лимит приглашений исчерпан'}
              </div>
            ) : (
              <button
                className="btn btn--primary btn--block"
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? 'Присоединяемся…' : 'Присоединиться'}
              </button>
            )}

            {error && preview && (
              <p style={{ color: 'var(--danger)', marginTop: '12px', textAlign: 'center' }}>{error}</p>
            )}
          </div>
        ) : null}
      </div>
      <AppFooter />
    </div>
  );
}

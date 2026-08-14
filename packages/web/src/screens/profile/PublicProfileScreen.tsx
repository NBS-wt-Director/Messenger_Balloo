// Public Profile Screen — просмотр публичного профиля другого пользователя
// Макет: mockups/balloo-su/public-profile.html

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/services/api';

interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  status: string;
  birthDate?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  registrationDate?: string;
  stats?: {
    messages: number;
    chats: number;
    groups: number;
  };
  isContact: boolean;
  isBlocked: boolean;
}

interface PublicGroup {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  type: string;
  memberCount: number;
}

export default function PublicProfileScreen() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      const data = await api.getUserPublicProfile(username);
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Профиль не найден');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleWrite = () => {
    if (!profile) return;
    window.location.hash = `#/chat?userId=${profile.id}`;
  };

  const handleAddContact = async () => {
    if (!profile) return;
    setActionLoading('contact');
    try {
      await api.addContact(profile.id);
      setProfile(prev => prev ? { ...prev, isContact: true } : null);
    } catch {
      setError('Не удалось добавить в контакты');
    } finally {
      setActionLoading(null);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/#/profile/${username}`;
    if (navigator.share) {
      navigator.share({ title: profile?.displayName || 'Профиль', url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Ссылка скопирована в буфер обмена');
    }
  };

  if (loading) {
    return (
      <div className="page-container page-container--narrow" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" />
        <p className="text-secondary mt-4">Загрузка профиля...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container page-container--narrow" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '48px', marginBottom: '1rem' }}>😕</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Профиль не найден</h2>
        <p className="text-secondary">{error}</p>
        <button className="btn btn--primary mt-4" onClick={() => (window.location.hash = '#/search')}>
          🔍 Найти пользователя
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-container page-container--narrow" style={{ textAlign: 'center', padding: '3rem' }}>
        <p className="text-secondary">Профиль не доступен</p>
      </div>
    );
  }

  return (
    <div className="page-container page-container--narrow">
      {/* Header with avatar and basic info */}
      <div className="text-center mb-6">
        <div
          className="avatar avatar--xl avatar--bordered avatar--status-online avatar--ctx-contact"
          style={{ margin: '0 auto 16px' }}
        >
          <div className="avatar__inner">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>{getInitials(profile.displayName)}</span>
            )}
          </div>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {profile.displayName}
        </h1>
        {profile.bio && (
          <p className="text-secondary mb-2" style={{ marginBottom: '0.5rem' }}>
            {profile.bio}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mb-4" style={{ justifyContent: 'center', gap: '8px', marginBottom: '1rem' }}>
          <span
            className={`status-dot status-dot--${profile.status === 'online' ? 'online' : 'offline'}`}
          />
          <span className="text-sm text-muted">
            {profile.status === 'online' ? 'В сети' : 'Не в сети'}
          </span>
          {profile.registrationDate && (
            <span className="chip" style={{ fontSize: '12px' }}>
              Дата рег.: {profile.registrationDate}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2" style={{ justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn--primary"
            onClick={handleWrite}
            disabled={actionLoading === 'contact'}
          >
            💬 Написать
          </button>
          <button
            className="btn btn--secondary"
            onClick={handleAddContact}
            disabled={profile.isContact || actionLoading === 'contact'}
          >
            {profile.isContact ? '✓ В контактах' : '➕ В контакты'}
          </button>
          <button className="btn btn--tertiary" onClick={handleShare} title="Поделиться">
            🔗
          </button>
        </div>
      </div>

      {/* Stats card */}
      {profile.stats && (
        <div className="card mb-4" style={{ padding: '16px' }}>
          <div className="flex items-center justify-around" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div className="text-center">
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>
                {profile.stats.messages.toLocaleString()}
              </div>
              <div className="text-xs text-muted">Сообщений</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }} />
            <div className="text-center">
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>
                {profile.stats.chats.toLocaleString()}
              </div>
              <div className="text-xs text-muted">Чатов</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }} />
            <div className="text-center">
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>
                {profile.stats.groups.toLocaleString()}
              </div>
              <div className="text-xs text-muted">Групп</div>
            </div>
          </div>
        </div>
      )}

      {/* Additional info (only visible fields) */}
      {(profile.website || profile.birthDate || profile.socialLinks) && (
        <div className="card mb-4" style={{ padding: '16px' }}>
          <h3 className="card__title mb-4">Подробности</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.birthDate && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-secondary">Дата рождения</span>
                <span style={{ color: 'var(--text-primary)' }}>{profile.birthDate}</span>
              </div>
            )}
            {profile.website && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-secondary">Веб-сайт</span>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'none' }}
                >
                  {profile.website} →
                </a>
              </div>
            )}
            {Object.keys(profile.socialLinks || {}).map(key => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-secondary">{key}</span>
                <a
                  href={profile.socialLinks![key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'none' }}
                >
                  Ссылка →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public groups */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <h3 className="card__title mb-4">Публичные группы</h3>
        {groups.length === 0 ? (
          <p className="text-secondary text-center py-4">
            Нет публичных групп
          </p>
        ) : (
          groups.map(group => (
            <div
              key={group.id}
              className="list__item"
              style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', cursor: 'pointer' }}
              onClick={() => (window.location.hash = `#/chat/${group.id}`)}
            >
              <div
                className="avatar avatar--sm avatar--bordered avatar--status-online avatar--ctx-new"
                style={{ cursor: 'pointer' }}
              >
                <div className="avatar__inner">
                  <span>{getInitials(group.name)}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="list__item-title" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {group.name}
                </div>
                <div className="list__item-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {group.description} · {group.memberCount.toLocaleString()} участников
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* If user is blocked, show message */}
      {profile.isBlocked && (
        <div className="card" style={{ padding: '16px', borderColor: 'var(--danger)' }}>
          <p className="text-sm text-secondary" style={{ color: 'var(--danger)' }}>
            🔒 Этот пользователь заблокировал вас. Вы не можете отправлять сообщения.
          </p>
        </div>
      )}
    </div>
  );
}
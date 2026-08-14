// Create Channel Screen — создание канала
// Макет: mockups/balloo-su/channel-create.html
// Функция: 0_01_06 — Создание каналов и групп

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useChatStore } from '@/store/chatStore';

type ChannelVisibility = 'public' | 'private';
type WhoCanWrite = 'admin' | 'admin_moderators' | 'all';
type EditPosts = '24h' | 'forever' | 'never';

const CHANNEL_CATEGORIES = [
  { value: 'news', label: '📰 Новости' },
  { value: 'tech', label: '💻 Технологии' },
  { value: 'science', label: '🔬 Наука' },
  { value: 'business', label: '💼 Бизнес' },
  { value: 'entertainment', label: '🎭 Развлечения' },
  { value: 'education', label: '📚 Образование' },
  { value: 'sports', label: '⚽ Спорт' },
  { value: 'other', label: '📌 Другое' },
];

function CreateChannelScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addChat = useChatStore((s) => s.addChat);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<ChannelVisibility>('public');
  const [inviteLink, setInviteLink] = useState('');
  const [category, setCategory] = useState('news');
  const [whoCanWrite, setWhoCanWrite] = useState<WhoCanWrite>('admin');
  const [editPosts, setEditPosts] = useState<EditPosts>('24h');
  const [allowForward, setAllowForward] = useState(true);
  const [hideSubscribers, setHideSubscribers] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [enableDiscussion, setEnableDiscussion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate link from name
  useEffect(() => {
    if (name.trim()) {
      const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-zа-яё0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setInviteLink(`https://balloo.su/c/${slug}`);
    } else {
      setInviteLink('');
    }
  }, [name]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const data: any = await api.request('/api/upload/avatar', {
        method: 'POST',
        body: uploadFormData,
        headers: {},
      });
      setAvatarUrl(data.url);
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Ссылка скопирована');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Введите название канала');
      return;
    }

    if (name.length > 70) {
      setError('Название не может превышать 70 символов');
      return;
    }

    setLoading(true);
    try {
      const channelData = {
        name: name.trim(),
        description: description.trim(),
        avatarUrl,
        type: 'channel',
        visibility,
        inviteLink: visibility === 'public' ? inviteLink : null,
        category,
        settings: {
          whoCanWrite,
          editPosts,
          allowForward,
          hideSubscribers,
          requireApproval,
          enableDiscussion,
        },
      };

      const created = await api.createChannel(channelData);
      addChat({
        id: created.id,
        name: created.name,
        type: 'channel',
        avatarUrl: created.avatarUrl,
        role: 'owner' as const,
        joinedAt: Date.now(),
        pinned: false,
        muted: false,
        unreadCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      navigate('/chat', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Ошибка создания канала');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container page-container--narrow">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div
            className="w-16 h-16 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
              clipPath: 'var(--octagon-clip)',
              fontSize: '28px',
            }}
          >
            📢
          </div>
          <div>
            <h1 className="text-2xl font-bold">Создать канал</h1>
            <p className="text-muted">
              Канал — рассылка сообщений для неограниченного числа подписчиков
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleCreate}>
        {/* Step 1: Основное */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            <span className="chip chip--accent" style={{ marginRight: '8px' }}>1</span>
            Основное
          </h3>

          <div className="form-group">
            <label className="form-label">Название канала *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Мой канал"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={70}
            />
            <span className="text-xs text-muted">{name.length}/70</span>
          </div>

          <div className="form-group">
            <label className="form-label">Аватар</label>
            <div className="flex items-center gap-3">
              <div
                className="cursor-pointer"
                style={{
                  width: '120px',
                  height: '120px',
                  background: 'var(--surface)',
                  border: '2px dashed var(--border)',
                  clipPath: 'var(--octagon-clip)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                }}
                onClick={handleAvatarClick}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ clipPath: 'var(--octagon-clip)' }}
                  />
                ) : (
                  '📷'
                )}
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={handleAvatarClick}
              >
                Загрузить аватар
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea
              className="form-input form-input--textarea"
              placeholder="О чём ваш канал..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <span className="text-xs text-muted">{description.length}/500</span>
          </div>
        </div>

        {/* Step 2: Тип канала */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            <span className="chip chip--accent" style={{ marginRight: '8px' }}>2</span>
            Тип канала
          </h3>

          <div className="form-group form-group--flex">
            <div className="flex gap-4">
              <label
                className={`form-radio ${visibility === 'public' ? 'form-radio--active' : ''}`}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                />
                <span className="form-radio__label">🌐 Публичный</span>
              </label>
              <label
                className={`form-radio ${visibility === 'private' ? 'form-radio--active' : ''}`}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                />
                <span className="form-radio__label">🔒 Приватный</span>
              </label>
            </div>
          </div>

          {visibility === 'public' && (
            <div className="form-group">
              <label className="form-label">Ссылка-приглашение</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="form-input flex-1"
                  value={inviteLink || 'Введите название для генерации ссылки'}
                  readOnly
                  style={{ background: 'var(--surface)', color: inviteLink ? 'inherit' : 'var(--muted)' }}
                />
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={handleCopyLink}
                >
                  📋 Копировать
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Категория</label>
            <select
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CHANNEL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 3: Подписчики */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            <span className="chip chip--accent" style={{ marginRight: '8px' }}>3</span>
            Подписчики
          </h3>

          <div className="form-group">
            <label className="form-label">Кто может писать в канал</label>
            <select
              className="form-input"
              value={whoCanWrite}
              onChange={(e) => setWhoCanWrite(e.target.value as WhoCanWrite)}
            >
              <option value="admin">Только админ</option>
              <option value="admin_moderators">Админ + модераторы</option>
              <option value="all">Все подписчики (обсуждаемый)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Редактирование постов</label>
            <select
              className="form-input"
              value={editPosts}
              onChange={(e) => setEditPosts(e.target.value as EditPosts)}
            >
              <option value="24h">24 часа</option>
              <option value="forever">Навсегда</option>
              <option value="never">Без редактирования</option>
            </select>
          </div>

          <div className="form-group form-group--flex">
            <div className="flex-1">
              <label className="form-label">Разрешить пересылку из канала</label>
              <p className="text-xs text-muted">Подписчики смогут пересылать ваши посты</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={allowForward}
                onChange={(e) => setAllowForward(e.target.checked)}
              />
              <span className="switch__slider" />
            </label>
          </div>

          <div className="form-group form-group--flex">
            <div className="flex-1">
              <label className="form-label">Скрыть счётчик подписчиков</label>
              <p className="text-xs text-muted">
                Посетители не увидят количество подписчиков
              </p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={hideSubscribers}
                onChange={(e) => setHideSubscribers(e.target.checked)}
              />
              <span className="switch__slider" />
            </label>
          </div>

          <div className="form-group form-group--flex">
            <div className="flex-1">
              <label className="form-label">Требовать одобрение при вступлении</label>
              <p className="text-xs text-muted">
                Новые подписчики都需要 ваше подтверждение
              </p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
              />
              <span className="switch__slider" />
            </label>
          </div>
        </div>

        {/* Step 4: Обсуждение */}
        {whoCanWrite === 'all' && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">
              <span className="chip chip--accent" style={{ marginRight: '8px' }}>4</span>
              Обсуждение
            </h3>
            <p className="text-muted mb-4">
              Включите обсуждение, чтобы создать группу-чат для комментариев к постам.
            </p>
            <div className="form-group form-group--flex">
              <div className="flex-1">
                <label className="form-label">Включить обсуждение</label>
                <p className="text-xs text-muted">
                  Будет автоматически создана группа-чат для комментариев
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={enableDiscussion}
                  onChange={(e) => setEnableDiscussion(e.target.checked)}
                />
                <span className="switch__slider" />
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Администраторы */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            <span className="chip chip--accent" style={{ marginRight: '8px' }}>5</span>
            Администраторы
          </h3>
          <p className="text-sm text-muted mb-4">
            Назначьте администраторов для управления каналом.
          </p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="form-input flex-1"
              placeholder="🔍 Добавить администратора..."
            />
            <button type="button" className="btn btn--secondary btn--sm">
              ➕
            </button>
          </div>

          <div className="card" style={{ background: 'var(--surface)', opacity: 0.8 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{
                    background: 'var(--accent)',
                    clipPath: 'var(--octagon-clip)',
                    fontSize: '16px',
                  }}
                >
                  👤
                </div>
                <div>
                  <div className="font-semibold">Иван Иванов</div>
                  <div className="text-xs text-muted">Создатель · Все права</div>
                </div>
              </div>
              <span className="chip chip--accent">Создатель</span>
            </div>
          </div>
        </div>

        {/* Step 6: Бот-команды */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            <span className="chip chip--accent" style={{ marginRight: '8px' }}>6</span>
            Бот-команды
          </h3>
          <p className="text-sm text-muted mb-4">
            Привяжите бота для автоматической публикации постов.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              className="form-input flex-1"
              placeholder="@botname /publish"
            />
            <button type="button" className="btn btn--secondary btn--sm">
              ➕
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="card mb-6"
            style={{ background: 'var(--danger)', color: 'white' }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="btn btn--primary btn--block flex-1 btn--lg"
            disabled={loading || !name.trim()}
            style={{ opacity: loading || !name.trim() ? 0.6 : 1 }}
          >
            📢 Создать канал
          </button>
          <button
            type="button"
            className="btn btn--tertiary"
            onClick={() => navigate(-1)}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateChannelScreen;

// Stories Screen — круг историй, лента, viewer, реакции
// Макет: mockups/balloo-su/story-create.html
// Функция: 0_01_11 — Истории
// Тикет: №30

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

// --- Types ---

interface StoryUser {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  stories: Story[];
  hasUnviewed: boolean;
}

interface Story {
  id: string;
  userId: string;
  type: 'image' | 'video' | 'text';
  mediaUrl: string;
  thumbnail: string | null;
  text?: string;
  bgColor?: string;
  createdAt: number;
  expiresAt: number;
  viewCount: number;
  reactions: StoryReaction[];
}

interface StoryReaction {
  userId: string;
  emoji: string;
  createdAt: number;
}

// --- Story Circle Component ---

function StoryCircle({
  user,
  onClick,
}: {
  user: StoryUser;
  onClick: () => void;
}) {
  return (
    <div
      className="story-circle"
      onClick={onClick}
      style={{ cursor: 'pointer', flexShrink: 0 }}
    >
      <div
        className={`story-circle__ring ${user.hasUnviewed ? 'story-circle__ring--unviewed' : 'story-circle__ring--viewed'}`}
      >
        <div className="story-circle__avatar">
          <div
            className={`avatar avatar--md ${user.avatarUrl ? '' : 'avatar--bordered avatar--status-online'}`}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div className="avatar__inner">
                <span>
                  {user.displayName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="story-circle__name">
        {user.displayName.split(' ')[0]}
      </div>
    </div>
  );
}

// --- Story Viewer Component ---

function StoryViewer({
  storyUsers,
  initialUserId,
  initialStoryIndex,
  onClose,
  onReact,
  onView,
}: {
  storyUsers: StoryUser[];
  initialUserId: string;
  initialStoryIndex: number;
  onClose: () => void;
  onReact: (storyId: string, emoji: string) => void;
  onView: (storyId: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState({
    userId: initialUserId,
    storyIndex: initialStoryIndex,
  });
  const [progress, setProgress] = useState(0);
  const [showReactions, setShowReactions] = useState(false);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const timerRef = useRef<number | null>(null);
  const touchStartX = useRef(0);

  const currentUser = storyUsers.find((u) => u.id === currentIndex.userId);
  const currentStory = currentUser?.stories[currentIndex.storyIndex];

  const NEXT_DURATION = 5000;

  // Progress bar animation
  useEffect(() => {
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);

    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min((elapsed / NEXT_DURATION) * 100, 100);
      setProgress(p);

      if (p >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        advanceStory(1);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex.userId, currentIndex.storyIndex]);

  // Mark as viewed
  useEffect(() => {
    if (currentStory) {
      onView(currentStory.id);
    }
  }, [currentIndex.userId, currentIndex.storyIndex, currentStory]);

  const advanceStory = useCallback(
    (delta: number) => {
      const user = storyUsers.find((u) => u.id === currentIndex.userId);
      if (!user) return;

      const newIndex = currentIndex.storyIndex + delta;

      if (newIndex >= 0 && newIndex < user.stories.length) {
        setCurrentIndex((prev) => ({ ...prev, storyIndex: newIndex }));
      } else {
        const userIdx = storyUsers.findIndex(
          (u) => u.id === currentIndex.userId
        );
        const nextUserIdx = userIdx + (delta > 0 ? 1 : -1);

        if (nextUserIdx >= 0 && nextUserIdx < storyUsers.length) {
          const nextUser = storyUsers[nextUserIdx];
          if (nextUser.stories.length > 0) {
            const nextStoryIdx = delta > 0 ? 0 : nextUser.stories.length - 1;
            setCurrentIndex({
              userId: nextUser.id,
              storyIndex: nextStoryIdx,
            });
          } else {
            advanceStory(delta);
          }
        } else {
          onClose();
        }
      }
    },
    [currentIndex, storyUsers, onClose]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      setSwipeDir(diff > 0 ? 'left' : 'right');
      setTimeout(() => setSwipeDir(null), 300);
      advanceStory(diff > 0 ? -1 : 1);
    }
  };

  const handleLeftClick = () => advanceStory(-1);
  const handleRightClick = () => advanceStory(1);

  if (!currentStory || !currentUser) {
    return null;
  }

  const emojis = ['❤️', '🔥', '👍', '😂', '😮', '😢'];

  return (
    <div className="story-viewer-overlay">
      {/* Progress bars */}
      <div className="story-viewer__progress" style={{ marginBottom: 8 }}>
        {currentUser.stories.map((_, i) => (
          <div
            key={i}
            className="story-viewer__progress-bar"
            style={{
              flex: 1,
              marginRight: i < currentUser.stories.length - 1 ? 2 : 0,
            }}
          >
            {i === currentIndex.storyIndex ? (
              <div
                className="story-viewer__progress-fill"
                style={{ width: `${progress}%` }}
              />
            ) : i < currentIndex.storyIndex ? (
              <div
                className="story-viewer__progress-fill story-viewer__progress-fill--done"
                style={{ width: '100%' }}
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="story-viewer__header">
        <div className="story-viewer__user">
          <div
            className={`avatar avatar--sm ${currentUser.avatarUrl ? '' : 'avatar--bordered avatar--status-online'}`}
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div className="avatar__inner">
                <span>
                  {currentUser.displayName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="font-bold" style={{ fontSize: 14 }}>
              {currentUser.displayName}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {new Date(currentStory.createdAt).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
        <div className="topbar__actions-btn" onClick={onClose}>
          ✕
        </div>
      </div>

      {/* Content */}
      <div
        className="story-viewer__content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ position: 'relative' }}
      >
        <div
          className="story-viewer__tap-zone story-viewer__tap-zone--left"
          onClick={handleLeftClick}
        />
        <div
          className="story-viewer__tap-zone story-viewer__tap-zone--right"
          onClick={handleRightClick}
        />

        <div
          className="story-viewer__media"
          style={{
            background: currentStory.bgColor || '#0d0d0d',
            transform:
              swipeDir === 'left'
                ? 'translateX(-100%)'
                : swipeDir === 'right'
                ? 'translateX(100%)'
                : 'none',
            transition: 'transform 0.3s ease',
          }}
        >
          {currentStory.type === 'image' && (
            <div className="story-viewer__media-image">
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                🖼️ Изображение
              </div>
            </div>
          )}
          {currentStory.type === 'video' && (
            <div className="story-viewer__media-video">
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                🎥 Видео
              </div>
            </div>
          )}
          {currentStory.type === 'text' && currentStory.text && (
            <div className="story-viewer__media-text" style={{ padding: '0 32px' }}>
              <p
                style={{
                  fontSize: 24,
                  lineHeight: 1.5,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {currentStory.text}
              </p>
            </div>
          )}
        </div>

        {/* Reactions panel */}
        {showReactions && (
          <div className="story-viewer__reactions">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                className="story-viewer__reaction-btn"
                onClick={() => {
                  onReact(currentStory.id, emoji);
                  setShowReactions(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="story-viewer__footer">
        <input
          type="text"
          className="form-input form-input--sm"
          placeholder="Отправить сообщение..."
          style={{ flex: 1 }}
        />
        <button
          className="topbar__actions-btn"
          onClick={() => setShowReactions(!showReactions)}
          style={{ fontSize: 20, padding: '0 8px' }}
        >
          ❤️
        </button>
        <button
          className="topbar__actions-btn"
          style={{ fontSize: 20, padding: '0 8px' }}
        >
          ✉️
        </button>
      </div>

      {/* Existing reactions */}
      {currentStory.reactions.length > 0 && (
        <div className="story-viewer__existing-reactions">
          {Array.from(
            new Map(
              currentStory.reactions.map((r) => [r.emoji, r])
            ).values()
          ).map((r) => (
            <span key={r.emoji} style={{ fontSize: 20, marginRight: 4 }}>
              {r.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main Screen ---

function StoriesScreen() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<StoryUser[]>([]);
  const [viewer, setViewer] = useState<{
    userId: string;
    storyIndex: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStories = async () => {
    setLoading(true);
    try {
      const data = await api.get<StoryUser[]>('/api/stories');
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleOpenStory = (userId: string, storyIndex: number) => {
    setViewer({ userId, storyIndex });
  };

  const handleReact = async (storyId: string, emoji: string) => {
    try {
      await api.post(`/api/stories/${storyId}/reactions`, { emoji });
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          stories: u.stories.map((s) =>
            s.id === storyId
              ? {
                  ...s,
                  reactions: [
                    ...s.reactions,
                    { userId: 'me', emoji, createdAt: Date.now() },
                  ],
                }
              : s
          ),
        }))
      );
    } catch {
      // Опционально: показать ошибку
    }
  };

  const handleView = async (storyId: string) => {
    try {
      await api.post(`/api/stories/${storyId}/view`);
    } catch {
      // Опционально
    }
  };

  const handleCreateStory = () => {
    navigate('/stories/create');
  };

  const usersWithStories = users.filter((u) => u.stories.length > 0);

  return (
    <div className="stories-screen">
      {/* Header */}
      <div className="stories-screen__header">
        <h2 style={{ margin: 0, fontSize: 20 }}>Истории</h2>
      </div>

      {/* Story circles */}
      <div className="stories-screen__circles">
        {/* Add story */}
        <div className="story-circle" onClick={handleCreateStory}>
          <div className="story-circle__ring story-circle__ring--add">
            <div className="story-circle__avatar">
              <div className="avatar avatar--md">
                <div className="avatar__inner">
                  <span>Я</span>
                </div>
                <div className="story-circle__add">+</div>
              </div>
            </div>
          </div>
          <div className="story-circle__name">Добавить</div>
        </div>

        {/* Other users */}
        {usersWithStories.map((user) => (
          <StoryCircle
            key={user.id}
            user={user}
            onClick={() => handleOpenStory(user.id, 0)}
          />
        ))}
      </div>

      {/* Stories list */}
      <div className="stories-screen__list">
        {loading ? (
          <div className="text-muted" style={{ padding: 24, textAlign: 'center' }}>
            Загрузка историй...
          </div>
        ) : usersWithStories.length === 0 ? (
          <div className="text-muted" style={{ padding: 24, textAlign: 'center' }}>
            У ваших контактов пока нет историй
          </div>
        ) : (
          usersWithStories.map((user) =>
            user.stories.map((story) => (
              <div
                key={story.id}
                className="card story-item"
                onClick={() =>
                  handleOpenStory(
                    user.id,
                    user.stories.indexOf(story)
                  )
                }
                style={{ cursor: 'pointer', marginBottom: 12 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    className={`avatar avatar--sm ${user.avatarUrl ? '' : 'avatar--bordered'}`}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="avatar__inner">
                        <span>
                          {user.displayName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-bold" style={{ fontSize: 14 }}>
                      {user.displayName}
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {story.type === 'image'
                        ? '🖼️ Фото'
                        : story.type === 'video'
                        ? '🎥 Видео'
                        : '📝 Текст'}{' '}
                      ·{' '}
                      {new Date(story.createdAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    👁 {story.viewCount}
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Story Viewer Overlay */}
      {viewer && (
        <StoryViewer
          storyUsers={users}
          initialUserId={viewer.userId}
          initialStoryIndex={viewer.storyIndex}
          onClose={() => setViewer(null)}
          onReact={handleReact}
          onView={handleView}
        />
      )}
    </div>
  );
}

export default StoriesScreen;

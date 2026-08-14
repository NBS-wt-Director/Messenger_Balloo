// Create Post Screen — создание поста с markdown/rich text редактором
// Соответствует макету: mockups/command-balloo-su/blog-editor.md

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { Chip } from '@/components/shared/Chip';

interface Channel {
  id: string;
  name: string;
  emoji: string;
}

const CHANNELS: Channel[] = [
  { id: 'news', name: 'Новости', emoji: '📰' },
  { id: 'tech', name: 'Технологии', emoji: '⚙️' },
  { id: 'team', name: 'Команда', emoji: '👥' },
  { id: 'metrics', name: 'Метрики', emoji: '📊' },
];

const TAGS_PRESET = [
  '#релиз', '#beta', '#обновление', '#дизайн', '#система',
  '#ui', '#websocket', '#backend', '#масштабирование', '#команда',
  '#удалёнка', '#ретроспектива', '#новости', '#технологии',
];

export function CreatePostScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('news');
  const [tags, setTags] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [coverEmoji, setCoverEmoji] = useState('📝');
  const [coverGradient, setCoverGradient] = useState('linear-gradient(135deg, #1a1d21, #2d3742)');
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [isPublished, setIsPublished] = useState(false);

  const coverEmojis = ['📝', '🚀', '📰', '⚙️', '👥', '📊', '🎨', '💡', '🔥', '✨'];
  const coverGradients = [
    'linear-gradient(135deg, #1a1d21, #2d3742)',
    'linear-gradient(135deg, #a855f7, #6b21a8)',
    'linear-gradient(135deg, #2db84d, #166534)',
    'linear-gradient(135deg, #3b82f6, #1e3a8a)',
    'linear-gradient(135deg, #f59e0b, #92400e)',
    'linear-gradient(135deg, #ec4899, #9d174d)',
  ];

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setShowTagPicker(false);
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handlePublish = (draft = false) => {
    if (!title.trim()) return;
    setIsPublished(true);
    // В реальном приложении здесь будет вызов API:
    // await api.createBlogPost({ title, subtitle, content, channelId: selectedChannel, tags, coverEmoji, coverGradient });
    setTimeout(() => {
      navigate(draft ? '/blog/my-posts' : '/blog');
    }, 1000);
  };

  const handleCancel = () => {
    if (content.trim() || title.trim()) {
      if (window.confirm('Вы уверены? Несохранённый контент будет потерян.')) {
        navigate('/blog');
      }
    } else {
      navigate('/blog');
    }
  };

  const previewContent = content
    .replace(/### (.*)/g, '<h3 style="color:var(--text-primary);margin:24px 0 12px;font-size:18px;">$1</h3>')
    .replace(/## (.*)/g, '<h2 style="color:var(--text-primary);margin:28px 0 14px;font-size:20px;">$1</h2>')
    .replace(/> (.*)/g, '<blockquote style="border-left:3px solid var(--accent);padding:12px 16px;background:var(--bg-tertiary);margin:16px 0;color:var(--text-secondary);">$1</blockquote>')
    .replace(/- (.*)/g, '<li style="margin-bottom:6px;">$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p style="margin-bottom:16px;">')
    .replace(/^/, '<p style="margin-bottom:16px;">')
    .replace(/$/, '</p>');

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--bg-tertiary)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleCancel}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              ← Назад
            </button>
            <div
              style={{
                width: '36px',
                height: '36px',
                background: '#a855f7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              📝
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
              Новый пост
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={() => handlePublish(true)}>
              Черновик
            </Button>
            <Button
              size="sm"
              onClick={() => handlePublish(false)}
              disabled={!title.trim()}
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Опубликовать
            </Button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            {/* Channel selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                Канал
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CHANNELS.map((channel) => (
                  <Chip
                    key={channel.id}
                    variant={selectedChannel === channel.id ? 'accent' : 'default'}
                    onClick={() => setSelectedChannel(channel.id)}
                    style={{ cursor: 'pointer', fontSize: '13px' }}
                  >
                    {channel.emoji} {channel.name}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Cover picker */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                Обложка
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {coverEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setCoverEmoji(emoji)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: coverEmoji === emoji ? '2px solid var(--accent)' : '2px solid transparent',
                      background: 'var(--bg-secondary)',
                      fontSize: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {coverGradients.map((gradient) => (
                  <button
                    key={gradient}
                    onClick={() => setCoverGradient(gradient)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: coverGradient === gradient ? '2px solid var(--accent)' : '2px solid transparent',
                      background: gradient,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Заголовок поста"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--bg-tertiary)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '20px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--bg-tertiary)')}
              />
            </div>

            {/* Subtitle */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Краткое описание (подзаголовок)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--bg-tertiary)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--bg-tertiary)')}
              />
            </div>

            {/* Cover preview */}
            <div
              style={{
                width: '100%',
                height: '160px',
                background: coverGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                borderRadius: '12px',
                marginBottom: '20px',
              }}
            >
              {coverEmoji}
            </div>

            {/* Content editor */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Содержимое (Markdown)</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setMode('write')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: mode === 'write' ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: mode === 'write' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ Редактор
                  </button>
                  <button
                    onClick={() => setMode('preview')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: mode === 'preview' ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: mode === 'preview' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    👁 Предпросмотр
                  </button>
                </div>
              </div>

              {mode === 'write' ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Напишите ваш пост... Используйте Markdown для форматирования."
                  style={{
                    width: '100%',
                    minHeight: '300px',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--bg-tertiary)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--bg-tertiary)')}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    minHeight: '300px',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--bg-tertiary)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    boxSizing: 'border-box',
                  }}
                  dangerouslySetInnerHTML={{ __html: previewContent || '<span style="color:var(--text-muted)">Начните писать, чтобы увидеть предпросмотр...</span>' }}
                />
              )}
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Теги</label>
                <button
                  onClick={() => setShowTagPicker(!showTagPicker)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  + Добавить
                </button>
              </div>

              {/* Selected tags */}
              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      variant="default"
                      style={{ fontSize: '12px' }}
                    >
                      {tag}
                      <span
                        onClick={() => handleRemoveTag(tag)}
                        style={{ marginLeft: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        ×
                      </span>
                    </Chip>
                  ))}
                </div>
              )}

              {/* Tag picker */}
              {showTagPicker && (
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    border: '1px solid var(--bg-tertiary)',
                  }}
                >
                  {TAGS_PRESET.map((tag) => (
                    <Chip
                      key={tag}
                      variant={tags.includes(tag) ? 'accent' : 'default'}
                      onClick={() => handleAddTag(tag)}
                      style={{ fontSize: '11px', cursor: 'pointer' }}
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            {/* Publish status */}
            {isPublished && (
              <div
                style={{
                  padding: '16px 20px',
                  background: 'rgba(45, 184, 77, 0.1)',
                  border: '1px solid var(--accent)',
                  borderRadius: '10px',
                  color: 'var(--accent)',
                  fontSize: '14px',
                  textAlign: 'center',
                }}
              >
                ✅ Пост успешно опубликован!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

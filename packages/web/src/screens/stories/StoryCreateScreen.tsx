// Story Create Screen — создание новой истории
// Макет: mockups/balloo-su/story-create.html
// Функция: 0_01_11 — Истории
// Тикет: №30

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

type StoryType = 'image' | 'video' | 'text';

function StoryCreateScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storyType, setStoryType] = useState<StoryType>('image');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState('#1a1a2e');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const COLORS = [
    '#1a1a2e', '#16213e', '#0f3460', '#533483',
    '#2b2d42', '#3d405b', '#283618', '#6b273c',
    '#4a0e0e', '#1b4332', '#1a365d', '#2d3436',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];

    if (!allowedTypes.includes(selected.type)) {
      setError('Неподдерживаемый тип файла');
      return;
    }

    if (selected.size > maxSize) {
      setError('Файл слишком большой (макс. 50 МБ)');
      return;
    }

    setFile(selected);
    setError('');

    // Generate preview
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(selected);
      setStoryType('image');
    } else if (selected.type.startsWith('video/')) {
      setStoryType('video');
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleTextSubmit = () => {
    if (!text.trim()) {
      setError('Введите текст');
      return;
    }
    setStoryType('text');
  };

  const handleSubmit = async () => {
    if (storyType === 'text' && !text.trim()) {
      setError('Введите текст');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (storyType === 'text') {
        // Text story — отправляем как JSON
        await api.post('/api/stories', {
          type: 'text',
          text,
          bgColor,
        });
      } else if (file) {
        // Media story — multipart upload
        const formData = new FormData();
        formData.append('media', file);
        formData.append('type', storyType);

        await api.request('/api/stories', { method: 'POST', body: formData as unknown as BodyInit });
      } else {
        setError('Выберите медиа или введите текст');
        return;
      }

      navigate('/stories');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка создания истории';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="story-create-screen">
      {/* Header */}
      <div className="story-create-screen__header">
        <button className="topbar__actions-btn" onClick={handleCancel}>
          ←
        </button>
        <h2 style={{ margin: 0, fontSize: 18 }}>Новая история</h2>
        <button
          className="btn btn--primary btn--sm"
          onClick={handleSubmit}
          disabled={loading}
          style={{ minWidth: 80 }}
        >
          {loading ? '...' : 'Опубликовать'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="card" style={{ margin: '0 16px 16px', backgroundColor: '#3d1f1f', borderColor: '#5a2d2d' }}>
          <div style={{ color: '#ff6b6b', fontSize: 14 }}>
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Type selector */}
      <div className="story-create-screen__type-selector" style={{ padding: '0 16px', marginBottom: 16 }}>
        <div className="tabs">
          <div
            className={`tab ${storyType === 'image' ? 'tab--active' : ''}`}
            onClick={() => setStoryType('image')}
          >
            🖼️ Фото
          </div>
          <div
            className={`tab ${storyType === 'video' ? 'tab--active' : ''}`}
            onClick={() => setStoryType('video')}
          >
            🎥 Видео
          </div>
          <div
            className={`tab ${storyType === 'text' ? 'tab--active' : ''}`}
            onClick={() => setStoryType('text')}
          >
            📝 Текст
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="story-create-screen__content">
        {/* Media type */}
        {(storyType === 'image' || storyType === 'video') && (
          <div>
            {!previewUrl ? (
              <div
                className="card"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  margin: '0 16px 16px',
                  minHeight: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 48 }}>
                  {storyType === 'image' ? '🖼️' : '🎥'}
                </div>
                <div className="text-muted">
                  Нажмите для выбора{' '}
                  {storyType === 'image' ? 'фото' : 'видео'}
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Макс. 50 МБ
                </div>
              </div>
            ) : (
              <div
                className="card"
                style={{
                  margin: '0 16px 16px',
                  minHeight: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {storyType === 'image' ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }}
                  />
                ) : (
                  <video
                    src={previewUrl}
                    controls
                    style={{ width: '100%', maxHeight: 400 }}
                  />
                )}
                <button
                  className="topbar__actions-btn"
                  onClick={() => {
                    setPreviewUrl(null);
                    setFile(null);
                  }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(0,0,0,0.6)',
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={storyType === 'image' ? 'image/*' : 'video/*'}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {!previewUrl && (
              <button
                className="btn btn--primary"
                onClick={() => fileInputRef.current?.click()}
                style={{ margin: '0 16px 16px', width: 'calc(100% - 32px)' }}
              >
                {storyType === 'image' ? '📷 Выбрать фото' : '🎥 Выбрать видео'}
              </button>
            )}
          </div>
        )}

        {/* Text type */}
        {storyType === 'text' && (
          <div style={{ padding: '0 16px' }}>
            <textarea
              className="form-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите текст для истории..."
              rows={8}
              style={{ marginBottom: 16, resize: 'vertical' }}
            />

            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                Цвет фона
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {COLORS.map((color) => (
                  <div
                    key={color}
                    className="story-create-screen__color-swatch"
                    onClick={() => setBgColor(color)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 4,
                      backgroundColor: color,
                      border: bgColor === color ? '3px solid var(--accent)' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoryCreateScreen;

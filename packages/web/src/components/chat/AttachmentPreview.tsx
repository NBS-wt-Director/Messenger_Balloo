// AttachmentPreview — превью вложений (изображения, файлы, видео)

import React, { useState } from 'react';

interface AttachmentPreviewProps {
  type: 'image' | 'video' | 'file' | 'voice';
  url?: string;
  thumbnail?: string;
  name?: string;
  size?: number;
  duration?: number;
  width?: number;
  height?: number;
  onClick?: () => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  type,
  url,
  thumbnail,
  name,
  size,
  duration,
  width = 280,
  height = 200,
  onClick,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  switch (type) {
    case 'image':
      return (
        <div
          style={{
            position: 'relative',
            width,
            height,
            overflow: 'hidden',
            cursor: 'pointer',
            background: 'var(--bg-tertiary)',
          }}
          onClick={onClick}
        >
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              Загрузка...
            </div>
          )}
          <img
            src={thumbnail || url}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isLoading ? 'none' : 'block',
            }}
            onLoad={() => setIsLoading(false)}
          />
          {name && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '8px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                color: '#fff',
                fontSize: '12px',
              }}
            >
              {name}
            </div>
          )}
        </div>
      );

    case 'video':
      return (
        <div
          style={{
            position: 'relative',
            width,
            height,
            overflow: 'hidden',
            cursor: 'pointer',
            background: 'var(--bg-tertiary)',
          }}
          onClick={onClick}
        >
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              Загрузка...
            </div>
          )}
          <video
            src={url}
            poster={thumbnail}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isLoading ? 'none' : 'block',
            }}
            onLoadStart={() => {}}
            onLoadedData={() => setIsLoading(false)}
            muted
          />
          {/* Play button overlay */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '48px',
              height: '48px',
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 0,
              color: '#fff',
              fontSize: '24px',
            }}
          >
            ▶
          </div>
          {/* Duration badge */}
          {duration && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '2px 6px',
                fontSize: '11px',
              }}
            >
              {formatDuration(duration)}
            </div>
          )}
        </div>
      );

    case 'voice':
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'var(--bg-tertiary)',
            cursor: 'pointer',
          }}
          onClick={onClick}
        >
          <button
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            ▶
          </button>
          <div
            style={{
              flex: 1,
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: `${4 + Math.random() * 24}px`,
                  background: 'var(--accent)',
                  opacity: i < 10 ? 1 : 0.3,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
            {formatDuration(duration)}
          </span>
        </div>
      );

    case 'file':
    default:
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'var(--bg-tertiary)',
            cursor: 'pointer',
          }}
          onClick={onClick}
        >
          <span style={{ fontSize: '32px', flexShrink: 0 }}>
            {getFileIcon(name || 'file')}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name || 'Файл'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {formatSize(size)}
            </div>
          </div>
        </div>
      );
  }
};

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return '📕';
    case 'doc':
    case 'docx':
      return '📘';
    case 'xls':
    case 'xlsx':
      return '📗';
    case 'zip':
    case 'rar':
      return '📦';
    case 'mp3':
    case 'ogg':
      return '🎵';
    case 'mp4':
    case 'webm':
      return '🎥';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return '🖼';
    default:
      return '📄';
  }
}

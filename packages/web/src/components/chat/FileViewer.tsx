// FileViewer — полноэкранный просмотрщик файлов/изображений
// Макет: mockups/balloo-su/file-viewer.html
// Функция: 1_01_33, приёмка 1.1.17
// Тикет: 1792137290
// Ключевое требование: изображение НЕ обрезается (object-fit:contain, без clip-path)

import React, { useState, useEffect, useCallback } from 'react';

export interface FileAttachment {
  id: string;
  type: string;
  url: string;
  thumbnail?: string;
  name?: string;
  size?: number;
  width?: number;
  height?: number;
}

interface FileViewerProps {
  attachments: FileAttachment[];
  initialIndex: number;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function FileViewer({ attachments, initialIndex, onClose }: FileViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [showInfo, setShowInfo] = useState(false);

  const current = attachments[currentIndex];

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
          setZoom(1);
          break;
        case 'ArrowRight':
          setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : prev));
          setZoom(1);
          break;
        case '+':
        case '=':
          setZoom((prev) => Math.min(prev * 1.25, 5));
          break;
        case '-':
          setZoom((prev) => Math.max(prev / 1.25, 0.25));
          break;
      }
    },
    [attachments.length, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!current) return null;

  const isImage = current.type === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(current.url);

  return (
    <div
      className="viewer-container"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 600,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toolbar */}
      <div
        className="viewer-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          ✕ Закрыть
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 14 }}>{current.name || 'Файл'}</div>
          <div className="viewer-counter" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            {currentIndex + 1} / {attachments.length}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowInfo(!showInfo)}
            title="Свойства файла"
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ℹ️
          </button>
          <a
            href={current.url}
            download={current.name}
            title="Скачать"
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            📥
          </a>
        </div>
      </div>

      {/* Content */}
      <div
        className="viewer-content"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Prev arrow */}
        {currentIndex > 0 && (
          <div
            className="viewer-nav viewer-nav--prev"
            onClick={() => { setCurrentIndex((p) => p - 1); setZoom(1); }}
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            ‹
          </div>
        )}

        {/* File content — NO clip-path, object-fit: contain */}
        {isImage ? (
          <img
            src={current.url}
            alt={current.name || 'Просмотр файла'}
            className="viewer-image"
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease',
            }}
          />
        ) : (
          <div
            style={{
              color: '#fff',
              textAlign: 'center',
              padding: 40,
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              {current.type === 'video' ? '🎥' : current.type === 'audio' ? '🎵' : '📄'}
            </div>
            <div style={{ fontSize: 16 }}>{current.name || 'Файл'}</div>
            {current.size && (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 }}>
                {formatBytes(current.size)}
              </div>
            )}
            <a
              href={current.url}
              download={current.name}
              className="btn btn--primary"
              style={{ marginTop: 24, display: 'inline-block' }}
            >
              📥 Скачать
            </a>
          </div>
        )}

        {/* Next arrow */}
        {currentIndex < attachments.length - 1 && (
          <div
            className="viewer-nav viewer-nav--next"
            onClick={() => { setCurrentIndex((p) => p + 1); setZoom(1); }}
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            ›
          </div>
        )}
      </div>

      {/* Preview strip */}
      {attachments.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '8px 20px',
            background: 'rgba(0,0,0,0.5)',
            overflowX: 'auto',
          }}
        >
          {attachments.map((att, idx) => (
            <div
              key={att.id}
              className={`file-thumb ${idx === currentIndex ? 'file-thumb--active' : ''}`}
              onClick={() => { setCurrentIndex(idx); setZoom(1); }}
              style={{
                width: 60,
                height: 60,
                clipPath: 'var(--hexagon-clip)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                cursor: 'pointer',
                opacity: idx === currentIndex ? 1 : 0.6,
                outline: idx === currentIndex ? '2px solid var(--accent)' : 'none',
                outlineOffset: 2,
                flexShrink: 0,
                background: 'var(--surface)',
              }}
            >
              {att.thumbnail ? (
                <img
                  src={att.thumbnail}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>
                  {att.type === 'image' ? '🖼️' : att.type === 'video' ? '🎥' : att.type === 'audio' ? '🎵' : '📄'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info sidebar */}
      {showInfo && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 56,
            bottom: 0,
            width: 320,
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(16px)',
            borderLeft: '1px solid var(--border-color)',
            overflowY: 'auto',
            padding: 20,
            color: 'var(--text-primary)',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Свойства файла</h3>
          <div style={{ fontSize: 14 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Имя:</strong> {current.name || '—'}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Тип:</strong> {current.type}
            </div>
            {current.size && (
              <div style={{ marginBottom: 8 }}>
                <strong>Размер:</strong> {formatBytes(current.size)}
              </div>
            )}
            {current.width && current.height && (
              <div style={{ marginBottom: 8 }}>
                <strong>Разрешение:</strong> {current.width}×{current.height}
              </div>
            )}
            <div style={{ marginBottom: 8 }}>
              <strong>Масштаб:</strong> {(zoom * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

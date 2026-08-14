// DesktopMediaViewerScreen.tsx — Desktop media viewer for images/videos
// Fullscreen media viewer with navigation and zoom

import React, { useState } from 'react';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  width?: number;
  height?: number;
  name?: string;
}

interface DesktopMediaViewerScreenProps {
  items: MediaItem[];
  initialIndex?: number;
  onClose?: () => void;
}

export function DesktopMediaViewerScreen({
  items,
  initialIndex = 0,
  onClose,
}: DesktopMediaViewerScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const current = items[currentIndex];
  if (!current) return null;

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
    setZoom(1);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleZoomReset = () => setZoom(1);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === '0') handleZoomReset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex]);

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  };

  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1,
  };

  const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: '8px 12px',
    fontSize: '14px',
    opacity: 0.8,
  };

  return (
    <div style={containerStyle}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#fff', fontSize: '14px' }}>
            {currentIndex + 1} / {items.length}
          </span>
          {current.name && (
            <span style={{ color: '#8a8aa0', fontSize: '13px', marginLeft: '8px' }}>
              {current.name}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={btnStyle} onClick={handleZoomOut} title="Уменьшить (-)">−</button>
          <span style={{ color: '#fff', fontSize: '13px', padding: '8px 4px' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button style={btnStyle} onClick={handleZoomIn} title="Увеличить (+)">+</button>
          <button style={btnStyle} onClick={handleZoomReset} title="Сбросить масштаб (0)">⊡</button>
          <button style={btnStyle} onClick={onClose} title="Закрыть (Esc)">✕</button>
        </div>
      </div>

      {/* Navigation */}
      <button
        onClick={handlePrev}
        style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.5)',
          border: 'none',
          color: '#fff',
          fontSize: '32px',
          cursor: 'pointer',
          padding: '16px 12px',
          zIndex: 1,
          opacity: 0.7,
        }}
      >
        ‹
      </button>
      <button
        onClick={handleNext}
        style={{
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.5)',
          border: 'none',
          color: '#fff',
          fontSize: '32px',
          cursor: 'pointer',
          padding: '16px 12px',
          zIndex: 1,
          opacity: 0.7,
        }}
      >
        ›
      </button>

      {/* Media content */}
      <div
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {current.type === 'image' ? (
          <img
            src={current.url}
            alt={current.name || 'Media'}
            style={{
              maxWidth: '100%',
              maxHeight: '85vh',
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease',
              objectFit: 'contain',
            }}
          />
        ) : (
          <video
            src={current.url}
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '85vh',
            }}
          />
        )}
      </div>
    </div>
  );
}
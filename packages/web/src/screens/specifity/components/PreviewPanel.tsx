// PreviewPanel — правая панель с превью макета (iframe)
// Тикет №59 — Specifity: спецификация

import { useState, useRef, useCallback } from 'react';

type PreviewMode = 'desktop' | 'tablet' | 'mobile';

const MODE_SIZES: Record<PreviewMode, { width: string; label: string }> = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet: { width: '768px', label: 'Tablet' },
  mobile: { width: '375px', label: 'Mobile' },
};

interface PreviewPanelProps {
  mockupUrl: string | null;
}

export function PreviewPanel({ mockupUrl }: PreviewPanelProps) {
  const [mode, setMode] = useState<PreviewMode>('desktop');
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(200, z + 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(30, z - 10));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(100);
    setIsFullscreen(false);
  }, []);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((f) => !f);
  }, []);

  const size = MODE_SIZES[mode];
  const iframeStyle = isFullscreen
    ? { width: '100%', height: '100%', transform: 'none' }
    : {
        width: size.width,
        height: '100%',
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'top center' as const,
      };

  return (
    <div className="spec-preview">
      <div className="spec-preview__toolbar">
        <div className="spec-preview__modes">
          <button
            className={`spec-preview__mode-btn ${mode === 'desktop' ? 'spec-preview__mode-btn--active' : ''}`}
            onClick={() => setMode('desktop')}
          >
            🖥️ Desktop
          </button>
          <button
            className={`spec-preview__mode-btn ${mode === 'tablet' ? 'spec-preview__mode-btn--active' : ''}`}
            onClick={() => setMode('tablet')}
          >
            📱 Tablet
          </button>
          <button
            className={`spec-preview__mode-btn ${mode === 'mobile' ? 'spec-preview__mode-btn--active' : ''}`}
            onClick={() => setMode('mobile')}
          >
            📲 Mobile
          </button>
        </div>

        <div className="spec-preview__zoom">
          <button className="spec-preview__zoom-btn" onClick={handleZoomOut} title="Уменьшить">
            ◀
          </button>
          <span className="spec-preview__zoom-label">
            {isFullscreen ? 'Fullscreen' : `${zoom}%`}
          </span>
          <button className="spec-preview__zoom-btn" onClick={handleZoomIn} title="Увеличить">
            ▶
          </button>
          <button className="spec-preview__zoom-btn" onClick={handleReset} title="Сброс">
            ⟳
          </button>
          <button
            className={`spec-preview__zoom-btn ${isFullscreen ? 'spec-preview__zoom-btn--active' : ''}`}
            onClick={handleFullscreen}
            title="Полный экран"
          >
            ⛶
          </button>
        </div>
      </div>

      <div className="spec-preview__frame-wrap">
        {mockupUrl ? (
          <iframe
            ref={iframeRef}
            className="spec-preview__iframe"
            src={mockupUrl}
            title="Preview"
            style={iframeStyle}
          />
        ) : (
          <div className="spec-preview__empty">
            <p>Выберите экран для отображения макета</p>
          </div>
        )}
      </div>
    </div>
  );
}

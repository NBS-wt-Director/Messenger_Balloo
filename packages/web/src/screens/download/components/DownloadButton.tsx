// DownloadButton — кнопка скачивания с анимацией
// Тикет №57 — Download (узел 06)

import { useState } from 'react';

interface DownloadButtonProps {
  url: string;
  fileId?: string;
  label: string;
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  onDownload?: () => void;
}

export function DownloadButton({
  url,
  fileId,
  label,
  variant = 'primary',
  size = 'md',
  onDownload,
}: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloading(true);
    onDownload?.();

    // Записываем статистику (fire-and-forget)
    if (fileId) {
      import('@/services/api')
        .then(({ api }) => api.recordDownload(fileId).catch(() => {}))
        .catch(() => {});
    }

    // Инициируем скачивание
    window.location.href = url;

    setTimeout(() => setDownloading(false), 2000);
  };

  const classes = [
    'btn',
    variant === 'primary' ? 'btn--primary' : 'btn--secondary',
    size === 'lg' ? 'btn--lg' : '',
    downloading ? 'btn--loading' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <a
      href={url}
      onClick={handleClick}
      className={classes}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
    >
      {downloading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '⬇️'}
      {downloading ? 'Скачивание...' : label}
    </a>
  );
}

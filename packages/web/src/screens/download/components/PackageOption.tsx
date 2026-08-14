// PackageOption — вариант пакета (формат, размер, кнопка скачать, recommended badge)
// Тикет №57 — Download (узел 06)

import { DownloadButton } from './DownloadButton';

export interface PackageData {
  id?: string;
  format: string;
  arch?: string;
  label: string;
  url: string;
  size?: string | number;
  version?: string;
  checksum?: string;
  createdAt?: number;
  recommended?: boolean;
  icon?: string;
}

interface PackageOptionProps {
  pkg: PackageData;
  onSelect?: (pkg: PackageData) => void;
}

function formatSize(size?: string | number): string {
  if (!size) return '—';
  const bytes = typeof size === 'string' ? parseInt(size, 10) : size;
  if (isNaN(bytes) || bytes === 0) return '—';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} ГБ`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} МБ`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${bytes} Б`;
}

function formatDate(ts?: number): string {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PackageOption({ pkg, onSelect }: PackageOptionProps) {
  return (
    <div
      className="card"
      style={{
        padding: '16px',
        position: 'relative',
        borderColor: pkg.recommended ? 'var(--accent)' : undefined,
      }}
    >
      {pkg.recommended && (
        <span
          className="badge"
          style={{
            position: 'absolute',
            top: '-10px',
            right: '12px',
            background: 'var(--accent)',
            color: '#fff',
            padding: '2px 10px',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          ★ Рекомендуемый
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <span style={{ fontSize: '28px' }}>{pkg.icon || '📦'}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>{pkg.label}</div>
          <div className="text-xs text-muted">
            {pkg.arch ? `Архитектура: ${pkg.arch} · ` : ''}
            {formatSize(pkg.size)}
            {pkg.version ? ` · v${pkg.version}` : ''}
          </div>
        </div>
      </div>

      {pkg.createdAt && (
        <div className="text-xs text-muted" style={{ marginBottom: '8px' }}>
          Обновлено: {formatDate(pkg.createdAt)}
        </div>
      )}

      {pkg.checksum && (
        <div
          className="text-xs text-muted"
          style={{
            marginBottom: '10px',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}
        >
          SHA256: {pkg.checksum.length > 24 ? `${pkg.checksum.slice(0, 12)}...${pkg.checksum.slice(-8)}` : pkg.checksum}
        </div>
      )}

      <DownloadButton
        url={pkg.url}
        fileId={pkg.id}
        label={`Скачать ${pkg.format.toUpperCase()}`}
        variant={pkg.recommended ? 'primary' : 'secondary'}
        onDownload={() => onSelect?.(pkg)}
      />
    </div>
  );
}

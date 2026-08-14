// AutoDetectBanner — баннер с автоопределённой платформой
// Тикет №57 — Download (узел 06)

interface AutoDetectBannerProps {
  platform: string;
  platformLabel: string;
  onDownload?: () => void;
}

export function AutoDetectBanner({
  platform,
  platformLabel,
  onDownload,
}: AutoDetectBannerProps) {
  if (!platform) return null;

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '16px 24px',
        marginBottom: '24px',
        borderColor: 'var(--accent)',
        background: 'color-mix(in srgb, var(--accent) 8%, var(--bg-card))',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '32px' }}>
          {platform === 'win' ? '🪟' : platform === 'linux' ? '🐧' : platform === 'mac' ? '🍎' : platform === 'android' ? '🤖' : platform === 'ios' ? '🍎' : '🌐'}
        </span>
        <div>
          <div style={{ fontWeight: 600 }}>
            Мы определили вашу платформу: {platformLabel}
          </div>
          <div className="text-sm text-muted">
            Рекомендуемый пакет отмечен звёздочкой ниже
          </div>
        </div>
      </div>
      {onDownload && (
        <button className="btn btn--primary" onClick={onDownload}>
          ⬇️ Перейти к скачиванию
        </button>
      )}
    </div>
  );
}

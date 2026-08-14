// HistoryTimeline — компонент timeline для визуализации истории версий
// Тикет №56 — History: changelog (узел 05)

interface TimelineVersion {
  id: string;
  version: string;
  publishedAt: number;
  isLatest: boolean;
  title: string;
  icon: string;
  type: string;
  status: string;
  summary: string;
}

interface HistoryTimelineProps {
  versions: TimelineVersion[];
  onSelect?: (version: TimelineVersion) => void;
}

export function HistoryTimeline({ versions, onSelect }: HistoryTimelineProps) {
  if (versions.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-muted">Версий пока нет</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '32px' }}>
      {/* Вертикальная линия */}
      <div
        style={{
          position: 'absolute',
          left: '11px',
          top: '0',
          bottom: '0',
          width: '2px',
          background: 'var(--border-color)',
        }}
      />

      {versions.map((v, index) => {
        const isPlanned = v.status === 'planned';
        const dotColor = v.isLatest
          ? 'var(--accent)'
          : isPlanned
            ? 'var(--warning)'
            : 'var(--info)';

        return (
          <div
            key={v.id}
            style={{ position: 'relative', marginBottom: index === versions.length - 1 ? 0 : '24px' }}
          >
            {/* Точка на timeline */}
            <div
              style={{
                position: 'absolute',
                left: '-27px',
                top: '18px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: dotColor,
                border: '3px solid var(--bg-primary)',
                boxShadow: `0 0 0 2px ${dotColor}`,
              }}
            />

            <div
              className={`card mb-0 card--hover`}
              style={{
                cursor: 'pointer',
                ...(isPlanned
                  ? { borderStyle: 'dashed', borderColor: 'var(--border-strong)', opacity: 0.85 }
                  : {}),
              }}
              onClick={() => onSelect?.(v)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`chip ${v.isLatest ? 'chip--accent' : v.type === 'major' ? 'chip--info' : ''}`}
                  >
                    {v.version}
                  </span>
                  <span className="chip">
                    {v.type === 'major' ? 'Мажорная' : v.type === 'minor' ? 'Минорная' : 'Патч'}
                  </span>
                  {v.isLatest && <span className="chip chip--accent">Релиз</span>}
                  {isPlanned && (
                    <span
                      className="chip"
                      style={{ background: 'rgba(232,163,23,0.12)', color: 'var(--warning)', borderColor: 'var(--warning)' }}
                    >
                      📋 В планах
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted">
                  {v.publishedAt > 0
                    ? new Date(v.publishedAt * 1000).toLocaleDateString('ru-RU')
                    : v.summary?.includes('Q4')
                      ? 'Ожидается: Q4 2026'
                      : 'Ожидается'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '28px' }}>{v.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {v.title}
                  </div>
                  <div className="text-xs text-muted mt-2">{v.summary}</div>
                </div>
                <span className="text-muted">→</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

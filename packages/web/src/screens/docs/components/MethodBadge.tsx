// MethodBadge — цветной badge HTTP метода
// Тикет №58 — Docs: API документация

interface MethodBadgeProps {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'var(--info)',
  POST: 'var(--accent)',
  PUT: 'var(--warning)',
  PATCH: 'var(--warning)',
  DELETE: 'var(--danger)',
};

export function MethodBadge({ method }: MethodBadgeProps) {
  const color = METHOD_COLORS[method] || 'var(--text-muted)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '56px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: "'Fira Code', monospace",
        color: '#fff',
        background: color,
        letterSpacing: '0.5px',
      }}
    >
      {method}
    </span>
  );
}

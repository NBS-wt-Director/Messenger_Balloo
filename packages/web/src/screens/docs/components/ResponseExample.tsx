// ResponseExample — пример ответа с кодами ответов
// Тикет №58 — Docs: API документация

import { CodeBlock } from './CodeBlock';

interface ResponseCode {
  code: number;
  description: string;
}

interface ResponseExampleProps {
  example?: string;
  codes?: ResponseCode[];
}

const CODE_COLORS: Record<number, string> = {
  200: 'var(--accent)',
  201: 'var(--accent)',
  400: 'var(--danger)',
  401: 'var(--warning)',
  403: 'var(--warning)',
  404: 'var(--warning)',
  409: 'var(--warning)',
  413: 'var(--danger)',
  429: 'var(--danger)',
  500: 'var(--danger)',
};

export function ResponseExample({ example, codes }: ResponseExampleProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Коды ответов */}
      {codes && codes.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.5px',
            }}
          >
            Коды ответов
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {codes.map((c, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2px 10px',
                  fontSize: '12px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                }}
              >
                <span style={{ color: CODE_COLORS[c.code] || 'var(--text-muted)', fontWeight: 700 }}>
                  {c.code}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{c.description}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Пример ответа */}
      {example && <CodeBlock code={example} language="json" label="Response" />}
    </div>
  );
}

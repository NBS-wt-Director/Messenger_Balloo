// EndpointCard — карточка эндпоинта с запросом/ответом
// Тикет №58 — Docs: API документация

import { MethodBadge } from './MethodBadge';
import { CodeBlock } from './CodeBlock';
import { ParameterTable } from './ParameterTable';
import { ResponseExample } from './ResponseExample';

export interface EndpointData {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth?: boolean;
  params?: { name: string; type: string; required?: boolean; description: string }[];
  bodyExample?: string;
  responseExample?: string;
  responseCodes?: { code: number; description: string }[];
  curlExample?: string;
}

interface EndpointCardProps {
  endpoint: EndpointData;
}

export function EndpointCard({ endpoint }: EndpointCardProps) {
  const { method, path, description, auth, params, bodyExample, responseExample, responseCodes, curlExample } = endpoint;

  return (
    <div className="card mb-4" id={`${method}-${path}`.replace(/[^a-zA-Z0-9]/g, '-')}>
      {/* Заголовок: метод + путь + auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <MethodBadge method={method} />
        <code
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: '14px',
            color: 'var(--text-primary)',
          }}
        >
          {path}
        </code>
        {auth && (
          <span
            className="chip chip--accent"
            style={{ fontSize: '10px', padding: '2px 8px' }}
            title="Требуется JWT авторизация"
          >
            🔑 JWT
          </span>
        )}
      </div>

      {/* Описание */}
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>{description}</p>

      {/* Параметры */}
      {params && params.length > 0 && <ParameterTable params={params} title="Параметры запроса" />}

      {/* Пример запроса (body) */}
      {bodyExample && <CodeBlock code={bodyExample} language="json" label="Request Body" />}

      {/* curl пример */}
      {curlExample && (
        <div style={{ marginTop: '12px' }}>
          <CodeBlock code={curlExample} language="bash" label="curl" />
        </div>
      )}

      {/* Пример ответа + коды */}
      <div style={{ marginTop: '12px' }}>
        <ResponseExample example={responseExample} codes={responseCodes} />
      </div>
    </div>
  );
}

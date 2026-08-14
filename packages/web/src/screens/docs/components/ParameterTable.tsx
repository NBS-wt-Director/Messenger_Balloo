// ParameterTable — таблица параметров эндпоинта
// Тикет №58 — Docs: API документация

interface Parameter {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

interface ParameterTableProps {
  params: Parameter[];
  title?: string;
}

export function ParameterTable({ params, title = 'Параметры' }: ParameterTableProps) {
  if (!params || params.length === 0) return null;

  return (
    <div style={{ marginBottom: '16px' }}>
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
        {title}
      </div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Имя</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Тип</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Обяз.</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Описание</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr
              key={i}
              style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}
            >
              <td style={{ padding: '8px 12px', fontFamily: "'Fira Code', monospace", color: 'var(--info)' }}>
                {p.name}
              </td>
              <td style={{ padding: '8px 12px', fontFamily: "'Fira Code', monospace", color: 'var(--warning)' }}>
                {p.type}
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                {p.required ? (
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>✓</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                )}
              </td>
              <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

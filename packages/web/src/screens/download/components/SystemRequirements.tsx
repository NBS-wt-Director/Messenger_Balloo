// SystemRequirements — системные требования для платформы
// Тикет №57 — Download (узел 06)

export interface SystemRequirement {
  platform: string;
  os: string;
  ram: string;
  disk: string;
  extra?: string;
}

interface SystemRequirementsProps {
  requirements: SystemRequirement[];
  title?: string;
}

export function SystemRequirements({
  requirements,
  title = '⚙️ Системные требования',
}: SystemRequirementsProps) {
  return (
    <div className="card mb-6">
      <h3 className="section-title" style={{ marginBottom: '12px' }}>
        {title}
      </h3>
      <table className="table">
        <thead>
          <tr>
            <th>Платформа</th>
            <th>ОС</th>
            <th>ОЗУ</th>
            <th>Диск</th>
            {requirements.some((r) => r.extra) && <th>Доп.</th>}
          </tr>
        </thead>
        <tbody>
          {requirements.map((r, i) => (
            <tr key={i}>
              <td>{r.platform}</td>
              <td>{r.os}</td>
              <td>{r.ram}</td>
              <td>{r.disk}</td>
              {requirements.some((rr) => rr.extra) && <td>{r.extra || '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

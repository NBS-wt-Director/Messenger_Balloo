// SpecPanel — левая панель с описанием спецификации
// Тикет №59 — Specifity: спецификация

export interface SpecLinkedItem {
  type: 'api' | 'data' | 'comp' | 'screen';
  code: string;
  label: string;
}

export interface SpecTechnology {
  name: string;
}

export interface SpecData {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeIcon: string;
  title: string;
  description: string;
  mockupUrl: string;
  status: string;
  docMd: string | null;
  linked: SpecLinkedItem[];
  technologies: SpecTechnology[];
}

const TYPE_LABELS: Record<string, string> = {
  api: 'API',
  data: 'Data',
  comp: 'Comp',
  screen: 'Screen',
};

const TYPE_COLORS: Record<string, string> = {
  api: '#3b9eff',
  data: '#ffc107',
  comp: '#2db84d',
  screen: '#ce93d8',
};

interface SpecPanelProps {
  spec: SpecData | null;
  loading?: boolean;
}

export function SpecPanel({ spec, loading }: SpecPanelProps) {
  if (loading) {
    return (
      <div className="spec-panel spec-panel--loading">
        <div className="spec-panel__spinner" />
        <p>Загрузка спецификации…</p>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="spec-panel spec-panel--empty">
        <p>Выберите экран для просмотра спецификации</p>
      </div>
    );
  }

  return (
    <div className="spec-panel">
      <div className="spec-panel__header">
        <h2 className="spec-panel__title">{spec.title}</h2>
        <div className="spec-panel__id">
          ID: {spec.id} · узел {spec.nodeId} ({spec.nodeName})
        </div>
        <div className="spec-panel__status">
          <span className="spec-panel__status-badge">{spec.status}</span>
        </div>
      </div>

      <div className="spec-panel__desc">{spec.description}</div>

      {spec.linked.length > 0 && (
        <div className="spec-panel__section">
          <div className="spec-panel__section-title">🔗 Связанные объекты</div>
          <div className="spec-panel__linked-list">
            {spec.linked.map((item, idx) => (
              <div key={idx} className="spec-panel__linked-item">
                <span
                  className="spec-panel__linked-type"
                  style={{
                    background: `${TYPE_COLORS[item.type]}22`,
                    color: TYPE_COLORS[item.type],
                    borderColor: TYPE_COLORS[item.type],
                  }}
                >
                  {TYPE_LABELS[item.type]}
                </span>
                <code className="spec-panel__linked-code">{item.code}</code>
                <span className="spec-panel__linked-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {spec.technologies.length > 0 && (
        <div className="spec-panel__section">
          <div className="spec-panel__section-title">📋 Технологии</div>
          <div className="spec-panel__tech-list">
            {spec.technologies.map((tech, idx) => (
              <div key={idx} className="spec-panel__tech-item">
                {tech.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {spec.docMd && (
        <div className="spec-panel__section">
          <div className="spec-panel__section-title">📄 Документация</div>
          <div className="spec-panel__linked-item">
            <code className="spec-panel__linked-code">{spec.docMd}</code>
            <span className="spec-panel__linked-label">MD рядом с макетом</span>
          </div>
        </div>
      )}

      <div className="spec-panel__section">
        <div className="spec-panel__section-title">🎨 Макет</div>
        <div className="spec-panel__linked-item">
          <code className="spec-panel__linked-code">{spec.mockupUrl}</code>
          <span className="spec-panel__linked-label">HTML-макет</span>
        </div>
      </div>
    </div>
  );
}

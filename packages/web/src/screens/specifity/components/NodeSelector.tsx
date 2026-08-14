// NodeSelector — селектор узла (12 узлов)
// Тикет №59 — Specifity: спецификация

export interface SpecNodeOption {
  id: string;
  name: string;
  icon: string;
  domain: string;
  screenCount: number;
}

interface NodeSelectorProps {
  nodes: SpecNodeOption[];
  activeNodeId: string | null;
  onSelect: (nodeId: string) => void;
}

export function NodeSelector({ nodes, activeNodeId, onSelect }: NodeSelectorProps) {
  return (
    <div className="spec-node-selector">
      <div className="spec-node-selector__label">Узел</div>
      <div className="spec-node-selector__list">
        {nodes.map((node) => (
          <button
            key={node.id}
            className={`spec-node-selector__item ${
              activeNodeId === node.id ? 'spec-node-selector__item--active' : ''
            }`}
            onClick={() => onSelect(node.id)}
            title={node.domain}
          >
            <span className="spec-node-selector__icon">{node.icon}</span>
            <span className="spec-node-selector__name">{node.name}</span>
            <span className="spec-node-selector__count">{node.screenCount}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

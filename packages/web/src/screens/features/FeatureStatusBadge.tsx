// FeatureStatusBadge — бейдж статуса фич-реквеста
// Тикет №55 — Features: фич-реквесты (узел 04)

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

const statusMap: Record<string, { label: string; chipClass: string }> = {
  idea: { label: 'Идея', chipClass: '' },
  considering: { label: 'Рассматривается', chipClass: 'chip--warning' },
  in_progress: { label: 'В работе', chipClass: 'chip--info' },
  planned: { label: 'Запланировано', chipClass: 'chip--warning' },
  rejected: { label: 'Отклонено', chipClass: 'chip--danger' },
  done: { label: 'Готово', chipClass: 'chip--accent' },
};

export function FeatureStatusBadge({ status, size = 'sm' }: Props) {
  const config = statusMap[status] || { label: status, chipClass: '' };
  const fontSize = size === 'sm' ? '10px' : '11px';

  return (
    <span className={`chip ${config.chipClass}`} style={{ fontSize }}>
      {config.label}
    </span>
  );
}

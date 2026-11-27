// FeatureStatusBadge — бейдж статуса фич-реквеста
//
// U4 (тик. 1795683301): три статуса по требованиям владельца —
//   done        → «Реализовано» (протестировано)
//   in_progress → «В процессе»  (реализовано, но не протестировано)
//   planned     → «В плане»     + «волна N»
// Старые значения (idea/considering/rejected) сохранены для совместимости:
// пользовательские предложения приходят со статусом idea.

interface Props {
  status: string;
  /** Номер волны для статуса planned (U4). */
  wave?: number | null;
  size?: 'sm' | 'md';
}

const statusMap: Record<string, { label: string; chipClass: string }> = {
  done: { label: '✅ Реализовано', chipClass: 'chip--accent' },
  in_progress: { label: '🔄 В процессе', chipClass: 'chip--info' },
  planned: { label: '📌 В плане', chipClass: 'chip--warning' },
  // Совместимость со старыми/пользовательскими статусами
  idea: { label: '💡 Идея', chipClass: '' },
  considering: { label: 'Рассматривается', chipClass: 'chip--warning' },
  rejected: { label: 'Отклонено', chipClass: 'chip--danger' },
};

export function FeatureStatusBadge({ status, wave, size = 'sm' }: Props) {
  const config = statusMap[status] || { label: status, chipClass: '' };
  const fontSize = size === 'sm' ? '10px' : '11px';

  return (
    <>
      <span className={`chip ${config.chipClass}`} style={{ fontSize }}>
        {config.label}
      </span>
      {status === 'planned' && wave != null && (
        <span className="chip chip--warning" style={{ fontSize }} title="Запланированная волна реализации">
          волна {wave}
        </span>
      )}
    </>
  );
}

// PlatformCard — карточка платформы с иконкой и списком пакетов
// Тикет №57 — Download (узел 06)

import { PackageOption, type PackageData } from './PackageOption';

interface PlatformCardProps {
  icon: string;
  title: string;
  subtitle: string;
  packages: PackageData[];
  highlighted?: boolean;
  onSelect?: (pkg: PackageData) => void;
  children?: React.ReactNode;
}

export function PlatformCard({
  icon,
  title,
  subtitle,
  packages,
  highlighted,
  onSelect,
  children,
}: PlatformCardProps) {
  return (
    <div
      className="card card--hover"
      style={{
        flex: 1,
        minWidth: '280px',
        padding: '24px',
        borderColor: highlighted ? 'var(--accent)' : undefined,
        boxShadow: highlighted ? '0 0 0 2px var(--accent)' : undefined,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '48px' }}>{icon}</div>
        <h3 className="card__title mt-2">{title}</h3>
        <div className="text-sm text-muted">{subtitle}</div>
        {highlighted && (
          <span
            className="badge"
            style={{
              display: 'inline-block',
              marginTop: '8px',
              background: 'var(--accent)',
              color: '#fff',
              padding: '2px 10px',
              fontSize: '11px',
            }}
          >
            ✓ Ваша платформа
          </span>
        )}
      </div>

      {packages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {packages.map((pkg, i) => (
            <PackageOption key={i} pkg={pkg} onSelect={onSelect} />
          ))}
        </div>
      )}

      {children}
    </div>
  );
}

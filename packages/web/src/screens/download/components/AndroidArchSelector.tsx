// AndroidArchSelector — селектор архитектуры для Android APK
// Тикет №57 — Download (узел 06)

import type { PackageData } from './PackageOption';

interface AndroidArchSelectorProps {
  packages: PackageData[];
  selectedArch: string;
  onSelect: (arch: string) => void;
}

const ARCH_INFO: Record<string, { label: string; desc: string; icon: string }> = {
  universal: {
    label: 'Universal',
    desc: 'Подходит для всех устройств (~50 МБ)',
    icon: '🌍',
  },
  'arm64-v8a': {
    label: 'ARM64',
    desc: 'Samsung Galaxy S20+, Pixel 5+, Xiaomi 12+',
    icon: '📱',
  },
  'armeabi-v7a': {
    label: 'ARM32',
    desc: 'Старые телефоны, бюджетные модели',
    icon: '📲',
  },
  'x86_64': {
    label: 'x86_64',
    desc: 'Эмуляторы, Chromebook, планшеты на x86',
    icon: '💻',
  },
};

export function AndroidArchSelector({
  packages,
  selectedArch,
  onSelect,
}: AndroidArchSelectorProps) {
  // Доступные архитектуры из пакетов (только APK)
  const apkArches = packages
    .filter((p) => p.format === 'apk')
    .map((p) => p.arch || 'universal')
    .filter((v, i, a) => a.indexOf(v) === i);

  if (apkArches.length <= 1) return null;

  return (
    <div className="card" style={{ marginBottom: '12px', padding: '16px' }}>
      <div className="text-sm" style={{ fontWeight: 600, marginBottom: '10px' }}>
        🔍 Выберите архитектуру процессора:
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {apkArches.map((arch) => {
          const info = ARCH_INFO[arch] || { label: arch, desc: '', icon: '📦' };
          const active = selectedArch === arch;
          return (
            <button
              key={arch}
              onClick={() => onSelect(arch)}
              className={`btn ${active ? 'btn--primary' : 'btn--secondary'}`}
              style={{
                flex: '1',
                minWidth: '140px',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                padding: '10px 14px',
              }}
              title={info.desc}
            >
              <span style={{ fontSize: '18px' }}>{info.icon}</span>
              <span style={{ fontWeight: 600 }}>{info.label}</span>
              <span className="text-xs text-muted" style={{ fontWeight: 400 }}>
                {info.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

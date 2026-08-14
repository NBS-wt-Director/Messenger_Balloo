// FeatureFlagsScreen — управление feature flags в админ-панели
// Список флагов, toggle on/off, target version, описание

import { useState } from 'react';

// --- Types ---
interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  targetVersion: string;
  createdAt: number;
  updatedAt: number;
  category: string;
}

// --- Mock data ---
const MOCK_FLAGS: FeatureFlag[] = [
  {
    id: 'ff-001',
    name: 'new-chat-ui',
    description: 'Новый интерфейс чата с пузырьрами без скруглений и угловыми срезами',
    enabled: true,
    targetVersion: '1.1.0',
    createdAt: 1719724800000,
    updatedAt: 1720329600000,
    category: 'ui',
  },
  {
    id: 'ff-002',
    name: 'dark-mode-v2',
    description: 'Улучшенная тёмная тема с новыми CSS-переменными',
    enabled: true,
    targetVersion: '1.0.5',
    createdAt: 1718515200000,
    updatedAt: 1719120000000,
    category: 'ui',
  },
  {
    id: 'ff-003',
    name: 'end-to-end-encryption',
    description: 'Сквозное шифрование для приватных чатов (E2EE)',
    enabled: false,
    targetVersion: '1.2.0',
    createdAt: 1717305600000,
    updatedAt: 1717910400000,
    category: 'security',
  },
  {
    id: 'ff-004',
    name: 'voice-messages',
    description: 'Отправка и прослушивание голосовых сообщений',
    enabled: true,
    targetVersion: '1.0.0',
    createdAt: 1716096000000,
    updatedAt: 1716700800000,
    category: 'messaging',
  },
  {
    id: 'ff-005',
    name: 'ai-assistant',
    description: 'Встроенный AI-ассистент для ответов и рекомендаций',
    enabled: false,
    targetVersion: '1.3.0',
    createdAt: 1720934400000,
    updatedAt: 1721539200000,
    category: 'ai',
  },
  {
    id: 'ff-006',
    name: 'story-reactions',
    description: 'Реакции на истории (эмодзи)',
    enabled: true,
    targetVersion: '1.0.2',
    createdAt: 1715491200000,
    updatedAt: 1716096000000,
    category: 'stories',
  },
  {
    id: 'ff-007',
    name: 'group-video-calls',
    description: 'Видеозвонки в группах до 50 участников',
    enabled: false,
    targetVersion: '1.4.0',
    createdAt: 1722144000000,
    updatedAt: 1722748800000,
    category: 'messaging',
  },
  {
    id: 'ff-008',
    name: 'multi-language-support',
    description: 'Поддержка 20 языков (3 группы: русские, дружественные, остальные)',
    enabled: true,
    targetVersion: '1.0.0',
    createdAt: 1714886400000,
    updatedAt: 1715491200000,
    category: 'i18n',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  ui: 'UI',
  security: 'Безопасность',
  messaging: 'Сообщения',
  ai: 'AI',
  stories: 'Истории',
  i18n: 'Локализация',
};

const CATEGORY_COLORS: Record<string, string> = {
  ui: '#a855f7',
  security: 'var(--danger)',
  messaging: 'var(--info)',
  ai: '#ec4899',
  stories: 'var(--warning)',
  i18n: 'var(--accent)',
};

// --- Toggle Switch Component ---
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        background: checked ? 'var(--accent)' : 'var(--bg-tertiary)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s ease',
        padding: 0,
      }}
      aria-label={checked ? 'Выключить' : 'Включить'}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 24 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
}

// --- Confirm Modal ---
function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  confirmVariant = 'primary',
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger';
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{
          padding: 24,
          minWidth: 360,
          maxWidth: 440,
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            className="btn btn--tertiary btn--sm"
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className={`btn btn--${confirmVariant} btn--sm`}
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Screen ---
export function FeatureFlagsScreen() {
  const [flags, setFlags] = useState(MOCK_FLAGS);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    flagId: string | null;
    action: 'enable' | 'disable' | null;
  }>({ open: false, flagId: null, action: null });

  // Stats
  const enabledCount = flags.filter((f) => f.enabled).length;
  const disabledCount = flags.length - enabledCount;

  // Filter + search
  const filtered = flags.filter((f) => {
    const matchesCategory = filter === 'all' || f.category === filter;
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFlag = (id: string) => {
    const flag = flags.find((f) => f.id === id);
    if (!flag) return;
    setConfirmModal({ open: true, flagId: id, action: flag.enabled ? 'disable' : 'enable' });
  };

  const confirmToggle = () => {
    if (!confirmModal.flagId || !confirmModal.action) return;
    setFlags((prev) =>
      prev.map((f) =>
        f.id === confirmModal.flagId
          ? { ...f, enabled: confirmModal.action === 'enable', updatedAt: Date.now() }
          : f
      )
    );
    setConfirmModal({ open: false, flagId: null, action: null });
  };

  const categories = Array.from(new Set(flags.map((f) => f.category)));

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Feature Flags
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Управление флагами функций. Включённые флаги активны для всех пользователей.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: '14px 20px', flex: '1 1 140px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{enabledCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Включено
          </div>
        </div>
        <div className="card" style={{ padding: '14px 20px', flex: '1 1 140px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-muted)' }}>{disabledCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Отключено
          </div>
        </div>
        <div className="card" style={{ padding: '14px 20px', flex: '1 1 140px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--info)' }}>{flags.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Всего
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Поиск по названию или описанию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 250px',
            padding: '8px 14px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'var(--font-primary)',
            outline: 'none',
          }}
        />

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: 4,
              background: filter === 'all' ? 'var(--accent)' : 'var(--bg-secondary)',
              color: filter === 'all' ? '#fff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              transition: 'all 0.15s ease',
            }}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: 4,
                background: filter === cat ? CATEGORY_COLORS[cat] : 'var(--bg-secondary)',
                color: filter === cat ? '#fff' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-primary)',
                transition: 'all 0.15s ease',
              }}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Flags List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((flag) => (
          <div
            key={flag.id}
            className="card"
            style={{
              padding: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              borderLeft: `3px solid ${flag.enabled ? 'var(--accent)' : 'var(--text-muted)'}`,
              transition: 'all 0.2s ease',
            }}
          >
            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {flag.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: `${CATEGORY_COLORS[flag.category]}22`,
                    color: CATEGORY_COLORS[flag.category],
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {CATEGORY_LABELS[flag.category] || flag.category}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {flag.description}
              </p>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Версия: {flag.targetVersion} · Обновлено: {new Date(flag.updatedAt).toLocaleDateString('ru-RU')}
              </div>
            </div>

            {/* Status */}
            <span
              style={{
                fontSize: 11,
                padding: '3px 10px',
                borderRadius: 4,
                fontWeight: 600,
                background: flag.enabled ? 'rgba(45,184,77,0.15)' : 'rgba(239,68,68,0.12)',
                color: flag.enabled ? 'var(--accent)' : 'var(--danger)',
                whiteSpace: 'nowrap',
              }}
            >
              {flag.enabled ? 'ВКЛ' : 'ВЫКЛ'}
            </span>

            {/* Toggle */}
            <ToggleSwitch
              checked={flag.enabled}
              onChange={() => toggleFlag(flag.id)}
            />
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Ничего не найдено</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Попробуйте изменить фильтры или поисковый запрос
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={
          confirmModal.action === 'enable' ? 'Включить флаг?' : 'Отключить флаг?'
        }
        message={
          confirmModal.action === 'enable'
            ? 'Этот флаг будет активен для всех пользователей. Убедитесь, что функция протестирована.'
            : 'Этот флаг будет отключён. Функция станет недоступна для пользователей.'
        }
        onConfirm={confirmToggle}
        onCancel={() => setConfirmModal({ open: false, flagId: null, action: null })}
        confirmLabel={confirmModal.action === 'enable' ? 'Включить' : 'Отключить'}
        confirmVariant={confirmModal.action === 'disable' ? 'danger' : 'primary'}
      />
    </div>
  );
}

// VersionsScreen — управление версиями сервиса
// Список версий, publish new version, changelog editor

import { useState } from 'react';

// --- Types ---
interface ServiceVersion {
  id: string;
  version: string;
  changelog: string;
  publishedAt: number;
  isLatest: boolean;
  status: 'published' | 'draft' | 'archived';
  platform: string[];
  downloadCount: number;
}

// --- Mock data ---
const MOCK_VERSIONS: ServiceVersion[] = [
  {
    id: 'v-001',
    version: '1.0.0',
    changelog:
      '🎉 Первая публичная версия Balloo Messenger!\n\n✨ Новое:\n• Чаты и группы\n• Каналы с подпиской\n• Истории (stories)\n• Голосовые сообщения\n• Опросы и квизы\n• Блог и каналы\n• База знаний\n• Админ-панель\n• 20 языков\n• 3 темы оформления\n\n🐛 Исправлено:\n• Стабильность WebSocket\n• Производительность чатов\n• Корректная работа 2FA',
    publishedAt: 1719724800000,
    isLatest: true,
    status: 'published',
    platform: ['web', 'android', 'ios', 'desktop'],
    downloadCount: 15234,
  },
  {
    id: 'v-0.9.5',
    version: '0.9.5',
    changelog:
      '🧪 Бета-версия для тестирования\n\n✨ Новое:\n• Предварительный просмотр историй\n• Реакции на сообщения\n\n🐛 Исправлено:\n• Утечка памяти в WebSocket\n• Ошибка при загрузке аватаров',
    publishedAt: 1719120000000,
    isLatest: false,
    status: 'archived',
    platform: ['web', 'android'],
    downloadCount: 3421,
  },
  {
    id: 'v-0.9.0',
    version: '0.9.0',
    changelog:
      '🧪 Ранняя бета\n\n✨ Новое:\n• Базовые чаты\n• Регистрация и авторизация\n• Профили пользователей',
    publishedAt: 1718515200000,
    isLatest: false,
    status: 'archived',
    platform: ['web'],
    downloadCount: 892,
  },
  {
    id: 'v-1.1.0-draft',
    version: '1.1.0-draft',
    changelog:
      '🚧 Черновик следующей версии\n\n🔄 В разработке:\n• Видеозвонки\n• Шифрование E2EE\n• AI-ассистент\n• Новый дизайн чатов',
    publishedAt: 0,
    isLatest: false,
    status: 'draft',
    platform: [],
    downloadCount: 0,
  },
];

const STATUS_LABELS: Record<string, string> = {
  published: 'Опубликована',
  draft: 'Черновик',
  archived: 'Архив',
};

const STATUS_COLORS: Record<string, string> = {
  published: 'var(--accent)',
  draft: 'var(--warning)',
  archived: 'var(--text-muted)',
};

const PLATFORM_ICONS: Record<string, string> = {
  web: '🌐',
  android: '🤖',
  ios: '🍎',
  desktop: '🖥️',
};

// --- Changelog Editor Modal ---
function ChangelogEditor({
  open,
  version,
  initialValue,
  onSave,
  onClose,
}: {
  open: boolean;
  version: string;
  initialValue: string;
  onSave: (changelog: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initialValue);

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
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          padding: 24,
          minWidth: 480,
          maxWidth: 600,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
          Редактор changelog — v{version}
        </h3>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          style={{
            flex: 1,
            padding: 14,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'var(--font-primary)',
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            marginBottom: 16,
          }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn--tertiary btn--sm" style={{ fontFamily: 'var(--font-primary)' }}>
            Отмена
          </button>
          <button onClick={() => onSave(text)} className="btn btn--primary btn--sm" style={{ fontFamily: 'var(--font-primary)' }}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Publish New Version Modal ---
function PublishVersionModal({
  open,
  onClose,
  onPublish,
}: {
  open: boolean;
  onClose: () => void;
  onPublish: (version: string, changelog: string) => void;
}) {
  const [version, setVersion] = useState('1.1.0');
  const [changelog, setChangelog] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['web']);

  if (!open) return null;

  const handlePublish = () => {
    if (!version || !changelog.trim()) return;
    onPublish(version, changelog);
    setVersion('1.1.0');
    setChangelog('');
    setPlatforms(['web']);
  };

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

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
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          padding: 24,
          minWidth: 440,
          maxWidth: 520,
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
          Опубликовать новую версию
        </h3>

        {/* Version */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Номер версии
          </label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.1.0"
            style={{
              width: '100%',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: 'monospace',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Changelog */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Changelog
          </label>
          <textarea
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            placeholder="✨ Новое:\n🐛 Исправлено:\n⚡ Улучшено:"
            rows={6}
            style={{
              width: '100%',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-primary)',
              lineHeight: 1.5,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Platforms */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 8 }}>
            Платформы
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['web', 'android', 'ios', 'desktop'].map((p) => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  border: '1px solid',
                  borderColor: platforms.includes(p) ? 'var(--accent)' : 'var(--border-color)',
                  borderRadius: 4,
                  background: platforms.includes(p) ? 'rgba(45,184,77,0.12)' : 'var(--bg-secondary)',
                  color: platforms.includes(p) ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-primary)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{PLATFORM_ICONS[p]}</span>
                <span>{p}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn--tertiary btn--sm" style={{ fontFamily: 'var(--font-primary)' }}>
            Отмена
          </button>
          <button
            onClick={handlePublish}
            disabled={!version || !changelog.trim()}
            className="btn btn--primary btn--sm"
            style={{
              fontFamily: 'var(--font-primary)',
              opacity: !version || !changelog.trim() ? 0.5 : 1,
            }}
          >
            Опубликовать
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Screen ---
export function VersionsScreen() {
  const [versions, setVersions] = useState(MOCK_VERSIONS);
  const [filter, setFilter] = useState<string>('all');
  const [editModal, setEditModal] = useState<{ open: boolean; versionId: string | null }>({
    open: false,
    versionId: null,
  });
  const [publishModal, setPublishModal] = useState(false);

  const filtered = versions.filter((v) => filter === 'all' || v.status === filter);

  const handleEditChangelog = (versionId: string) => {
    setEditModal({ open: true, versionId });
  };

  const handleSaveChangelog = (newChangelog: string) => {
    if (!editModal.versionId) return;
    setVersions((prev) =>
      prev.map((v) => (v.id === editModal.versionId ? { ...v, changelog: newChangelog } : v))
    );
    setEditModal({ open: false, versionId: null });
  };

  const handlePublish = (newVersion: string, newChangelog: string) => {
    const newVer: ServiceVersion = {
      id: `v-${Date.now()}`,
      version: newVersion,
      changelog: newChangelog,
      publishedAt: Date.now(),
      isLatest: true,
      status: 'published',
      platform: ['web'],
      downloadCount: 0,
    };
    // Mark all others as not latest
    setVersions((prev) => [newVer, ...prev.map((v) => ({ ...v, isLatest: false }))]);
    setPublishModal(false);
  };

  const activeEditVersion = editModal.versionId
    ? versions.find((v) => v.id === editModal.versionId)
    : null;

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Версии сервиса
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            История версий, changelog и управление публикациями
          </p>
        </div>
        <button
          onClick={() => setPublishModal(true)}
          className="btn btn--primary"
          style={{ fontFamily: 'var(--font-primary)' }}
        >
          ✨ Опубликовать версию
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          { key: 'all', label: 'Все' },
          { key: 'published', label: 'Опубликованы' },
          { key: 'draft', label: 'Черновики' },
          { key: 'archived', label: 'Архив' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: 4,
              background: filter === f.key ? 'var(--accent)' : 'var(--bg-secondary)',
              color: filter === f.key ? '#fff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              transition: 'all 0.15s ease',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Versions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map((v) => (
          <div
            key={v.id}
            className="card"
            style={{
              padding: 20,
              borderLeft: `3px solid ${v.isLatest ? 'var(--accent)' : v.status === 'draft' ? 'var(--warning)' : 'var(--border-color)'}`,
            }}
          >
            {/* Version header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  v{v.version}
                </span>
                {v.isLatest && (
                  <span
                    className="chip"
                    style={{
                      background: 'rgba(45,184,77,0.15)',
                      color: 'var(--accent)',
                      fontWeight: 700,
                    }}
                  >
                    LATEST
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 10px',
                    borderRadius: 4,
                    background: `${STATUS_COLORS[v.status]}22`,
                    color: STATUS_COLORS[v.status],
                    fontWeight: 600,
                  }}
                >
                  {STATUS_LABELS[v.status]}
                </span>
              </div>

              <button
                onClick={() => handleEditChangelog(v.id)}
                className="btn btn--tertiary btn--sm"
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                ✏️ Редактировать
              </button>
            </div>

            {/* Platforms */}
            {v.platform.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {v.platform.map((p) => (
                  <span
                    key={p}
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {PLATFORM_ICONS[p]} {p}
                  </span>
                ))}
              </div>
            )}

            {/* Changelog preview */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 6,
                padding: 12,
                marginBottom: 12,
                maxHeight: 120,
                overflow: 'auto',
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-primary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {v.changelog || '—'}
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              <span>
                {v.publishedAt
                  ? `Опубликована: ${new Date(v.publishedAt).toLocaleDateString('ru-RU')} ${new Date(v.publishedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Черновик (не опубликована)'}
              </span>
              {v.downloadCount > 0 && (
                <span>
                  📥 {v.downloadCount.toLocaleString('ru-RU')} скачиваний
                </span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Нет версий в этой категории</div>
          </div>
        )}
      </div>

      {/* Edit Changelog Modal */}
      <ChangelogEditor
        open={editModal.open}
        version={activeEditVersion?.version || ''}
        initialValue={activeEditVersion?.changelog || ''}
        onSave={handleSaveChangelog}
        onClose={() => setEditModal({ open: false, versionId: null })}
      />

      {/* Publish Modal */}
      <PublishVersionModal
        open={publishModal}
        onClose={() => setPublishModal(false)}
        onPublish={handlePublish}
      />
    </div>
  );
}

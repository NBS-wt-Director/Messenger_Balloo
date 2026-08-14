// DownloadsScreen — управление файлами загрузок в админ-панели
// CRUD файлов для download.balloo.su: список, загрузка, удаление, статистика

import { useState } from 'react';

// --- Types ---
interface DownloadFile {
  id: string;
  name: string;
  platform: 'windows' | 'linux' | 'macos' | 'android' | 'ios';
  format: 'exe' | 'msi' | 'portable' | 'appimage' | 'deb' | 'rpm' | 'tar.gz' | 'dmg' | 'zip' | 'apk' | 'aab' | 'ipa';
  version: string;
  size: number; // bytes
  url: string;
  checksum: string;
  uploadedAt: number;
  isRecommended: boolean;
  downloads: number;
}

// --- Mock data ---
const MOCK_FILES: DownloadFile[] = [
  // Windows
  {
    id: 'dl-001',
    name: 'Balloo Setup 1.0.0.exe',
    platform: 'windows',
    format: 'exe',
    version: '1.0.0',
    size: 89456640, // ~85MB
    url: 'https://cdn.balloo.su/releases/windows/Balloo-1.0.0.exe',
    checksum: 'sha256:a1b2c3d4e5f6...',
    uploadedAt: 1719724800000,
    isRecommended: true,
    downloads: 5234,
  },
  {
    id: 'dl-002',
    name: 'Balloo 1.0.0.msi',
    platform: 'windows',
    format: 'msi',
    version: '1.0.0',
    size: 92160000, // ~88MB
    url: 'https://cdn.balloo.su/releases/windows/Balloo-1.0.0.msi',
    checksum: 'sha256:b2c3d4e5f6a7...',
    uploadedAt: 1719724800000,
    isRecommended: false,
    downloads: 342,
  },
  {
    id: 'dl-003',
    name: 'Balloo 1.0.0-portable.exe',
    platform: 'windows',
    format: 'portable',
    version: '1.0.0',
    size: 94371840, // ~90MB
    url: 'https://cdn.balloo.su/releases/windows/Balloo-1.0.0-portable.exe',
    checksum: 'sha256:c3d4e5f6a7b8...',
    uploadedAt: 1719724800000,
    isRecommended: false,
    downloads: 156,
  },
  // Linux
  {
    id: 'dl-004',
    name: 'Balloo-1.0.0.AppImage',
    platform: 'linux',
    format: 'appimage',
    version: '1.0.0',
    size: 98566144, // ~94MB
    url: 'https://cdn.balloo.su/releases/linux/Balloo-1.0.0.AppImage',
    checksum: 'sha256:d4e5f6a7b8c9...',
    uploadedAt: 1719724800000,
    isRecommended: true,
    downloads: 3456,
  },
  {
    id: 'dl-005',
    name: 'balloo_1.0.0_amd64.deb',
    platform: 'linux',
    format: 'deb',
    version: '1.0.0',
    size: 96467968, // ~92MB
    url: 'https://cdn.balloo.su/releases/linux/balloo_1.0.0_amd64.deb',
    checksum: 'sha256:e5f6a7b8c9d0...',
    uploadedAt: 1719724800000,
    isRecommended: false,
    downloads: 1234,
  },
  {
    id: 'dl-006',
    name: 'balloo-1.0.0.x86_64.rpm',
    platform: 'linux',
    format: 'rpm',
    version: '1.0.0',
    size: 95418900, // ~91MB
    url: 'https://cdn.balloo.su/releases/linux/balloo-1.0.0.x86_64.rpm',
    checksum: 'sha256:f6a7b8c9d0e1...',
    uploadedAt: 1719724800000,
    isRecommended: false,
    downloads: 567,
  },
  {
    id: 'dl-007',
    name: 'balloo-1.0.0.tar.gz',
    platform: 'linux',
    format: 'tar.gz',
    version: '1.0.0',
    size: 100664832, // ~96MB
    url: 'https://cdn.balloo.su/releases/linux/balloo-1.0.0.tar.gz',
    checksum: 'sha256:a7b8c9d0e1f2...',
    uploadedAt: 1719724800000,
    isRecommended: false,
    downloads: 89,
  },
  // macOS
  {
    id: 'dl-008',
    name: 'Balloo-1.0.0.dmg',
    platform: 'macos',
    format: 'dmg',
    version: '1.0.0',
    size: 104857600, // 100MB
    url: 'https://cdn.balloo.su/releases/macos/Balloo-1.0.0.dmg',
    checksum: 'sha256:b8c9d0e1f2a3...',
    uploadedAt: 1719724800000,
    isRecommended: true,
    downloads: 4567,
  },
  {
    id: 'dl-009',
    name: 'Balloo-1.0.0-mac.zip',
    platform: 'macos',
    format: 'zip',
    version: '1.0.0',
    size: 110100480, // ~105MB
    url: 'https://cdn.balloo.su/releases/macos/Balloo-1.0.0-mac.zip',
    checksum: 'sha256:c9d0e1f2a3b4...',
    uploadedAt: 1719724800000,
    isRecommended: false,
    downloads: 234,
  },
  // Android
  {
    id: 'dl-010',
    name: 'Balloo Universal.apk',
    platform: 'android',
    format: 'apk',
    version: '1.0.0',
    size: 52428800, // 50MB
    url: 'https://cdn.balloo.su/releases/android/Balloo-universal.apk',
    checksum: 'sha256:d0e1f2a3b4c5...',
    uploadedAt: 1719724800000,
    isRecommended: true,
    downloads: 8901,
  },
  {
    id: 'dl-011',
    name: 'Balloo ARM64.apk',
    platform: 'android',
    format: 'apk',
    version: '1.0.0',
    size: 36700160, // 35MB
    url: 'https://cdn.balloo.su/releases/android/Balloo-arm64.apk',
    checksum: 'sha256:e1f2a3b4c5d6...',
    uploadedAt: 1719724800000,
    isRecommended: false,
    downloads: 5678,
  },
  {
    id: 'dl-012',
    name: 'Balloo ARM32.apk',
    platform: 'android',
    format: 'apk',
    version: '1.0.0',
    size: 31457280, // 30MB
    url: 'https://cdn.balloo.su/releases/android/Balloo-arm32.apk',
    checksum: 'sha256:f2a3b4c5d6e7...',
    uploadedAt: 1719724800000,
    isRecommended: false,
    downloads: 2345,
  },
  {
    id: 'dl-013',
    name: 'Balloo AAB',
    platform: 'android',
    format: 'aab',
    version: '1.0.0',
    size: 41943040, // 40MB
    url: 'https://cdn.balloo.su/releases/android/Balloo.aab',
    checksum: 'sha256:a3b4c5d6e7f8...',
    uploadedAt: 1719724800000,
    isRecommended: false,
    downloads: 12,
  },
];

const PLATFORM_ICONS: Record<string, string> = {
  windows: '🪟',
  linux: '🐧',
  macos: '🍎',
  android: '🤖',
  ios: '📱',
};

const PLATFORM_NAMES: Record<string, string> = {
  windows: 'Windows',
  linux: 'Linux',
  macos: 'macOS',
  android: 'Android',
  ios: 'iOS',
};

const FORMAT_ICONS: Record<string, string> = {
  exe: '📦',
  msi: '📦',
  portable: '📂',
  appimage: '🐧',
  deb: '📦',
  rpm: '📦',
  'tar.gz': '📦',
  dmg: '💿',
  zip: '📦',
  apk: '🤖',
  aab: '🤖',
  ipa: '📱',
};

const FORMAT_LABELS: Record<string, string> = {
  exe: 'NSIS Installer',
  msi: 'MSI Installer',
  portable: 'Portable',
  appimage: 'AppImage',
  deb: 'Debian/Ubuntu',
  rpm: 'Fedora/RHEL',
  'tar.gz': 'Portable tar.gz',
  dmg: 'DMG Installer',
  zip: 'Portable zip',
  apk: 'APK',
  aab: 'App Bundle',
  ipa: 'IPA',
};

// --- Upload Modal ---
function UploadFileModal({
  open,
  onClose,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (data: Omit<DownloadFile, 'id' | 'downloads' | 'checksum'>) => void;
}) {
  const [platform, setPlatform] = useState<'windows' | 'linux' | 'macos' | 'android' | 'ios'>('windows');
  const [format, setFormat] = useState<string>('exe');
  const [version, setVersion] = useState('1.0.0');
  const [url, setUrl] = useState('');
  const [size, setSize] = useState('');
  const [isRecommended, setIsRecommended] = useState(false);

  if (!open) return null;

  const handleSubmit = () => {
    if (!version || !url || !size) return;
    onUpload({
      name: `Balloo ${version}.${format}`,
      platform,
      format: format as DownloadFile['format'],
      version,
      url,
      size: parseInt(size, 10) || 0,
      isRecommended,
      uploadedAt: Date.now(),
    });
    setVersion('1.0.0');
    setUrl('');
    setSize('');
    setIsRecommended(false);
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
          minWidth: 480,
          maxWidth: 600,
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
          Загрузить новый файл
        </h3>

        {/* Platform */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Платформа
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as DownloadFile['platform'])}
            style={{
              width: '100%',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-primary)',
              cursor: 'pointer',
            }}
          >
            <option value="windows">🪟 Windows</option>
            <option value="linux">🐧 Linux</option>
            <option value="macos">🍎 macOS</option>
            <option value="android">🤖 Android</option>
            <option value="ios">📱 iOS</option>
          </select>
        </div>

        {/* Format */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Формат
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-primary)',
              cursor: 'pointer',
            }}
          >
            {platform === 'windows' && (
              <>
                <option value="exe">.exe (NSIS Installer)</option>
                <option value="msi">.msi (MSI Installer)</option>
                <option value="portable">.exe (Portable)</option>
              </>
            )}
            {platform === 'linux' && (
              <>
                <option value="appimage">.AppImage</option>
                <option value="deb">.deb (Debian/Ubuntu)</option>
                <option value="rpm">.rpm (Fedora/RHEL)</option>
                <option value="tar.gz">.tar.gz (Portable)</option>
              </>
            )}
            {platform === 'macos' && (
              <>
                <option value="dmg">.dmg (Installer)</option>
                <option value="zip">.zip (Portable)</option>
              </>
            )}
            {platform === 'android' && (
              <>
                <option value="apk">.apk (Universal)</option>
                <option value="aab">.aab (App Bundle)</option>
              </>
            )}
            {platform === 'ios' && (
              <option value="ipa">.ipa</option>
            )}
          </select>
        </div>

        {/* Version */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Версия
          </label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.0"
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

        {/* URL */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            URL файла
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://cdn.balloo.su/releases/..."
            style={{
              width: '100%',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-primary)',
            }}
          />
        </div>

        {/* Size */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Размер (байты)
          </label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="104857600"
            style={{
              width: '100%',
              padding: '8px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'monospace',
            }}
          />
        </div>

        {/* Recommended */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isRecommended}
              onChange={(e) => setIsRecommended(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Рекомендуемый пакет для этой платформы</span>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn btn--tertiary btn--sm"
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!version || !url || !size}
            className="btn btn--primary btn--sm"
            style={{
              fontFamily: 'var(--font-primary)',
              opacity: !version || !url || !size ? 0.5 : 1,
            }}
          >
            Загрузить
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Delete Confirmation Modal ---
function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  name,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  name: string;
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
      onClick={onClose}
    >
      <div
        className="card"
        style={{ padding: 24, minWidth: 360, animation: 'fadeIn 0.2s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          Удалить файл?
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
          Вы уверены, что хотите удалить файл «{name}»? Это действие нельзя отменить.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn--tertiary btn--sm" style={{ fontFamily: 'var(--font-primary)' }}>
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="btn btn--danger btn--sm"
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Format Badge ---
function FormatBadge({ format }: { format: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: '2px 10px',
        borderRadius: 4,
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        fontFamily: 'monospace',
        fontWeight: 600,
      }}
    >
      .{format}
    </span>
  );
}

// --- Size formatter ---
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// --- Main Screen ---
export function DownloadsScreen() {
  const [files, setFiles] = useState(MOCK_FILES);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [uploadModal, setUploadModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; file: DownloadFile | null }>({
    open: false,
    file: null,
  });

  const filtered = filterPlatform === 'all' ? files : files.filter((f) => f.platform === filterPlatform);

  const platforms = ['all', 'windows', 'linux', 'macos', 'android', 'ios'];

  const handleUpload = (data: Omit<DownloadFile, 'id' | 'downloads' | 'checksum'>) => {
    const newFile: DownloadFile = {
      ...data,
      id: `dl-${Date.now()}`,
      downloads: 0,
      checksum: `sha256:generated_${Date.now()}`,
    };
    setFiles((prev) => [newFile, ...prev]);
    setUploadModal(false);
  };

  const handleDelete = () => {
    if (!deleteModal.file) return;
    setFiles((prev) => prev.filter((f) => f.id !== deleteModal.file!.id));
    setDeleteModal({ open: false, file: null });
  };

  // Group files by platform for stats
  const groupedByPlatform: Record<string, DownloadFile[]> = {};
  files.forEach((f) => {
    if (!groupedByPlatform[f.platform]) groupedByPlatform[f.platform] = [];
    groupedByPlatform[f.platform].push(f);
  });

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalDownloads = files.reduce((sum, f) => sum + f.downloads, 0);

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            📁 Файлы загрузок
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Управление файлами для download.balloo.su
          </p>
        </div>
        <button
          onClick={() => setUploadModal(true)}
          className="btn btn--primary"
          style={{ fontFamily: 'var(--font-primary)' }}
        >
          + Загрузить файл
        </button>
      </div>

      {/* Warning */}
      <div className="card mb-4" style={{ borderColor: 'var(--warning)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          ⚠ <strong style={{ color: 'var(--text-primary)' }}>Только статистика.</strong> Содержимое файлов не читается администраторами. Чаты не читаются — только статистика.
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Всего файлов</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{files.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatBytes(totalSize)} общий размер
          </div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Скачиваний всего</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--info)' }}>
            {totalDownloads.toLocaleString('ru-RU')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            across {platforms.length - 1} платформ
          </div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Платформ</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)' }}>
            {Object.keys(groupedByPlatform).length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Windows / Linux / macOS / Android / iOS
          </div>
        </div>
      </div>

      {/* MinIO stats */}
      <div className="card mb-4">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
          🗄 Хранилище (MinIO)
        </h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>MinIO — всего</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>1.2 TB</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>из 2 TB • 60%</div>
            <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2, marginTop: 6 }}>
              <div style={{ height: 4, width: '60%', background: 'var(--accent)', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Yandex Disk (пользователи)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--info)' }}>4.5 TB</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>234 подключённых дисков</div>
          </div>
        </div>

        {/* Buckets */}
        <table className="table" style={{ minWidth: 500 }}>
          <thead>
            <tr>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Bucket</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Назначение</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Размер</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Заполненность</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)' }}>avatars</td>
              <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>Аватарки пользователей</td>
              <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>2.4 GB</td>
              <td style={{ padding: '10px 12px' }}>
                <span className="chip chip--accent">12%</span>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)' }}>releases</td>
              <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>Файлы загрузок</td>
              <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>856 MB</td>
              <td style={{ padding: '10px 12px' }}>
                <span className="chip chip--accent">8%</span>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)' }}>backups</td>
              <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>Резервные копии БД (3 дня)</td>
              <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>1.1 TB</td>
              <td style={{ padding: '10px 12px' }}>
                <span className="chip chip--warning">55%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Platform filter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {platforms.map((p) => (
          <button
            key={p}
            onClick={() => setFilterPlatform(p)}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: 4,
              background: filterPlatform === p ? 'var(--accent)' : 'var(--bg-secondary)',
              color: filterPlatform === p ? '#fff' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {p !== 'all' && <span>{PLATFORM_ICONS[p]}</span>}
            {p === 'all' ? 'Все платформы' : PLATFORM_NAMES[p]}
          </button>
        ))}
      </div>

      {/* Files list */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Файл</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Платформа</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Версия</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Размер</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Скачиваний</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Рекомендуемый</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr
                  key={f.id}
                  className="table__row"
                  style={{ transition: 'background 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{FORMAT_ICONS[f.format]}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {f.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {f.checksum}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{PLATFORM_ICONS[f.platform]}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {PLATFORM_NAMES[f.platform]}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {f.version}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {formatBytes(f.size)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      📥 {f.downloads.toLocaleString('ru-RU')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {f.isRecommended && (
                      <span
                        className="chip"
                        style={{
                          background: 'rgba(45,184,77,0.15)',
                          color: 'var(--accent)',
                          fontWeight: 700,
                        }}
                      >
                        ⭐
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <a
                        href={f.url}
                        download
                        className="btn btn--primary btn--sm"
                        style={{
                          fontFamily: 'var(--font-primary)',
                          padding: '4px 10px',
                          textDecoration: 'none',
                        }}
                      >
                        ⬇️
                      </a>
                      <button
                        onClick={() => setDeleteModal({ open: true, file: f })}
                        className="btn btn--danger btn--sm"
                        style={{ fontFamily: 'var(--font-primary)', padding: '4px 10px' }}
                        title="Удалить"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📁</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Нет файлов для выбранной платформы</div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadFileModal
        open={uploadModal}
        onClose={() => setUploadModal(false)}
        onUpload={handleUpload}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, file: null })}
        onConfirm={handleDelete}
        name={deleteModal.file?.name || ''}
      />
    </div>
  );
}

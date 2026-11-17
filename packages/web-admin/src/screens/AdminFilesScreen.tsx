// AdminFilesScreen — статистика файлов (MinIO + Yandex Disk)
// Макет: mockups/admin-balloo-su/files.html
// Только статистика — содержимое файлов не читается администраторами.

export function AdminFilesScreen() {
  const buckets = [
    { name: 'avatars', purpose: 'Аватарки пользователей', size: '2.4 GB', files: '12 345', pct: '12%', pctClass: 'chip--accent' },
    { name: 'group-media', purpose: 'Медиа групп (аватарки, обложки)', size: '5.1 GB', files: '8 234', pct: '25%', pctClass: 'chip--accent' },
    { name: 'public-media', purpose: 'Публичные медиа', size: '15.6 GB', files: '3 456', pct: '78%', pctClass: 'chip--warning' },
    { name: 'backups', purpose: 'Резервные копии БД (3 дня)', size: '1.1 TB', files: '9', pct: '55%', pctClass: 'chip--warning' },
  ];

  const fileTypes = [
    { icon: '🖼', name: 'Изображения', count: '34 567', pct: '38.6%' },
    { icon: '🎬', name: 'Видео', count: '12 345', pct: '13.8%' },
    { icon: '🎤', name: 'Аудио / Голосовые', count: '23 456', pct: '26.2%' },
    { icon: '📄', name: 'Документы', count: '8 901', pct: '9.9%' },
    { icon: '📦', name: 'Прочее', count: '10 163', pct: '11.5%' },
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">Файлы (статистика)</h1>

      <div className="card mb-4" style={{ borderColor: 'var(--warning)' }}>
        <p className="text-sm text-secondary">
          ⚠ <strong style={{ color: 'var(--text-primary)' }}>Только статистика.</strong> Содержимое файлов не читается администраторами. Чаты не читаются — только статистика.
        </p>
      </div>

      {/* Summary cards */}
      <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
        <div className="card flex-1" style={{ minWidth: 180 }}>
          <div className="text-xs text-muted">MinIO — всего</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>1.2 TB</div>
          <div className="text-xs text-secondary">из 2 TB • 60%</div>
        </div>
        <div className="card flex-1" style={{ minWidth: 180 }}>
          <div className="text-xs text-muted">Yandex Disk (пользователи)</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--info)' }}>4.5 TB</div>
          <div className="text-xs text-secondary">234 подключённых дисков</div>
        </div>
        <div className="card flex-1" style={{ minWidth: 180 }}>
          <div className="text-xs text-muted">Файлов всего</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)' }}>89 432</div>
          <div className="text-xs text-secondary">+1 234 за неделю</div>
        </div>
      </div>

      {/* Buckets */}
      <div className="card mb-4">
        <h3 className="card__title mb-4">Buckets (MinIO)</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Bucket</th>
              <th>Назначение</th>
              <th>Размер</th>
              <th>Файлов</th>
              <th>Заполненность</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((b) => (
              <tr key={b.name}>
                <td><code>{b.name}</code></td>
                <td>{b.purpose}</td>
                <td>{b.size}</td>
                <td>{b.files}</td>
                <td><span className={`chip ${b.pctClass}`}>{b.pct}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* File types */}
      <div className="card">
        <h3 className="card__title mb-4">Статистика по типам файлов</h3>
        {fileTypes.map((ft) => (
          <div key={ft.name} className="list__item" style={{ border: 'none' }}>
            <span style={{ width: 36, textAlign: 'center' }}>{ft.icon}</span>
            <span className="flex-1">{ft.name}</span>
            <span className="font-bold">{ft.count}</span>
            <span className="text-xs text-muted">{ft.pct}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

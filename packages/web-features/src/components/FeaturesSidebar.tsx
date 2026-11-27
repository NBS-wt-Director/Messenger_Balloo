// FeaturesSidebar — левая панель раздела «Фич-реквесты» (features.balloo.su).
//
// U8 (тик. 1795683301): одна и та же навигация раздела на всех его экранах.
// Используется и списком фич, и формой создания — верхней дублирующей панели нет.
//
// U4: статусы приведены к трём состояниям владельца —
//   done «Реализовано», in_progress «В процессе», planned «В плане».

import type { ReactNode } from 'react';

export type FeatureStatusKey = 'all' | 'done' | 'in_progress' | 'planned' | 'idea';
export type FeatureSortKey = 'votes' | 'comments' | 'date';

export const STATUS_SIDEBAR: Array<{ key: FeatureStatusKey; label: string }> = [
  { key: 'all', label: '📋 Все фичи' },
  { key: 'done', label: '✅ Реализовано' },
  { key: 'in_progress', label: '🔄 В процессе' },
  { key: 'planned', label: '📌 В плане' },
  { key: 'idea', label: '💡 Идеи' },
];

export const SORT_OPTIONS: Array<{ key: FeatureSortKey; label: string }> = [
  { key: 'votes', label: '🏆 Топ голосов' },
  { key: 'comments', label: '🔥 Обсуждаемые' },
  { key: 'date', label: '⏱ Свежие' },
];

interface Props {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  activeStatus: FeatureStatusKey;
  onStatusChange: (status: FeatureStatusKey) => void;
  sortBy: FeatureSortKey;
  onSortChange: (sort: FeatureSortKey) => void;
  /** Счётчики по статусам из GET /api/features/stats */
  counts?: Record<string, number>;
  /** Показывать блок статусов и сортировки (на форме создания они не нужны) */
  showFilters?: boolean;
  /** Дополнительный блок под навигацией (например, кнопка «Предложить») */
  footer?: ReactNode;
}

export function FeaturesSidebar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  activeStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  counts = {},
  showFilters = true,
  footer,
}: Props) {
  return (
    <div className="sidebar sidebar--narrow">
      <div className="sidebar__search">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit?.();
          }}
        >
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Поиск фич..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </form>
      </div>

      <div className="list">
        {showFilters &&
          STATUS_SIDEBAR.map((item) => (
            <div
              key={item.key}
              className={`list__item ${activeStatus === item.key ? 'list__item--active' : ''}`}
              onClick={() => onStatusChange(item.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onStatusChange(item.key);
              }}
              style={{ cursor: 'pointer' }}
            >
              {item.label}
              {item.key !== 'all' && (
                <span className="badge" style={{ marginLeft: 'auto' }}>
                  {counts[item.key] || 0}
                </span>
              )}
            </div>
          ))}

        {showFilters && (
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 8, paddingTop: 12 }}>
            {SORT_OPTIONS.map((sort) => (
              <div
                key={sort.key}
                className={`list__item ${sortBy === sort.key ? 'list__item--active' : ''}`}
                onClick={() => onSortChange(sort.key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSortChange(sort.key);
                }}
                style={{ cursor: 'pointer' }}
              >
                {sort.label}
              </div>
            ))}
          </div>
        )}

        {footer && (
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 8, paddingTop: 12 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// BlogTopBar — топбар для корпоративного блога (blog.balloo.su)
// Тикет №60 — Blog: корпоративный блог

import { useNavigate } from 'react-router-dom';

interface BlogTopBarProps {
  title?: string;
  showSearch?: boolean;
}

export function BlogTopBar({ title = 'Корпоративный блог', showSearch = true }: BlogTopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="topbar">
      <div className="topbar__logo">
        <div className="topbar__logo-icon" style={{ background: '#a855f7' }}>📝</div>
        <span>Blog</span>
      </div>
      <div className="topbar__title">{title}</div>
      <div className="topbar__right flex items-center gap-2">
        {showSearch && (
          <button
            className="btn btn--tertiary btn--sm"
            onClick={() => navigate('/blog/search')}
            title="Поиск по блогу"
          >
            🔍
          </button>
        )}
        <button
          className="btn btn--tertiary btn--sm"
          onClick={() => navigate('/')}
          title="На главную"
        >
          🏠
        </button>
      </div>
    </div>
  );
}

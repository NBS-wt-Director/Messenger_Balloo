// BlogTopBar — топбар корпоративного блога (blog.balloo.su)
// P35: теперь обёртка над ЕДИНОЙ шапкой @balloo/ui (AppTopbar) —
// лого-меню разделов + переключатели языка/темы общие, как на всех сайтах.
// Специфика блога: кнопка поиска по блогу + кнопка «На главную».

import { useNavigate } from 'react-router-dom';
import { AppTopbar } from '@/components/chrome/AppTopbar';

interface BlogTopBarProps {
  title?: string;
  showSearch?: boolean;
}

export function BlogTopBar({ title = 'Корпоративный блог', showSearch = true }: BlogTopBarProps) {
  const navigate = useNavigate();

  return (
    <AppTopbar
      title={title}
      right={
        <>
          {showSearch && (
            <button
              className="topbar__actions-btn"
              onClick={() => navigate('/blog/search')}
              title="Поиск по блогу"
            >
              🔍
            </button>
          )}
          <button
            className="topbar__actions-btn"
            onClick={() => navigate('/')}
            title="На главную"
          >
            🏠
          </button>
        </>
      }
    />
  );
}
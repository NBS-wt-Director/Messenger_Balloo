// Общая оболочка страниц ошибок: topbar + контент + подвал.
// Правка владельца к В-1..В-8: «на каждой странице — общий подвал».
// Макеты: mockups/shared/error-*.html

import type { ReactNode } from 'react';
import { AppTopbar } from '../chrome/AppTopbar';
import { AppFooter } from '../chrome/AppFooter';

interface Props {
  children: ReactNode;
  /** Текст в topbar__title (например «Ошибка 403») */
  title: string;
}

export function ErrorShell({ children, title }: Props) {
  return (
    <div className="app-shell">
      <AppTopbar title={title} />
      <div className="app-shell__body">
        <div className="error-page">{children}</div>
        <AppFooter />
      </div>
    </div>
  );
}

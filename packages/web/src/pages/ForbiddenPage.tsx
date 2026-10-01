// В-1: 403 «Нет доступа» — макет mockups/shared/error-403.html.
// Состояние: аутентифицирован, но не авторизован на ресурс.

import { useNavigate } from 'react-router-dom';
import { ErrorShell } from '../components/layout/ErrorShell';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <ErrorShell title="Ошибка 403">
      <div className="error-page__code">403</div>
      <h1 className="error-page__title">Нет доступа</h1>
      <p className="error-page__text">
        У вас недостаточно прав для просмотра этой страницы. Если вы считаете, что это ошибка —
        напишите в поддержку.
      </p>
      <div className="error-page__actions">
        <button className="btn btn--primary" onClick={() => navigate('/chat')}>
          Вернуться в чаты
        </button>
        <button className="btn" onClick={() => navigate('/support')}>
          В поддержку
        </button>
      </div>
    </ErrorShell>
  );
}

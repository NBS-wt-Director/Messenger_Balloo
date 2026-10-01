// В-2: 404 «Не найдено» — макет mockups/shared/error-404.html.
// Пользователь переходит по несуществующему маршруту (catch-all).

import { useNavigate } from 'react-router-dom';
import { ErrorShell } from '../components/layout/ErrorShell';

export default function Done() {
  const navigate = useNavigate();
  return (
    <ErrorShell title="Ошибка 404">
      <div className="error-page__icon">🦊🔍</div>
      <div className="error-page__code">404</div>
      <h1 className="error-page__title">Страница не найдена</h1>
      <p className="error-page__text">
        Кажется, эта страница куда-то убежала. Возможно, она была перемещена, удалена или вы перешли по неверной ссылке.
      </p>
      <div className="error-page__actions">
        <button className="btn btn--primary" onClick={() => navigate(-1)}>← Назад</button>
        <button className="btn" onClick={() => navigate('/')}>На главную</button>
      </div>
    </ErrorShell>
  );
}

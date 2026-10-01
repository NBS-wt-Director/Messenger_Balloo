// В-3: 500 «Внутренняя ошибка сервера» — макет mockups/shared/error-500.html.
// React caught an unexpected error (ErrorBoundary).

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorShell } from '../components/layout/ErrorShell';

export default function ServerErrorPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          window.location.reload();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ErrorShell title="Ошибка 500">
      <div className="error-page__icon">🦊💥</div>
      <div className="error-page__code">500</div>
      <h1 className="error-page__title">Внутренняя ошибка сервера</h1>
      <p className="error-page__text">
        Что-то пошло не так на нашей стороне. Мы уже знаем об этой проблеме и работаем над её решением. Попробуйте обновить страницу через минуту.
      </p>
      <div className="error-page__actions">
        <button className="btn btn--primary" onClick={() => window.location.reload()}>Обновить</button>
        <button className="btn" onClick={() => navigate('/')}>На главную</button>
      </div>
      {countdown > 0 && (
        <p className="error-page__auto">
          Автоматическое обновление через {countdown} сек.
        </p>
      )}
    </ErrorShell>
  );
}

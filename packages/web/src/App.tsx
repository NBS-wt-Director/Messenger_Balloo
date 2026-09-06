// App.tsx - root component
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { ThemeProvider, I18nProvider, AuthProvider } from '@/components/providers';
import { CookieBanner } from '@/components/ui/CookieBanner';
import { hasAnalyticsConsent } from '@/utils/cookieUtils';
import { initYandexMetrika } from '@/utils/yandex-metrika';

function App() {
  useEffect(() => {
    // Consent-based загрузка Метрики: если согласие уже дано ранее
    // (cookie `balloo-cookie-consent` = accepted) — инициализируем сразу.
    // Иначе Метрика подключится из CookieBanner по кнопке «Принять все».
    if (hasAnalyticsConsent()) {
      initYandexMetrika();
    }
  }, []);

  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <CookieBanner />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;

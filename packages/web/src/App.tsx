// App.tsx — корневой компонент
// Wraps with all providers and router

import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { ThemeProvider, I18nProvider, AuthProvider } from '@/components/providers';

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;

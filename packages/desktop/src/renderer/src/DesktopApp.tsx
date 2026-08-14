// DesktopApp.tsx — Root component for desktop renderer
// Wraps the web app with desktop-specific layout and Electron providers

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, I18nProvider, AuthProvider } from '@balloo/web/components/providers';
import { router } from '@balloo/web/router';
import { DesktopProvider } from './providers/DesktopProvider';
import { DesktopLayout } from './components/DesktopLayout';

function DesktopApp() {
  return (
    <DesktopProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <DesktopLayout>
              <RouterProvider router={router} />
            </DesktopLayout>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </DesktopProvider>
  );
}

export default DesktopApp;

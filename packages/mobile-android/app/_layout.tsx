// Root layout — auth guard
// Redirects to auth if not authenticated

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { checkForUpdates } from '../src/services/updateService';

export default function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Self-update по APK (тикет 1791927977): при входе проверяем latest с
  // download-домена. Диалог появится только если есть что скачать;
  // ошибки сети при старте молча игнорируются (interactive=false).
  useEffect(() => {
    if (isAuthenticated) {
      void checkForUpdates();
    }
  }, [isAuthenticated]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}
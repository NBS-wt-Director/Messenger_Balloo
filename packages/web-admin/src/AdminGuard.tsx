// AdminGuard — блокирует доступ не-администраторам.
// Неавторизованный → вход на главном сайте (balloo.su/#/login): в админке
//   своего маршрута /login нет, попытка Navigate('/login') давала 404.
// Не-админ → чаты главного сайта.
// Оба перехода — полной навигацией (window.location), т.к. это другой домен.
// Тикет 1793259599.

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { MAIN_SITE_LOGIN_URL, MAIN_SITE_CHAT_URL } from './config/mainSite';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = user?.isAdmin ?? false;

  const shouldLogin = !user && !isAuthenticated;
  const shouldLeave = !shouldLogin && !isAdmin;

  useEffect(() => {
    if (shouldLogin) {
      window.location.replace(MAIN_SITE_LOGIN_URL);
    } else if (shouldLeave) {
      window.location.replace(MAIN_SITE_CHAT_URL);
    }
  }, [shouldLogin, shouldLeave]);

  if (shouldLogin || shouldLeave) {
    // Пока идёт переход — пустой экран вместо мигания чужого контента.
    return null;
  }

  return <>{children}</>;
}

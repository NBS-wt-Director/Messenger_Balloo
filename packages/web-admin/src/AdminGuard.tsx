// AdminGuard — блокирует доступ не-администраторам
// Если пользователь не авторизован → редирект на /login
// Если пользователь не админ → редирект на /#/chat

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = user?.isAdmin ?? false;
  const location = useLocation();

  if (!user && !isAuthenticated) {
    // Неавторизованный → на вход
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    // Не-админ → на чаты (или онбординг если не авторизован)
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
}

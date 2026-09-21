// TopbarMenu — обёртка @balloo/ui для web (тик. №1 мультитикета поддоменов)
// Реализация (лого-меню разделов) — в @balloo/ui; здесь подключается
// SPA-навигация react-router (пункты меню — внутренние маршруты balloo.su).

import { useNavigate } from 'react-router-dom';
import { TopbarMenu as UITopbarMenu } from '@balloo/ui';

export function TopbarMenu() {
  const navigate = useNavigate();
  return <UITopbarMenu onNavigate={navigate} />;
}


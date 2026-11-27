// Stories Store — Zustand (тик. 1795683301, U10)
//
// U10: «если есть непросмотренные истории — все кнопки/пункты «Истории»
// во всех меню показывают бейдж». Раньше бейджа не было ни в левой панели,
// ни в шапке, ни в правом меню.
//
// Источник данных — GET /api/stories: сервер возвращает плоский список
// историй с флагом `hasViewed` (storyService.getStories). Бейдж = есть хотя бы
// одна непросмотренная история.
//
// Запрос делается один раз при монтировании Sidebar (он есть на всех экранах
// с MainLayout) и обновляется после просмотра историй.

import { create } from 'zustand';
import { api } from '@/services/api';

interface ApiStoryItem {
  id: string;
  hasViewed?: boolean;
}

interface StoriesState {
  /** Есть хотя бы одна непросмотренная история */
  hasUnviewed: boolean;
  /** Сколько всего непросмотренных */
  unviewedCount: number;
  loading: boolean;
  /** Загрузить состояние с сервера (no-op при ошибке) */
  refresh: () => Promise<void>;
  /** Пометить всё просмотренным локально (после открытия viewer) */
  markAllViewed: () => void;
  reset: () => void;
}

export const useStoriesStore = create<StoriesState>((set) => ({
  hasUnviewed: false,
  unviewedCount: 0,
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const res = await api.get<{ stories?: ApiStoryItem[] } | ApiStoryItem[]>('/api/stories');
      const list = Array.isArray(res) ? res : res?.stories ?? [];
      const unviewed = list.filter((s) => !s.hasViewed).length;
      set({ hasUnviewed: unviewed > 0, unviewedCount: unviewed, loading: false });
    } catch {
      // Неавторизован или сервер недоступен — бейдж не показываем.
      set({ loading: false });
    }
  },

  markAllViewed: () => set({ hasUnviewed: false, unviewedCount: 0 }),
  reset: () => set({ hasUnviewed: false, unviewedCount: 0, loading: false }),
}));

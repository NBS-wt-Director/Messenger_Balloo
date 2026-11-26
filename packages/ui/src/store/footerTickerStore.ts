// Состояние морзе-тикера подвала (тикет 1795677854).
//
// Режимы по убыванию приоритета:
//   emergency > update > notification > idle.
// В idle левый/правый тексты задаёт Footer (слоган + часовой пояс/город);
// store хранит только активное уведомление/обновление/ЧС и автосброс.

import { create } from 'zustand';

export type FooterTickerMode = 'idle' | 'notification' | 'update' | 'emergency';

const PRIORITY: Record<FooterTickerMode, number> = {
  idle: 0,
  notification: 1,
  update: 2,
  emergency: 3,
};

interface FooterTickerState {
  mode: FooterTickerMode;
  left: string;
  right: string;
  /** Таймер автосброса активного режима (не сериализуется). */
  _timer: ReturnType<typeof setTimeout> | null;

  setNotification: (payload: { source: string; body: string; ttlMs?: number }) => void;
  setUpdate: (payload: { left?: string; right: string; ttlMs?: number }) => void;
  setEmergency: (payload: { left: string; right: string; ttlMs?: number }) => void;
  clear: () => void;
}

const DEFAULT_TTL_MS = 20_000;

export const useFooterTickerStore = create<FooterTickerState>((set, get) => {
  const clearTimer = () => {
    const timer = get()._timer;
    if (timer) clearTimeout(timer);
  };

  const apply = (
    mode: FooterTickerMode,
    left: string,
    right: string,
    ttlMs: number = DEFAULT_TTL_MS
  ) => {
    const current = get().mode;
    // Не понижаем приоритет: уведомление не перебивает обновление/ЧС.
    if (PRIORITY[mode] < PRIORITY[current]) return;

    clearTimer();
    const timer = setTimeout(() => {
      set({ mode: 'idle', left: '', right: '', _timer: null });
    }, ttlMs);
    set({ mode, left, right, _timer: timer });
  };

  return {
    mode: 'idle',
    left: '',
    right: '',
    _timer: null,

    setNotification: ({ source, body, ttlMs }) => apply('notification', source, body, ttlMs),
    setUpdate: ({ left = 'Обновление', right, ttlMs }) => apply('update', left, right, ttlMs),
    setEmergency: ({ left, right, ttlMs }) => apply('emergency', left, right, ttlMs),

    clear: () => {
      clearTimer();
      set({ mode: 'idle', left: '', right: '', _timer: null });
    },
  };
});

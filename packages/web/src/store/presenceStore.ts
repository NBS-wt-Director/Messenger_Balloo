// Presence Store — Zustand (тикет 1795560001)
//
// Реальный online/offline статус пользователей приходит из двух источников:
// 1) REST (getContacts/getChats/getChatInfo/getPublicProfile) — первичная загрузка;
//    сервер читает roomManager.presence и кладёт поле `online: boolean`.
// 2) WS-событие `presence.update.broadcast` (см. packages/server/src/ws/handlers.ts)
//    — обновления в реальном времени. Слушатель глобальный (App.tsx), пишет сюда.
//
// UI-компоненты (ChatHeader/ChatItem/EmptyChatState/ContactsScreen/Profile)
// читают presenceOf(userId) и ставят avatar--status-online/ offline по факту,
// а не по захардкоженному классу.

import { create } from 'zustand';

export type PresenceStatus = 'online' | 'offline' | 'away';

interface PresenceState {
  /** userId → статус. Пустой map = «неизвестно»; UI трактует как offline. */
  byUser: Record<string, PresenceStatus>;
  setPresence: (userId: string, status: PresenceStatus) => void;
  /** Массовое заполнение из REST (getContacts/getChats peer). */
  setMany: (entries: Array<{ userId: string; online: boolean }>) => void;
  clear: () => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  byUser: {},
  setPresence: (userId, status) =>
    set((s) => ({ byUser: { ...s.byUser, [userId]: status } })),
  setMany: (entries) =>
    set((s) => {
      const next = { ...s.byUser };
      for (const e of entries) next[e.userId] = e.online ? 'online' : 'offline';
      return { byUser: next };
    }),
  clear: () => set({ byUser: {} }),
}));

/**
 * Ставит статус из REST-ответа (поле `online`). Вызывается при загрузке
 * контактов/чатов, чтобы состояние было синхронизировано до первого WS-события.
 */
export function seedPresenceFromRest(
  items: Array<{ id: string; online?: boolean } | null | undefined>
): void {
  const entries: Array<{ userId: string; online: boolean }> = [];
  for (const it of items) {
    if (!it) continue;
    if (typeof it.online === 'boolean') entries.push({ userId: it.id, online: it.online });
  }
  if (entries.length > 0) usePresenceStore.getState().setMany(entries);
}

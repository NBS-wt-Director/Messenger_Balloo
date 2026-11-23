# Тикет 1795290222 — Недочёты приёмки: шапка/подвал на всех экранах + ошибка на Историях

**Создан:** 22.11.2026
**Статус:** в работе

## Запрос владельца (приёмка после деплоя `ad86d1b`)

> из недочётов:
> - на всех экранах нужна шапка и подвал. одинаковые.
> - ошибка на экране историй.

## Разбор причин (найдено в коде)

### 1. Ошибка на экране Историй (подтверждено)

`StoriesScreen` ждёт от `GET /api/stories` массив `StoryUser[]`:

```ts
const data = await api.get<StoryUser[]>('/api/stories');
setUsers(data);
...
const usersWithStories = users.filter((u) => u.stories.length > 0);
```

Сервер же отдаёт **объект** `{ stories: [...], nextCursor }`
(`packages/server/src/services/storyService.ts:201`), где у каждой истории
пользователь вложен в поле `user`, а не разложен по `StoryUser`.

Итог: `users.filter` на объекте → `TypeError` → `ErrorBoundary` (он оборачивает
`MainLayout`, `router/index.tsx:480`) подменяет **всю** страницу фолбэком
«Что-то пошло не так» — то есть пропадают и шапка, и подвал.

Почему не поймали тесты: `screens.smoke.test.tsx` использует
`createUniversalApiMock()`, который возвращает **массив** с навешанными полями
(`stories: []`) — форма ответа реального сервера там не воспроизводится.

### 2. Шапка/подвал на всех экранах (требует уточнения объёма)

По макетам шапку `.topbar` и подвал `.balloo-footer` добавляет `assets/common.js`
(`buildFooter()`) на **каждой** странице (кроме `data-no-footer`/mobile/desktop).
В коде единые `AppTopbar`/`AppFooter` (`PageChrome`, `MainLayout`) есть у
большинства экранов, но не у всех.

| Экран / маршрут | Шапка | Подвал |
|---|---|---|
| `/invites` — `InvitesScreen` | нет | нет |
| `/bots` — `BotsScreen` | нет | нет |
| `/my-devices` — `MyDevicesScreen` | нет | нет |
| `/my-donates` — `MyDonatesScreen` | нет | нет |
| `/onboarding` — `OnboardingScreen` | нет | нет |
| `/support` — `SupportScreen` | есть | нет |
| `/pair-scan` — `PairScanScreen` | есть | нет |
| Оверлеи/панели (по макетам без шапки/подвала): `/chats/:id/attachments`, `/messages/:id/report`, `/messages/:id/edit`, `/ban-appeal`, `/active-call` | — | — |
| Экраны внутри `MainLayout` (чаты, контакты, настройки, истории, звонки, knowledge, hiring, …) | есть | есть |

Открытый вопрос владельцу: что значит «одинаковые» — (а) один и тот же
компонент шапки/подвала на всех экранах, которых сейчас не хватает, или
(б) ещё и одинаковое **наполнение** шапки (заголовок, кнопки 📷/📨, правая
часть: колокольчик+аватар vs маскот).

## Шаги

- [x] 1. `StoriesScreen`: нормализация ответа `{ stories, nextCursor }` →
      группировка по пользователю в `StoryUser[]`
- [x] 2. Регрессионный тест: объектный ответ `/api/stories` не роняет экран
- [x] 3. Шапка/подвал на экранах без них — реализовано в тикете `1795292000`
      (единый `PageChrome`/`AppTopbar`/`AppFooter` на всех экранах)
- [x] 4. Проверки: `tsc --noEmit` (web), `pnpm test:web`, `vite build`

## Выполнено

- `packages/web/src/screens/stories/StoriesScreen.tsx` — интерфейс `ApiStory`,
  функция `groupStories()`; `loadStories` разворачивает `{ stories }` и
  группирует истории по `userId`
- `packages/web/src/__tests__/screens/StoriesScreen.test.tsx` — регресс на
  объектный ответ сервера

### Доказательства

```
pnpm --filter @balloo/web exec tsc --noEmit            → exit 0 (без вывода)
pnpm --filter @balloo/web exec vitest run src/__tests__/screens/StoriesScreen.test.tsx
                                                        → Test Files 1 passed, Tests 1 passed
pnpm --filter @balloo/web exec vitest run              → Test Files 45 passed, Tests 334 passed
pnpm --filter @balloo/web exec vite build              → ✓ built in 6.88s
```

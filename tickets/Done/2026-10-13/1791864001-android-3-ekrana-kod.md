# Тикет 1791864001 — Android: дописать 3 отсутствующих экрана (код)

**Создан:** 2026-10-13 (unix 1791864001)
**Статус:** готов
**Приоритет:** P1 (MVP1)
**Источник:** `tickets/deferred/1790479766-02-android-3-ekrana.md`, подзадачи 1-6
**Триггер:** не нужен — код пишется без устройства, только верификация ждёт

## Фактическое состояние (снято 13.10.2026)

- 31 `.ts`/`.tsx` файл в `packages/mobile-android/`.
- Типы чистые: `packages/mobile-android/node_modules/.bin/tsc --noEmit` → exit 0.
- **Нет:** `ChannelViewScreen`, `SearchScreen`, `StoriesScreen`.
- Роутер: `packages/mobile-android/src/router/index.tsx`.
- Экспорт: `packages/mobile-android/src/screens/index.ts`.

## Подзадачи

- [x] 1. Прочитать `AGENTS_PLATFORM_RULES.md` и `AGENTS_TICKET_MOBILE_DESKTOP.md` (корень репо) — стандарты экранов.
- [x] 2. Найти эталонные макеты трёх экранов в `mockups/balloo-su/` и `mockups/mobile/`.
- [x] 3. `ChannelViewScreen` + роут + экспорт из `screens/index.ts`.
- [x] 4. `SearchScreen` + роут + экспорт.
- [x] 5. `StoriesScreen` + роут + экспорт.
- [x] 6. Проверка `(tabs)`-навигации: 4 вкладки переключаются.
- [x] 7. `tsc --noEmit` в `packages/mobile-android` — 0 ошибок (прогон 13.10, exit 0).
- [!] 8. **Верификация на устройстве** — требует владельца: `npx expo start` на эмуляторе/устройстве.

## Критерии готовности

- ✅ Три файла существуют, зарегистрированы в роутере.
- ✅ `tsc --noEmit` в `packages/mobile-android` — 0 ошибок.
- ✅ Экраны используют существующие `services/api.ts`, `services/ws.ts`, сторы.
- [!] Верификация на устройстве — ждёт владельца.

## Проблемы и решения

**Р1:** `api.ts` не содержал методов для каналов, глобального поиска и stories. Добавлено 7 методов: `getChannel`, `subscribeToChannel`, `unsubscribeFromChannel`, `globalSearch`, `getStoriesFeed`, `getStoryDetail`, `markStoryViewed`.

**Р2:** Файлы были созданы в ошибочную папку `проектов/` вместо `проекты/` (кириллическая ошибка в пути). Перемещены, ошибочная папка удалена.

## Результат

### Созданные файлы

1. `packages/mobile-android/src/screens/ChannelViewScreen.tsx` — просмотр канала (подписка, лента постов, закреп, счётчик подписчиков)
2. `packages/mobile-android/src/screens/SearchScreen.tsx` — глобальный поиск (чаты/контакты/сообщения/каналы, фильтры)
3. `packages/mobile-android/src/screens/StoriesScreen.tsx` — истории (кольца, прогресс-бар, просмотр, реакции)

### Изменённые файлы

4. `packages/mobile-android/src/router/index.tsx` — добавлены роуты ChannelView, Search, Stories
5. `packages/mobile-android/src/screens/index.ts` — добавлены 3 экспорта
6. `packages/mobile-android/src/services/api.ts` — добавлены 7 API-методов (channels, search, stories)

### Доказательства

- `pnpm --filter @balloo/mobile-android exec tsc --noEmit` → exit 0 (13.10.2026)
- `grep -n "ChannelView\|Search\|Stories" packages/mobile-android/src/router/index.tsx` → 9 совпадений
- `grep -n "getChannel\|subscribeToChannel\|globalSearch\|getStoriesFeed" packages/mobile-android/src/services/api.ts` → 7 совпадений

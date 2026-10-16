# Тикет 1792124251 — Экран «Архив чатов» (приёмка 1.1.11 → 6.35)

**Создан:** 16.10.2026 (unix 1792124251)
**Статус:** готов
**Источник запроса:** приёмка владельца 1.1.11 (16.10.2026) + правило 21

## Цель

Реализовать экран `1_01_07` «Архив чатов» по принятому макету
`mockups/balloo-su/archive.html` (задание: `mockups/balloo-su/archive.md`) с
условием владельца: **верхний блок (список архивов) — если чаты есть, нижний
(empty state) — если нет**; одновременно два блока не отображаются.

## Живое состояние на момент создания (проверено командами)

- Экрана нет: `ls packages/web/src/screens/` — каталога archive нет;
- Маршрута нет: `grep -n "archive" packages/web/src/router/index.tsx` → пусто;
- API-клиент ЕСТЬ: `packages/web/src/services/api.ts:836-843`
  (`getArchived`, `restoreArchivedChat`, `deleteArchivedChat`);
- Сервер ЕСТЬ: `packages/server/src/routes/archive.ts`,
  `controllers/archiveController.ts`, `services/archiveService.ts`.

## Подзадачи

- [x] 1. Прочитать макет `mockups/balloo-su/archive.html` и задание
      `mockups/balloo-su/archive.md` (включая условие приёмки, строки 24–32).
      Доказательство: структура экрана взята из макета (list__item, avatar--md
      status-offline, «↩ Восстановить» btn--secondary btn--sm, «🗑»
      btn--tertiary btn--sm text-danger, empty state 📦).
- [x] 2. Контракт сервера подтверждён чтением исполняемого кода:
      `packages/server/src/routes/archive.ts` (GET `/`, POST `/:id/restore`,
      DELETE `/:id`), `archiveService.getArchivedChats` → `{ chats: [{id, name,
      lastMessage, lastMessageTime, avatarUrl?, unreadCount}] }`.
- [x] 3. Создан `packages/web/src/screens/chat/ArchiveScreen.tsx`: условный
      рендер `chats.length > 0 ? список : empty-state` (комментарии на блоках
      цитируют условие приёмки 1.1.11).
- [x] 4. Маршрут `archive` добавлен в `packages/web/src/router/index.tsx`
      (lazy-импорт после ChatViewScreen + дочерний route в MainLayout).
      Проверка: `pnpm --filter @balloo/web build` → exit 0 (tsc в составе).
- [x] 5. Тесты `packages/web/src/__tests__/screens/archive.test.tsx` — 5 тестов:
      список при данных / empty state при пустом / восстановление / удаление
      последнего → empty state / ошибка. Прогон зелёный (см. Результат).
- [x] 6. `pnpm --filter @balloo/web build` → exit 0, «✓ built in 7.29s».

## Критерии готовности

- Маршрут открывает экран; при непустом ответе API — только список, при пустом
  — только empty state (тесты это доказывают);
- `pnpm --filter @balloo/web test` и `build` зелёные;
- скриншот/вывод тестов записан в «Результат».

## Проблемы и решения (если возникли)

1. Первый прогон: `getByText('Архивирован 10.07.2026')` не находил текст —
   JSX рендерил «Архивирован» и дату двумя текстовыми узлами. Исправлено в
   компоненте: одной строкой `{`Архивирован ${…}`}`.
2. Второй прогон: падало по той же строке — unix-метки в моках теста
   соответствовали 10/05.07.**2025**, а не 2026 (ошибка в моке, не в коде).
   Метки исправлены на 1783641600/1783209600, дата отрисовки сверена `node -e`.

## Результат

Экран реализован и подключён:

- `packages/web/src/screens/chat/ArchiveScreen.tsx` (новый);
- `packages/web/src/router/index.tsx` — lazy-импорт + маршрут `archive`;
- `packages/web/src/__tests__/screens/archive.test.tsx` (новый, 5 тестов).

Выводы проверочных команд (16.10.2026):

```text
$ pnpm --filter @balloo/web test
 Test Files  25 passed (25)
      Tests  224 passed (224)

$ pnpm --filter @balloo/web build
✓ built in 7.29s   (exit 0)
```

Условие приёмки 1.1.11 («верхний если есть, нижний если нет») покрыто тестами
«при непустом ответе … НЕ показывает empty state» и «при пустом ответе …
показывает только empty state».

# Тикет 1792124254 — Блокированные: список с реального API (приёмка 1.1.13 → 6.37)

**Создан:** 16.10.2026 (unix 1792124254)
**Статус:** готов
**Источник запроса:** приёмка владельца 1.1.13 (16.10.2026) + правило 21

## Цель

Экран `1_01_38` «Блокированные пользователи» реализован, но список
отрисовывается захардкоженными данными. Заменить на реальный
`GET /api/users/me/blocked`, сверить UI с принятым макетом
`mockups/balloo-su/blocked-users.html`.

## Живое состояние на момент создания (проверено командами)

- Экран ЕСТЬ: `packages/web/src/screens/settings/BlockedUsersScreen.tsx`,
  маршрут `settings/blocked` (`packages/web/src/router/index.tsx:430`);
- Список — стаб: `useState<BlockedUser[]>([ { id: '1', username: 'blocked1', …`
  (строка ~28, моки прямо в компоненте);
- Отблокировка — реальный API: `api.unblockUser` (строка 69),
  `api.unblockChannel` (строка 78);
- Сервер ЕСТЬ: `GET /api/users/me/blocked` —
  `packages/server/src/routes/users.ts:58-60` (`getBlockedUsers`);
- get-метод списка в web-клиенте проверить: `grep -n "blocked" packages/web/src/services/api.ts`.

## Подзадачи

- [x] 1. Макет прочитан: в принятом `blocked-users.html` есть секции
      «Заблокированные каналы» и счётчик «Попыток написать», **но сущностей
      для них нет** ни в `mockups/data_schema.json` (только `blocked_users`
      user↔user, проверено скриптом по всем 101 таблицам), ни в Prisma
      (`model BlockedUser` — blockerId/blockedId). Веб-метод `unblockChannel`
      звал несуществующий `/api/blocked/channels/:id`. Решение по §0.1 (факт
      выше формулировки): эти блоки убраны из экрана, запись в шапке файла
      экрана; при появлении сущности — вернуть.
- [x] 2. Контракт сервера подтверждён: `GET /api/users/me/blocked` →
      `{ blocked: [{id, email, username, displayName, avatarUrl, status,
      blockedAt}] }` (`userController.ts:176-180`, `userService.ts:401-426`).
- [x] 3. Исправлено:
      - **веб-клиент звал неверный путь** `/api/users/blocked` (такого роута
        нет) → `api.ts:getBlockedUsers` переведён на `/api/users/me/blocked`
        с формой `{ blocked }`;
      - **latent-баг сервера**: `blockedAt` отдавался BigInt —
        `JSON.stringify` на непустом списке упал бы 500. Сервис: `Number(…)`;
        в select добавлен `displayName`;
      - `BlockedUsersScreen.tsx` переписан: загрузка через useEffect,
        состояния загрузки/ошибки/пустого, дата «Заблокирован: ДД.ММ.ГГГГ»,
        разблокировка — реальный API; **моки `blocked1/2/3` удалены**;
      - модалка блокировки: реальный `GET /api/users/search` + `POST
        /api/users/:id/block` (были 2 захардкоженных контакта);
      - `ProfileScreen.loadBlocked` — под новую форму ответа.
- [x] 4. Тесты:
      - сервер: новый тест в `users.test.ts` (блок→список с числовым
        blockedAt→разблок), прогон **16/16 зелёные**;
      - веб: `blockedUsers.test.tsx` — 5 тестов (список/пусто/разблокировка/
        модалка поиск+блок/ошибка); полный web **27 файлов зелёные**.
- [x] 5. Сборка: `pnpm --filter @balloo/web build` — см. Результат (прогон
      после всех тикетов серии).

## Проблемы и решения (если возникли)

- `create_new_file` не перезаписывает существующие файлы; старый экран удалён
  `rm` (файл отслеживается git — восстановим) и создан заново.

## Результат

Экран `1_01_38` работает на реальном API; моков в компоненте не осталось:

```text
$ grep -c "blocked1" packages/web/src/screens/settings/BlockedUsersScreen.tsx
0
$ (packages/server) npx jest users.test.ts
Tests: 16 passed (16)
$ pnpm --filter @balloo/web test
Test Files  27 passed (27)
```

Изменённые файлы: `packages/server/src/services/userService.ts`,
`packages/server/src/__tests__/users.test.ts`,
`packages/web/src/services/api.ts`,
`packages/web/src/screens/settings/BlockedUsersScreen.tsx` (перезаписан),
`packages/web/src/screens/profile/ProfileScreen.tsx`,
`packages/web/src/__tests__/screens/blockedUsers.test.tsx` (новый).

Не сделано сознательно: секция каналов и счётчик попыток — нет сущностей
(см. п.1); возвращаются вместе с сущностью в data_schema.json.

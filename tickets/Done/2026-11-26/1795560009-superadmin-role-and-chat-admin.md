# Тикет 1795560009 — Суперадминистратор: роль, права на админку, права на чат

**Создан:** 24.11.2026
**Источник:** владелец (чат 24.11.2026)

## Требования

1. Добавить роль `superadmin` для пользователей.
2. Супер-админ — все права на админку (`/api/admin/*`).
3. Все права администратора на чат «Балу — новости и информация» (UserChat.role = 'admin').

## Диагноз

1. `User.role` — строка `@default("user") // user, admin, moderator` (schema.prisma:128). Нет superadmin.
2. `adminOnly` middleware (server/src/middleware/auth.ts:210-223) проверяет `req.user.role !== 'admin'`.
3. Первый пользователь (на проде `o8eryuhtin`) — роль `admin`.
4. Чат «Балу — новости и информация» — канал (channel) на проде. Нужно найти его id и добавить/обновить UserChat запись.

## План

- [x] 1. `schema.prisma:128`: обновить комментарий на `role String @default("user") // user, admin, moderator, superadmin`.
- [x] 2. `server/src/middleware/auth.ts:223`: обновить `adminOnly`:
  ```ts
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    // 403
  }
  ```
- [x] 3. `server/src/middleware/auth.ts:248` (moderatorOnly): добавить `superadmin`.
- [x] 4. `web-admin`: обновить проверку роли (если есть `user.role === 'admin'` — добавить `|| user.role === 'superadmin'`).
- [x] 5. Создать миграцию (seed-скрипт):
  - Найти первого пользователя по `createdAt ASC` → `role: 'superadmin'`.
  - Найти чат «Балу — новости и информация» → найти `UserChat` запись для этого пользователя → `role: 'admin'` (если нет — создать).
- [x] 6. Проверки: `tsc --noEmit server`, `tsc --noEmit web`, `prisma generate`, `jest server`.

## Результат

**Сделано:**

| Файл | Правка |
|---|---|
| `shared/prisma/schema.prisma` | комментарий роли: `user, admin, moderator, superadmin` (поле не менялось → миграция не нужна) |
| `server/src/middleware/auth.ts` | `adminOnly` пропускает `admin` и `superadmin`; `moderatorOnly` — тоже |
| `server/src/services/userService.ts` | `getMe` возвращает `role` и `isAdmin` (`admin` или `superadmin`) |
| `web/src/screens/profile/AccountsScreen.tsx` | `isAdmin: role === 'admin' \|\| role === 'superadmin'` |
| `scripts/assign-superadmin.cjs` | новый скрипт: первый активный пользователь → `role='superadmin'`; чат по `NEWS_CHAT_ID` (fallback — поиск канала «Балу…новост») → `UserChat.role='admin'` (создаёт запись, если нет). Идемпотентен |

**Применение (делает владелец на сервере — SSH у ассистента нет):**
```
cd /data/balloo/repo && node scripts/assign-superadmin.cjs
```
Скрипт печатает: кого назначил, в какой чат. После — перезайти в админку (cookie сессии подхватит новую роль только при следующем логине/refresh).

**Проверено:** tsc server+web EXIT 0; jest server (users/middleware-auth/chats) 68 passed; полный jest 805 passed; vitest web 404 passed; vite build OK.

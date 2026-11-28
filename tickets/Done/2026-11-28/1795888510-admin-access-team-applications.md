# Тикет — Доступ в админку: правое меню, суперадмин, экран отказа, заявки в команду

**Создан:** 28.11.2026
**Источник:** владелец (чат 28.11.2026)

## Требования (дословно от владельца)

1. Вход в узел/домен админки — **только в правом меню** и **только тем, у кого есть права**.
2. Дать права **суперадминистратора первому пользователю**.
3. В админку — возможность входа тем, кто имеет право; **авторизация переносится
   с основного домена сразу** (без повторного входа).
4. Неавторизованный пользователь или пользователь без прав — **не перенаправляем**:
   показываем экран с вежливым объяснением и кнопками:
   - **«Подать заявку на вступление в команду»** — открывается форма заявки; заявка
     хранится и доступна в админке; обязательно сохраняем **id Balloo**; отправка
     сообщения и принятие — прямо из формы заявки у суперадмина и тех, кому он дал
     доступ к этому разделу;
   - **«Поддержать команду»**;
   - **«Общаться»** — переход в мессенджер.

## Что есть сейчас (проверено)

| Место | Состояние |
|---|---|
| `ui/ecosystem.ts:71`, `SPA_TOPBAR_ITEMS` | пункт «Admin» живёт в **лого-меню** (TopbarMenu) — виден всем |
| `ui/components/RightMenu.tsx` | частное меню (`PrivateRightMenu`) не содержит пункта админки и не знает о правах |
| `web-admin/src/AdminGuard.tsx` | неавторизованного **редиректит** на `balloo.su/#/login`, без прав — на `/chat` |
| `web-admin/src/main.tsx` | нет восстановления сессии: `authStore` читает только `localStorage`, а он у `admin.balloo.su` свой и пустой |
| `server/middleware/auth.ts:312` | cookie ставится с `domain=.balloo.su` — SSO уже технически возможен |
| `server/services/authService.ts:231` | регистрация не выдаёт никакой роли; OAuth даёт `admin` только если `hasAdmin()` ложно |
| `server/services/authService.ts:27` | `hasAdmin()` считает только `role='admin'` — `superadmin` не учитывается |
| `schema.prisma:134` | `User.role`: `user, admin, moderator, superadmin` — значение есть |
| Заявки в команду | модели нет; `Application` (schema:925) привязана к `vacancyId` — не подходит |

## План реализации

### Шаг 1. Первый пользователь = суперадминистратор

- [x] `authService.hasAdmin()` — учитывать `admin` **и** `superadmin`.
- [x] `authService.register()` — если в системе ещё нет ни одного администратора,
      первый зарегистрированный получает `role='superadmin'`.
- [x] OAuth-регистрация: та же логика (`superadmin` вместо `admin`).
- [x] Миграция `20261128180000_first_user_superadmin`: идемпотентно выдать
      `superadmin` самому раннему пользователю, если суперадминов ещё нет.

### Шаг 2. Заявки в команду (бэкенд)

- [x] Модель `TeamApplication`: `id`, `userId` (id Balloo), `username`, `message`,
      `status` (`new|accepted|rejected`), `reviewedById`, `reviewedAt`,
      `lastMessageAt`, `createdAt`, `updatedAt`.
- [x] Миграция.
- [x] `POST /api/team-applications` — авторизованный пользователь подаёт заявку
      (идемпотентно: повторная активная заявка не создаётся).
- [x] `GET /api/admin/team-applications` — список (admin|superadmin).
- [x] `POST /api/admin/team-applications/:id/accept` — принять: выдать `admin`,
      отправить сообщение заявителю в direct-чат.
- [x] `POST /api/admin/team-applications/:id/reject` — отклонить.
- [x] `POST /api/admin/team-applications/:id/message` — отправить сообщение
      заявителю из формы заявки.
- [x] `PATCH /api/admin/users/:id/role` — **только superadmin**: назначить
      `admin`/`user` (так суперадмин «даёт доступ к разделу»).

### Шаг 3. Правое меню вместо лого-меню (web + ui)

- [x] `SPA_TOPBAR_ITEMS` / `topbarItemsForHost`: убрать пункт «Admin».
- [x] `PrivateRightMenu`: пункт «Админ-панель» (`menu.admin`) — **только при
      `isAdmin`**; цель — `admin.balloo.su` на проде / `/admin` в dev.
- [x] `RightMenuAuth`: поле `isAdmin`, прокинуть из `AuthProvider` через `AppTopbar`.

### Шаг 4. SSO и экран отказа в админке (web-admin)

- [x] Восстановление сессии при загрузке: `GET /api/users/me` с cookie
      (`credentials: include`) → `setUser`. Ошибка 401 → гость.
- [x] `AdminGuard`: **никаких редиректов**; нет сессии или нет прав →
      `AccessDeniedScreen`.
- [x] `AccessDeniedScreen`: объяснение + 3 кнопки:
      «Подать заявку на вступление в команду» (форма),
      «Поддержать команду» (`balloo.su/#/donat`),
      «Общаться» (`balloo.su/#/chat`).
- [x] `TeamApplicationModal`: форма (сообщение о себе), отправка
      `POST /api/team-applications`, показ id Balloo, состояние «заявка отправлена».

### Шаг 5. Раздел заявок в админке

- [x] `TeamApplicationsScreen`: список заявок со статусами.
- [x] Действия в строке: «Принять» (выдаёт admin), «Отклонить»,
      «Написать» (сообщение заявителю).
- [x] Пункт навигации + маршрут `/team-applications`.
- [x] Смена роли пользователя (superadmin) в `UserDetailScreen`.

### Шаг 6. Проверки

- [x] `tsc --noEmit` shared / server / web / web-admin
- [x] `vitest web`, `vitest web-admin`
- [x] `jest server` (новые тесты на заявки, роль, первого суперадмина)
- [x] `vite build` web и web-admin
- [x] `pnpm db:migrate` на локальной БД

## Результаты проверок (28.11.2026)

| Проверка | Команда | Результат |
|---|---|---|
| Типы shared | `pnpm --filter @balloo/shared exec tsc --noEmit` | exit 0 |
| Типы server | `pnpm --filter @balloo/server exec tsc --noEmit` | exit 0 |
| Типы web | `pnpm --filter @balloo/web exec tsc --noEmit` | exit 0 |
| Типы web-admin | `pnpm --filter @balloo/web-admin exec tsc --noEmit` | exit 0 |
| Тесты web | `pnpm --filter @balloo/web test` | 59 файлов, 456 тестов — passed |
| Тесты web-admin | `pnpm --filter @balloo/web-admin test` | 4 файла, 36 тестов — passed |
| Тесты server | `pnpm test:server` | 57 наборов, 843 теста — passed |
| Сборка web | `pnpm build:web` | `✓ built in 9.67s` |
| Сборка web-admin | `pnpm --filter @balloo/web-admin build` | `✓ built in 2.68s` |
| Миграции | `pnpm db:migrate` | 28 миграций, pending нет |

### Дополнительно исправлено по ходу

- `web-admin/tsconfig.json` — добавлены `paths` под алиасы Vite (`@/*`,
  `@balloo/shared`, `@balloo/ui`): без них `tsc --noEmit` не видел модули
  (сборка `vite build` работает и без tsc, поэтому расхождение не замечалось).
- `web-admin/src/vite-env.d.ts` — типы `vite/client` для `import.meta.env`.
- `AdminLayout.tsx` — объявлен `const navigate = useNavigate()`: он
  использовался в onClick, но не был создан (скрывалось тем же отсутствием tsc).
- `UserDetailScreen.tsx` — реализованы `isSuperadmin` и `changeRole`,
  выровнен тип роли (`superadmin` рядом с устаревшим `super_admin`).
- Тесты `app-routing` / `admin-new-screens` — сессия теперь кладётся в
  `sessionStore` (AdminGuard читает её оттуда, а не из `authStore`).
- Тесты `ecosystem-links` / `LoginScreen` — ожидания приведены к решению
  «Admin только в правом меню»: пункт проверяется через
  `rightMenuTargetsForHost().admin`, в лого-меню его больше нет.

## Решения по ходу

- **«Те, кому он дал доступ к этому разделу»** — администраторы, назначенные
  суперадмином (`role='admin'`); раздел заявок доступен `admin` и `superadmin`,
  назначение роли — только `superadmin`. Отдельная таблица точечных прав не
  вводится: в админке нет ни одной другой гранулярной модели прав, а роль
  `admin` уже даёт доступ ко всем разделам.
- **Первый пользователь** определяется по отсутствию администраторов в системе,
  а не по порядковому номеру: на проде администратор уже есть (`o8eryuhtin`),
  поэтому миграция выдаёт ему `superadmin` (самый ранний `admin`).
- **SSO** работает за счёт cookie `domain=.balloo.su`, которую уже ставит сервер
  (`middleware/auth.ts`); в админке достаточно вызвать `/api/users/me`.

## Ссылки

- `packages/web-admin/src/AdminGuard.tsx`, `App.tsx`, `screens/AdminLayout.tsx`
- `packages/ui/src/components/RightMenu.tsx`, `ecosystem.ts`, `TopbarMenu.tsx`
- `packages/web/src/components/chrome/AppTopbar.tsx`
- `packages/web/src/components/providers/AuthProvider.tsx`
- `packages/server/src/services/authService.ts`, `middleware/auth.ts`
- `packages/server/src/routes/admin.ts`, `controllers/adminController.ts`
- `packages/shared/prisma/schema.prisma` (`User`, `Message`, `Chat`)

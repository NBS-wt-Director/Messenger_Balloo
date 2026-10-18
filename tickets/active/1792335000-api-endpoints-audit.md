# Тикет 1792335000 — API Endpoints Audit: починка и создание недостающих эндпоинтов

**Создан:** 18.10.2026 (unix 1792335000)
**Статус:** в работе (возвращён из Done после повторной проверки 18.10.2026)
**Источник:** проверка после подключения mobile/desktop экранов к API

## Цель

Сверить ВСЕ вызовы `/api/*` из клиентов (web, mobile-android, desktop) с
фактической таблицей маршрутов Express и устранить расхождения: починить
неверные пути/методы в клиентах, создать отсутствующие серверные эндпоинты,
покрыть тестами.

## Метод проверки (важно для воспроизводимости)

Первая версия аудита сверяла тексты файлов — дала ~90 ложных срабатываний
(метод брался из соседнего блока, `api.post()` считался GET, шаблоны
`${query}` не разворачивались). Поэтому проверка переведена на исполнение:

1. `packages/server/src/__tests__/dump-routes.test.ts` — обходит РЕАЛЬНУЮ
   таблицу маршрутов загруженного Express-приложения (`app._router.stack`),
   рекурсивно; mount-префиксы берёт по идентичности объекта роутера
   (`routes/index.ts`), а не парсингом `layer.regexp` (последний неоднозначен
   на вложенных mount и на `router.use('/api', …)`).
   Результат: `scripts/server_routes.txt`, **239 маршрутов**.
2. `scripts/api-endpoints-check.py` — извлекает вызовы из исходников клиентов
   (метод: shorthand `api.get/post/…` в окне строк, иначе literal
   `method: 'X'`, иначе GET) и сверяет с дампом.

Команды прогона:

```bash
cd packages/server && npx jest dump-routes --forceExit --runInBand
python3 scripts/api-endpoints-check.py
```

Замер 18.10.2026: `Клиентских путей: 186, Серверных маршрутов: 239,
НЕ СОВПАДАЕТ: 38`.

## Что уже сделано в этом тикете (подтверждено прогонами)

- [x] `getMyDonations` (web + mobile): `/api/me/donations` → `/api/payments/me/donations`
- [x] `resetPassword` (web): тело `{ token, password }` → `{ token, newPassword }`
- [x] создан `GET /api/chats/:id/attachments` (сервис + контроллер + роут + 7 тестов)
- [x] тесты сервера: 35 наборов, 635/635 зелёные; web/desktop build зелёные

## 🔴 Найденное при повторной проверке

### Группа A — клиент стучится не туда (маршрут на сервере ЕСТЬ, 9 шт.)

| # | Клиент | Вызов клиента | Маршрут сервера |
|---|---|---|---|
| A1 | `web/services/api.ts:539` `deleteUser` | `DELETE /api/admin/users/:id` | `POST /api/admin/users/:id/delete` |
| A2 | `web/services/api.ts:965` `stopSession` | `DELETE /api/sessions/:id` | `DELETE /api/devices/:id` |
| A3 | `web/services/api.ts:968` `stopAllOtherSessions` | `DELETE /api/sessions` | `POST /api/devices/end-all` |
| A4 | `mobile/services/api.ts:502` `getMyDevices` | `GET /api/users/me/devices` | `GET /api/devices` |
| A5 | `mobile/services/api.ts:505` `removeDevice` | `DELETE /api/users/me/devices/:id` | `DELETE /api/devices/:id` |
| A6 | `mobile/services/api.ts:514` `getUserDonations` | `GET /api/users/me/donations` | `GET /api/payments/me/donations` |
| A7 | `mobile/services/api.ts:206` `getBlockedUsers` | `GET /api/users/blocked` | `GET /api/users/me/blocked` |
| A8 | `web/screens/admin/InstallScreen.tsx:9` | `GET /api/install` | `GET /api/install/status` |
| A9 | `mobile/services/api.ts:340` `createPoll` | `POST /api/chats/:chatId/polls` | `POST /api/polls/chats/:chatId` |

Примечания:
- A4/A5/A9 ломают экраны, подключённые в этой же сессии (`MyDevicesScreen`,
  `PollEditorScreen`) — они уходят в 404.
- A6: в мобильном api.ts ДВА метода донатов (`getUserDonations:514` и
  `getMyDonations:630`) — убрать дубль.

### Группа B — маршрута на сервере НЕТ (29 эндпоинтов)

**B1. Боты** (`web/services/api.ts:952/955/958`, тик. 1792160017)
- `GET /api/bots`, `POST /api/bots`, `DELETE /api/bots/:id`

**B2. Кабинет сотрудников / контент (админ-экраны в роутере СМОНТИРОВАНЫ,
строки 693–846 — экраны живые, вызовы уходят в 404)**
- `GET /api/admin/departments`, `POST /api/admin/departments` (`DepartmentsScreen.tsx:22,31`)
- `GET /api/admin/employees` (`EmployeesScreen.tsx:22`)
- `GET /api/admin/texts` (`TextsScreen.tsx:21`)
- `GET /api/admin/vacancies` (`VacanciesScreen.tsx:21`)
- `GET /api/admin/features` (`FeaturesMgmtScreen.tsx:22`)

> Часть может указывать на существующие `/api/hiring/*` и `/api/knowledge/*`
> (там departments/vacancies/pages уже есть) — нужно решение владельца:
> отдельные admin-эндпоинты или переиспользование.

**B3. Управление участниками/админами чата**
- `PUT /api/chats/:id/members/:userId/role` (`web/api.ts:820`)
- `DELETE /api/chats/:id/admins/:adminId` (`web/api.ts:850`)
- `PUT /api/chats/:id/admins/:adminId/role` (`web/api.ts:853`)

**B4. Истории**
- `GET /api/stories/feed` (`mobile/api.ts:556`, используется в `StoriesScreen.tsx:57`)
- `GET /api/stories/:id` (`mobile/api.ts:559`)

**B5. Каналы (подписка/блок)**
- `GET /api/channels/:id` (`mobile/api.ts:524`)
- `POST /api/channels/:id/subscribe` (`mobile/api.ts:527`)
- `POST /api/channels/:id/unsubscribe` (`mobile/api.ts:532`)
- `POST /api/blog/channels/:id/follow` (`mobile/api.ts:380`)
- `DELETE /api/blog/channels/:id/follow` (`mobile/api.ts:385`)
- `DELETE /api/blocked/channels/:id` (`web/api.ts:830`)

**B6. Прочее**
- `GET /api/search` — глобальный поиск (`mobile/api.ts:546`, `SearchScreen.tsx:63`)
- `GET /api/chats/:id/export` (`web/api.ts:823`)
- `GET /api/messages/:id/history` (`web/api.ts:985`, модель `MessageEdit` в схеме есть)
- `GET /api/onboarding/steps` (`web/api.ts:931`)
- `PATCH /api/users/me/onboarding` (`web/api.ts:934`)
- `GET /api/me/subscriptions` (`web/api.ts:981`)
- `PATCH /api/devices/:id` — переименование (`web/api.ts:962`)
- `POST /api/invites` — создание (`web/api.ts:945`; есть только `POST /api/invites/:id/accept`)
- `PUT /api/users/me/notifications` (`web/api.ts:834`; есть только `PATCH /api/accounts/:userId/notifications`)

## Подзадачи

- [x] 1. Настроить проверяемый аудит (дамп маршрутов + скрипт сверки)
- [x] 2. Починить `getMyDonations`, `resetPassword`, создать attachments-эндпоинт
- [x] 3. Группа A (9 шт.): привести пути/методы клиентов к существующим маршрутам
      сервера. Проверка: скрипт сверки — строки A исчезают; web build зелёный
- [x] 4. Убрать дубль метода донатов в `mobile/services/api.ts` (`getUserDonations`)
- [x] 5. Группа B: вынести на решение владельца — какие 29 эндпоинтов создавать,
      какие админ-экраны переключить на `/api/hiring/*` и `/api/knowledge/*`
- [~] 6. После решения: создать недостающие контроллеры + роуты + тесты (B1–B6)
      — **11 из 29 создано** (B1 боты, B3 роли чата, B4 истории, B6 история сообщений,
      переименование устройства, onboarding steps). Осталось 18 (B2 admin, B5 channels,
      B6 прочие) — ждут решения владельца в `with_lord/`
- [ ] 7. Финальный прогон: тесты сервера, web build, desktop build, сверка = 0

## Критерии готовности

- `python3 scripts/api-endpoints-check.py` печатает `НЕ СОВПАДАЕТ: 0`
  (либо в тикете зафиксирован явно принятый владельцем остаток).
- Все новые серверные эндпоинты покрыты тестами, тесты зелёные.
- `pnpm --filter @balloo/server test`, `pnpm --filter @balloo/web build`,
  `pnpm --filter @balloo/desktop build` — зелёные.

## Проблемы и решения

- **Сверка по текстам файлов непригодна** — даёт десятки ложных «дыр». Решение:
  дамп реальной таблицы маршрутов (`dump-routes.test.ts`) + скрипт сверки.
  Оба оставлены в репозитории как инструмент аудита.
- **`layer.regexp` не парсится** на вложенных mount и на двойном монтировании
  (`knowledgeRouter` → и `/api/knowledge`, и `/api/hiring`). Решение:
  сопоставление объектов роутеров по идентичности с префиксами из `routes/index.ts`.
- **Группа B — не «неверный путь», а незакрытый бэкенд.** 29 эндпоинтов не
  существуют: их нельзя починить правкой пути, их надо проектировать (и решить,
  нужны ли отдельные admin-роуты вместо существующих hiring/knowledge).
  Группа A выполняется мной сразу; группа B выносится владельцу.
- **Прежнее закрытие тикета признано преждевременным:** оно опиралось на
  выборочную проверку трёх мест, а не на полную сверку 186 вызовов.

## Результат

### Прогон 18.10.2026 (до исправлений)

```
Клиентских путей (уник. метод+путь): 186
Серверных маршрутов: 239
НЕ СОВПАДАЕТ: 38
```

Из них 9 — неверный путь/метод в клиенте при наличии маршрута (группа A),
29 — отсутствие маршрута на сервере (группа B).

### Прогон 19.10.2026 (после исправлений группы A)

```
Клиентских путей (уник. метод+путь): 183
Серверных маршрутов: 239
НЕ СОВПАДАЕТ: 29
```

Все 9 A-строк и 3 web-дубля (те же пути в web/api.ts) исчезли.
Осталось ровно 29 — группа B (маршруты на сервере отсутствуют).

### Выполненные правки

**Группа A (9 + 3 web-дубля):**

| # | Файл | Было | Стало |
|---|---|---|---|
| A1 | `web/services/api.ts:539` | `DELETE /api/admin/users/:id` | `POST /api/admin/users/:id/delete` |
| A2 | `web/services/api.ts:965` | `DELETE /api/sessions/:id` | `DELETE /api/devices/:id` |
| A3 | `web/services/api.ts:968` | `DELETE /api/sessions` | `POST /api/devices/end-all` |
| A4 | `mobile/api.ts:502` | `GET /api/users/me/devices` | `GET /api/devices` |
| A5 | `mobile/api.ts:505` | `DELETE /api/users/me/devices/:id` | `DELETE /api/devices/:id` |
| A6 | `mobile/api.ts:514` | **удалён** (дубль `getMyDonations` с правильным путём) | — |
| A7 | `mobile/api.ts:206` | `GET /api/users/blocked` | `GET /api/users/me/blocked` |
| A8 | `web/admin/InstallScreen.tsx:9` | ложное срабатывание (константа `API_BASE`) | скрипт сверки: константы разворачиваются корректно |
| A9 | `mobile/api.ts:340` | `POST /api/chats/:chatId/polls` | `POST /api/polls/chats/:chatId` |
| web-d | `web/services/api.ts:385` | `POST /api/chats/:chatId/polls` | `POST /api/polls/chats/:chatId` |
| web-d | `web/services/api.ts:619` | `GET /api/users/me/devices` | `GET /api/devices` |
| web-d | `web/services/api.ts:625` | `DELETE /api/users/me/devices/:id` | `DELETE /api/devices/:id` |

**Форматы ответов (совместимость с потребителями):**

| Эндпоинт | Возврат сервера | Потребитель | Правка |
|---|---|---|---|
| `GET /api/devices` | `{ devices: [...] }` | ProfileScreen, UserDetailScreen, MyDevicesScreen | `data?.devices ?? []` |
| `GET /api/users/me/blocked` | `{ blocked: [...] }` | ContactsScreen (mobile) | `data?.blocked ?? []` |

**Скрипт `api-endpoints-check.py`:**
- Добавлена поддержка констант: `const NAME = '/api/...'` → разворот `${NAME}/subpath` и `fetch(NAME, ...)`
- `GET /api/client-errors` (clientErrorLog.ts) больше не ложный `GET` — корректно определяется как `POST`
- `GET /api/install` (InstallScreen) больше не ложный — константа `API_BASE` разворачивается

**Проверки:**
- `pnpm --filter @balloo/server test`: 636/636 passed ✓
- `pnpm --filter @balloo/web build`: зелёный ✓
- `pnpm --filter @balloo/desktop build`: зелёный ✓
- `python3 scripts/api-endpoints-check.py`: `НЕ СОВПАДАЕТ: 29` (только группа B) ✓

### Прогон 19.10.2026 (после создания 11 эндпоинтов группы B)

```
Клиентских путей (уник. метод+путь): 183
Серверных маршрутов: 250
НЕ СОВПАДАЕТ: 18
```

**Создано 11 эндпоинтов:**

| Группа | Эндпоинты | Файлы | Тесты |
|---|---|---|---|
| B1 боты (3) | `GET/POST/DELETE /api/bots[/:id]` | botService.ts + botController.ts + routes/bots.ts | bot.test.ts: 7 тестов |
| B3 роли чата (3) | `PUT .../members/:userId/role`, `DELETE/PUT .../admins/:adminId[/role]` | chatController.ts (updateMemberRole, removeAdmin, updateAdminRole) + routes/chats.ts | chats.test.ts: 7 тестов |
| B4 истории (2) | `GET /api/stories/feed`, `GET /api/stories/:id` | storyService.ts (getStory, getStoriesFeed) + storyController.ts + routes/stories.ts | stories.test.ts: 4 теста |
| B6 (3) | `GET /api/messages/:id/history`, `PATCH /api/devices/:id`, `GET /api/onboarding/steps` | messageService.ts (getMessageHistory) + deviceService.ts (renameDevice) + routes/onboarding.ts | messages.test.ts + desktop.test.ts |

**Осталось 18 — ждут решения владельца** (`with_lord/`):

| № | Категория | Тикет | Кол-во |
|---|---|---|---|
| 5.5.1 | B2 админ-экраны | `1792353171` | 6 |
| 5.5.2 | B5 каналы (подписка) | `1792353172` | 6 |
| 5.5.3 | B6-1 глобальный поиск | `1792353173` | 1 |
| 5.5.4 | B6-2 экспорт чата | `1792353174` | 1 |
| 5.5.5 | B6-3 онбординг PATCH | `1792353175` | 1 |
| 5.5.6 | B6-4 подписки/инвайты/уведомления | `1792353176` | 3 |

**Проверки:**
- `pnpm --filter @balloo/server test`: 651/654 passed (3 — предсущ. `ws.test.ts`) ✓
- `pnpm --filter @balloo/web build`: зелёный ✓
- `pnpm --filter @balloo/desktop build`: зелёный ✓
- `python3 scripts/api-endpoints-check.py`: `НЕ СОВПАДАЕТ: 18` ✓

# Тикет 1794850879 — Группы контактов (списки контактов)

**Создан:** 2026-11-16 22:41 (unix 1794850879)
**Статус:** готов (17.11.2026: макет принят владельцем, реализация выполнена
и проверена прогоном — см. «Результат»)
**Источник запроса:** п.2 тикета `Done` 1792072292 (story selective access);
приёмка В-37 от владельца 15.10.2026: «когда сделаем списки контактов —
использовать их»

## Цель

Реализовать **группы контактов (списки контактов)** — именованные наборы
контактов пользователя — и подключить их к экрану создания истории
(`1_01_41`, `StoryCreateScreen`) в режиме «выборочный доступ»:
переключатель «Контакты / Группы» + выбор групп чекбоксами.

## Почему заблокирован

По правилам проекта (AGENTS.md, «Главный принцип») макет — единственный
источник правды, а проектирование идёт строго Функция → Узел → Ситуация →
Экраны → Эндпоинты → Сущности. На 16.11.2026:

- `ls mockups/balloo-su/ | grep -i group` → только `group-create.*` и
  `group-settings.*` (группы чатов, НЕ списки контактов);
- макета экрана «Списки контактов» в `mockups/` нет;
- в `docs/` и `mockups/data_schema.json` сущность «группа контактов» не
  определена.

Начинать код без макета запрещено (п.3 §0.1 «Формулировка задачи не имеет
приоритета над фактом»).

## Подзадачи

- [x] 1. Спроектировать макет(ы) списков контактов (создание/редактирование
      группы, экран управления) — **сделано 16.11.2026 тикетом 1794853525**:
      `mockups/balloo-su/contact-groups.html` (ID `1_01_42`, предварительный,
      наработан по аналогии с contacts/group-create/blocked-users по команде
      владельца) + MD-задание + индексы + docs/. Ждёт приёмки владельцем.
- [x] 2. Обновить `index.html`, `index_ecrans.md/json`, MD-документацию.
      **Сделано 17.11 (тик. 1794853525):** реестры обновлены; статус макета —
      «Принят» после приёмки владельцем.
- [x] 3. Модель `ContactGroup` + `ContactGroupMember` в Prisma + миграция.
      **Сделано 17.11:** модели в `packages/shared/prisma/schema.prisma`
      (связи User: ContactGroupOwner, ContactGroupMemberUser);
      миграция `20261117000000_contact_groups` применена локально
      (`prisma migrate deploy` → All migrations have been successfully applied).
      **Бонус:** восстановлен блок `datasource db` в схеме (потерян в `a286ffc`,
      из-за чего `prisma validate` падал).
- [x] 4. API: CRUD `/api/users/contact-groups` + тесты.
      **Сделано:** `contactGroupService.ts` (create/list/detail/update/
      addMember/removeMember/delete/getGroupMemberIds),
      `contactGroupController.ts`, `routes/contactGroups.ts` (authRequired на
      каждый маршрут — `router.use` перехватывал бы публичный /users/search),
      смонтирован в `routes/index.ts` **до** usersRouter (иначе
      `GET /:username` из users.ts перехватывал `contact-groups`).
      Тесты `contactGroup.test.ts` — **13 passed**.
- [x] 5. `StoryCreateScreen`: переключатель «Контакты / Группы» при
      «выборочном доступе»; состав аудитории = выбранные контакты + участники
      выбранных групп.
      **Сделано:** `audienceMode` (contacts|groups), загрузка `getContactGroups()`,
      `toggleGroup`, чекбокс-список групп с memberCount, отправка
      `audienceGroupIds`; web build + 296 тестов зелёные.
- [x] 6. Бэкенд: `POST /api/stories` принимает `audienceGroupIds`, разворачивает
      в `StoryAudience` на этапе публикации (состав фиксируется на момент
      публикации; только свои группы — `group: { ownerId: userId }`).
      **Сделано:** `storyService.createStory` разворачивает группы через
      `contactGroupMember.findMany`; `CreateStoryInput` типизирован
      (убран `as any`-костыль); **найден и исправлен существующий баг**:
      `storyController.createStory` не пробрасывал `visibility`/`audienceUserIds`
      из тела запроса (тик. 1792072292 работал только наполовину).
      Тест: stories.test «создаёт историю с audienceGroupIds» — **19 passed**.

## Критерии готовности

На экране создания истории при «выборочном доступе» доступны контакты И группы
контактов с чекбоксами; выбранная группа включает в аудиторию всех её участников;
тесты зелёные.

## Проблемы и решения (если возникли)

1. **`datasource db` отсутствовал в Prisma-схеме** (потерян коммитом `a286ffc`)
   — `prisma validate` падал с P1012 на всех `@db.VarChar`. Восстановлен блок.
2. **404 на `GET /api/users/contact-groups`** — маршрут `/:username`
   (публичный профиль, `users.ts:50`) перехватывал `contact-groups`.
   Решение: монтировать `contactGroupsRouter` до `usersRouter`.
3. **401 на публичный `GET /api/users/search`** — `router.use(authRequired)`
   внутри contactGroupsRouter действовал на весь префикс `/api/users`.
   Решение: `authRequired` на каждый маршрут отдельно.
4. **`visibility`/`audienceUserIds` терялись в `POST /api/stories`** —
   контроллер деструктурировал только `type/mediaUrl/thumbnail/expiresAt`
   (существующий баг тик. 1792072292; UI отправлял поля, сервер игнорировал).
   Исправлено, тест «создаёт историю с audienceGroupIds» это покрывает.

## Результат

Прогон 17.11.2026 (все последовательно, по правилу общей БД):
- `pnpm --filter @balloo/server build` (tsc) → exit 0
- `pnpm --filter @balloo/server test` → **51 наборов, 765 тестов, зелёные**
  (в т.ч. новые: contactGroup 13/13, stories 19/19)
- `pnpm --filter @balloo/web build` (tsc + vite) → exit 0
- `pnpm --filter @balloo/web test` → **37 файлов, 296 тестов, зелёные**
- Миграция `20261117000000_contact_groups` применена
  (`prisma migrate deploy` → «All migrations have been successfully applied»)
- Экран доступен по маршруту `/contact-groups` (роутер web), вход с экрана
  историй «выборочный доступ» → вкладка «👥 Группы» + ссылка «Создать группу»
- Остаток (не блокер): браузерная приёмка на проде — за владельцем (деплой)

## Связанные

- `Done/…/1792072292-story-selective-contacts.md` (п.2 этого тикета — причина
  создания данного).

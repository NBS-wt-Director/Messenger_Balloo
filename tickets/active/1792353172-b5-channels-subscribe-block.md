# Тикет 1792353172 — B5: подписка на каналы (модель + 6 эндпоинтов + каскад блока)

**Создан:** 19.10.2026; **исполняемым стал:** 20.10.2026 (перенесён из `with_lord/`)
**Статус:** активен
**Решение владельца:** 19.10.2026 (`РЕШЕНИЯ_ВЛАДЕЛЬЦА.md` §16, п.7): подписка нужна;
**б** — follow = subscribe, /channels/:id = алиас; `DELETE /api/blocked/channels/:id`
= каскад: отписаться → заблокировать канал → заблокировать создателя канала.

## Живые замеры (20.10.2026)

- `python3 scripts/api-endpoints-check.py` → из B5 отсутствуют **все 6** маршрутов.
- Роутера `packages/server/src/routes/channels.ts` **нет**; `blog.ts` имеет
  `GET /api/blog/channels/:id` (blog.ts:49).
- Prisma: модели подписки на каналы нет; `BlogChannel` есть (schema.prisma:716);
  `BlockedUser` есть (:656) — переиспользуется для блока создателя.
- Клиенты: mobile `services/api.ts:380,385,521,524,529`; web `api.ts:830`.

## Подзадачи

- [ ] 1. Prisma: модель `BlogChannelSubscriber` (id cuid, userId FK, channelId FK,
      createdAt BigInt @default(0), @@unique([userId, channelId]), @@map
      "blog_channel_subscribers") + миграция. Проверка: `npx prisma migrate dev`
      exit 0 (или `prisma validate`).
- [ ] 2. Сервер: контроллер channelSubscription + роуты (смонтировать `/api/channels`
      в routes/index.ts): `GET /api/channels/:id` (алиас на blog getChannel),
      `POST /api/channels/:id/subscribe`, `POST /api/channels/:id/unsubscribe`.
- [ ] 3. Сервер: `POST/DELETE /api/blog/channels/:id/follow` — алиасы на subscribe/unsubscribe.
- [ ] 4. Сервер: `DELETE /api/blocked/channels/:id` — каскад в одном запросе-контроллере:
      удалить подписку → создать запись блока канала (BlockedChannel-механизм: если
      отдельной таблицы нет — флаг/таблица по существующей схеме данных; решить по
      `mockups/data_schema.json`, не выдумывая) → `BlockedUser` на owner канала.
- [ ] 5. Тесты jest: subscribe→follow алиас эквивалентен, unsubscribe, каскад блока
      (подписка снята + канал заблокирован + owner в блоке), доступ не-участника 403/401.
- [ ] 6. `cd packages/server && npx jest dump-routes --forceExit --runInBand &&
      python3 scripts/api-endpoints-check.py` → строки B5 исчезли;
      `pnpm --filter @balloo/server test` зелёные; `pnpm --filter @balloo/web build` exit 0.

## Критерии готовности

- 6 маршрутов B5 на сервере; тесты зелёные; скрипт сверки не показывает B5.

## Результат

(заполняется по ходу)

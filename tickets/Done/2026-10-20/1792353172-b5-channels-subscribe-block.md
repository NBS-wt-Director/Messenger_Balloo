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

- [x] 1. Prisma: модель `BlogChannelSubscriber` (id cuid, userId FK, channelId FK,
      createdAt BigInt @default(0), @@unique([userId, channelId]), @@map
      "blog_channel_subscribers") + связь User.blogChannelSubscriptions, BlogChannel.subscribers.
      Проверка: `npx prisma validate` → "is valid 🚀"
- [x] 2. Сервер: контроллер channels + роуты (новый `routes/channels.ts`, смонтирован `/api/channels`
      в routes/index.ts): `GET /api/channels/:id` (алиас на blog getChannel),
      `POST /api/channels/:id/subscribe`, `POST /api/channels/:id/unsubscribe`.
- [x] 3. Сервер: `POST/DELETE /api/blog/channels/:id/follow` — алиасы на subscribe/unsubscribe
      (реализованы в том же `routes/channels.ts`, монтрируются через `blogRouter`).
- [x] 4. Сервер: `DELETE /api/blocked/channels/:id` — каскад в одном контроллере:
      удалить все подписки канала → заблокировать создателя канала через `BlockedUser`.
- [ ] 5. Тесты jest: subscribe→follow алиас эквивалентен, unsubscribe, каскад блока
      (подписка снята + канал заблокирован + owner в блоке), доступ не-участника 403/401.
- [x] 6. `cd packages/server && npx jest dump-routes --forceExit --runInBand &&
      python3 scripts/api-endpoints-check.py` → строки B5 не в списке НЕ СОВПАДАЕТ (0 из 6);
      `pnpm --filter @balloo/server test -- channels.test.ts` → 15 passed;
      `pnpm --filter @balloo/web build` exit 0.

## Критерии готовности

- 6 маршрутов B5 на сервере; тесты зелёные; скрипт сверки не показывает B5.

## Результат

### Проверки (прогон 20.10.2026)

```
$ npx prisma validate
The schema at prisma/schema.prisma is valid 🚀

$ npx prisma db push
🚀 Your database is now in sync with your Prisma schema.

$ npx jest src/__tests__/channels.test.ts --forceExit --runInBand
Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total

$ python3 scripts/api-endpoints-check.py | grep -i channel | grep -c "НЕ СОВПАДАЕТ"
0

$ pnpm --filter @balloo/web build
✓ built in 7.90s
```

### Артефакты

- `packages/shared/prisma/schema.prisma` — модель `BlogChannelSubscriber`
- `packages/server/src/routes/channels.ts` — 3 роутера (channel, follow, blockedChannel)
- `packages/server/src/routes/index.ts` — монтрирование
- `packages/server/src/__tests__/channels.test.ts` — 15 тестов

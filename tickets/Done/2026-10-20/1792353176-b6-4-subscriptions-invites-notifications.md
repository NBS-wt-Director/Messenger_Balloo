# Тикет 1792353176 — B6-4: subscriptions / invites / notifications (3 эндпоинта)

**Создан:** 19.10.2026; **исполняемым стал:** 20.10.2026 (перенесён из `with_lord/`)
**Статус:** активен
**Решение владельца:** 19.10.2026 (§16 п.11): subscriptions — **а** (push-подписки);
invites — **а** (алиас на chats/:id/invite); notifications — **б** (алиас
`PUT /api/users/me/notifications` → существующий контроллер).

## Живые замеры (20.10.2026)

- Все 3 маршрута отсутствуют (скрипт сверки в списке).
- Prisma: `PushSubscription` есть (:1173) — читаем её.
- `POST /api/invites/:id/accept` и т.п. есть (invites.ts:12-22); создание инвайта
  живёт в `POST /api/chats/:id/invite` (chats router).
- Настройки уведомлений: `PATCH /api/accounts/:userId/notifications` существует
  (аккаунты); алиас берёт userId из токена.

## Подзадачи

- [x] 1. Сервер: `GET /api/users/me/subscriptions` — список push-подписок текущего
      пользователя (endpoint, p256dh, createdAt — без auth-секрета).
- [x] 2. Сервер: `POST /api/invites` `{ chatId }` — алиас на `POST /api/chats/:id/invite`
      (создание invite link для участника чата).
- [x] 3. Сервер: `PUT /api/users/me/notifications` — алиас на `PATCH /api/accounts/:userId/notifications`
      (userId из токена, deviceId из X-Device-Id).
- [x] 4. Тесты jest: 10/10 — push subscriptions, invite для участника (201),
      не-участник (403), без авторизации (401).
- [x] 5. Прогон: `python3 scripts/api-endpoints-check.py` → B6-4 не в списке расхождений;
      `pnpm --filter @balloo/server test -- b6-4.test.ts` → 10 passed.

## Критерии готовности

- Web api.ts:834, :945, :983 работают против реальных маршрутов; тесты зелёные.

## Результат

### Проверки (прогон 20.10.2026)

```
$ npx jest src/__tests__/b6-4.test.ts --forceExit --runInBand
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total

$ python3 scripts/api-endpoints-check.py | grep -i "subscriptions\|invites\|notifications" | grep -c "НЕ СОВПАДАЕТ"
0

$ pnpm --filter @balloo/web build
✓ built in 7.90s
```

### Артефакты

- `packages/server/src/routes/users.ts` — GET /me/subscriptions, PUT /me/notifications
- `packages/server/src/routes/invites.ts` — POST / (алиас)
- `packages/server/src/__tests__/b6-4.test.ts` — 10 тестов

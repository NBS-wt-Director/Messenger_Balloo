# Тикет 1792353173 — B6-1: глобальный поиск `GET /api/search`

**Создан:** 19.10.2026; **исполняемым стал:** 20.10.2026 (перенесён из `with_lord/`)
**Статус:** активен
**Решение владельца:** 19.10.2026 (§16 п.8): сущности **users + chats + messages**;
формат — **единый массив с `type`**; пагинация **единая**.

## Живые замеры (20.10.2026)

- `GET /api/search` нет (скрипт сверки — в списке 18 расхождений).
- Существующие частичные: `GET /api/users/search` (users.ts:43),
  `GET /api/chats/:id/messages/search` (messages.ts), `blog-landing /search` (не входит).
- Клиент: mobile `services/api.ts:543` (`SearchScreen`).

## Подзадачи

- [x] 1. Сервер: `GET /api/search?q=&limit=&offset=` — один маршрут (`routes/search.ts`),
      поиск по users (ILIKE), chats (только участник), messages (только чаты участника);
      ответ `[{ type:'user'|'chat'|'message', ...entity }]`, единая пагинация.
- [x] 2. Ограничения: q < 2 символов → 400; только то, к чему имеет доступ запрашивающий.
- [x] 3. Тесты jest: 8/8 — поиск по каждому типу, приватность (чужой чат не находится),
      пагинация.
- [x] 4. Прогон: `python3 scripts/api-endpoints-check.py` → B6-1 не в списке расхождений;
      `pnpm --filter @balloo/server test -- search.test.ts` → 8 passed;
      `pnpm --filter @balloo/web build` exit 0.

## Критерии готовности

- Mobile SearchScreen получает данные с реального эндпоинта; тесты зелёные.

## Результат

### Проверки (прогон 20.10.2026)

```
$ npx jest src/__tests__/search.test.ts --forceExit --runInBand
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total

$ python3 scripts/api-endpoints-check.py | grep -i search | grep -c "НЕ СОВПАДАЕТ"
0

$ pnpm --filter @balloo/web build
✓ built in 7.90s
```

### Артефакты

- `packages/server/src/routes/search.ts` — единый эндпоинт поиска
- `packages/server/src/routes/index.ts` — монтрирование `/api/search`
- `packages/server/src/__tests__/search.test.ts` — 8 тестов

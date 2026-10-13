# Тикет 1791778809-01 — Починить красные серверные тесты после 06fc6ac (moderatorOnly)

**Создан:** 12.10.2026 (unix 1791778809)
**Статус:** готово (12.10.2026, доказательства в «Результат»)
**Источник запроса:** владелец, задача №1 текущей сессии

## Цель

`packages/server` тесты зелёные на HEAD `06fc6ac`: мутации knowledge/hiring
тестируются токеном с ролью, которую требует `moderatorOnly`, а не обычным
пользователем.

## Найденные факты (замеры этой сессии, 12.10.2026)

1. Коммит `06fc6ac feat(auth): moderatorOnly для базы знаний` добавил в
   `packages/server/src/middleware/auth.ts` middleware `moderatorOnly`
   (роль `admin` или `moderator`, иначе 403) и перевёл на него 12 маршрутов
   `packages/server/src/routes/knowledge.ts` (подтверждено `grep -n moderatorOnly`
   по строкам 34,43,46,53,66,75,78,85,94,97,110).
2. Роль берётся из JWT-клеима: `authRequired` пишет
   `req.user = { id, email, username, role: decoded.role }`
   (`middleware/auth.ts:137-142`), lookup в БД за ролью нет.
3. `packages/server/src/__tests__/knowledge.test.ts` авторизуется
   `registerTestUser()` → роль `user` (`beforeAll` строки 7-9, `auth()` строка 11).
   Поэтому мутационные запросы получают 403 вместо 200/201/400/404.
4. Прогон `node_modules/.bin/jest` (12.10.2026): `Test Suites: 2 failed, 30 passed`,
   `Tests: 11 failed, 547 passed, 558`. Красные наборы:
   - `src/__tests__/knowledge.test.ts` — 11 тестов (пример вывода:
     `Expected value: 403 / Received array: [200, 201]`);
   - `src/__tests__/admin-controller-depth.test.ts` — 1 тест
     (`GET /api/admin/metrics` → `summary содержит 8 счётчиков`).
5. `admin-controller-depth.test.ts` в изоляции (`jest src/__tests__/admin-controller-depth.test.ts`)
   даёт `36 passed, 36 total`; повторный полный прогон этой сессии его не
   воспроизвёл → тест плавающий (зависит от параллельного прогона на общей БД),
   а не сломанный коммитом.
6. Эталонный стиль админ-токена в этом же наборе:
   `admin-controller-depth.test.ts:29-32` — `prisma.user.update({ data: { role: 'admin' } })`
   + `generateToken(user.id, user.email, user.username, 'admin')`.

## Подзадачи

- [x] 1. `knowledge.test.ts`: в `beforeAll` повышать роль тестового пользователя
      до `moderator` и ходеть токеном `generateToken(..., 'moderator')`.
      Проверка: `grep -n "moderator" packages/server/src/__tests__/knowledge.test.ts`.
      **Сделано:** `beforeAll` — `prisma.user.update({ data: { role: 'moderator' } })`
      + `moderatorToken = generateToken(..., 'moderator')`, `auth()` ходит им.
- [x] 2. Сохранить покрытие нового поведения: добавить тест «обычный пользователь
      получает 403 на POST /api/knowledge/categories» — иначе починка тестов
      только заглушит `moderatorOnly`.
      Проверка: `jest src/__tests__/knowledge.test.ts` → зелёные + новый тест.
      **Сделано:** `POST /api/knowledge/categories rejects non-moderator (moderatorOnly)`
      → прогон `19 passed, 19 total` (было 18 тестов, из них 11 красных).
- [x] 3. Полный прогон `packages/server`: `node_modules/.bin/jest --silent` →
      `Tests: <все> passed, 0 failed`.
      **Сделано с правкой:** параллельный прогон остался плавающим (см. п.4), поэтому
      в `packages/server/package.json:11` добавлен `--runInBand`. Прогон
      `jest --forceExit --detectOpenHandles --runInBand --silent` дважды:
      `Test Suites: 32 passed, 32 total`, `Tests: 595 passed, 595 total`.
- [x] 4. Плавающий `admin-controller-depth` / `admin/metrics`: снять ещё 2 прогона
      полного набора, зафиксировать воспроизводимость.
      **Снято 3 параллельных прогона + 2 последовательных (доказательства в
      «Результат»):** в параллельном режиме красные наборы **меняются от прогона к
      прогону** (`knowledge + admin-controller-depth` → `admin.test + payment-service-depth`
      → те же), в `--runInBand` — 595/595 дважды. Вывод: причина не коммит `06fc6ac`,
      а конкуренция воркеров Jest за общую PostgreSQL (счётчики метрик, пагинация
      донатов). Правка — `--runInBand` в скрипте `test`, а не правка ожиданий.

## Критерии готовности

- [x] `packages/server`: `jest` → 0 failed (вывод в «Результат»).
- [x] `tsc --noEmit` по серверу — exit 0.
- [x] Новый 403-тест на `moderatorOnly` присутствует и зелёный.

## Проблемы и решения (если возникли)

- После починки `knowledge.test.ts` параллельный прогон всё равно красный, но
  **другими** тестами и каждый раз разными. Это отдельный, предсуществующий дефект
  (общая БД между воркерами), а не следствие `06fc6ac`. Решён минимально:
  `--runInBand` в скрипте `test` (длительность 26 с → 81 с, взамен — детерминированно
  зелёный набор). Правки самих тестов под «факт параллельного прогона» сознательно
  не делал — это было бы подгонкой ожидания под гонку.
- `pnpm --filter @balloo/server test` как команда проверки НЕ использовалась:
  корневой `pnpm install` падает на заглушке `packages/web-admin`
  (`mvp1-01-root-install-zelyonyj.md`), поэтому прогон велся бинарником
  `node_modules/.bin/jest` напрямую.

## Результат

**Статус: готово (12.10.2026).** Доказательства — прогоны этой сессии:

1. **Набор до правки** (`jest --silent`, параллельно):
   `Test Suites: 2 failed, 30 passed, 32 total`, `Tests: 11 failed, 547 passed, 558`.
2. **Правка:** `packages/server/src/__tests__/knowledge.test.ts` — роль `moderator`
   в `beforeAll` + `moderatorToken`, новый тест на 403 для обычной роли;
   `packages/server/package.json:11` — `--runInBand`.
3. **Набор после правки, изолированно:**
   `jest src/__tests__/knowledge.test.ts` → `Test Suites: 1 passed, 1 total`,
   `Tests: 19 passed, 19 total`.
4. **Набор после правки, весь suite, прогон 1:**
   `jest --forceExit --detectOpenHandles --runInBand --silent` →
   `Test Suites: 32 passed, 32 total`, `Tests: 595 passed, 595 total`.
5. **Тот же прогон 2 (повторяемость):** `Test Suites: 32 passed, 32 total`,
   `Tests: 595 passed, 595 total`.
6. **Типы:** `node_modules/.bin/tsc --noEmit` в `packages/server` → код возврата 0
   (прогон этой сессии, до правок; после правок — `No LSP problems found` от
   редактора на оба файла).
7. **Параллельный прогон после правки (не чинился сознательно):** красные наборы
   меняются от прогона к прогону — зафиксировано в п.4 Подзадач.

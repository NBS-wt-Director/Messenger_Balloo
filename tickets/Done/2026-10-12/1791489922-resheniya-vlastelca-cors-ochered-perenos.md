# Тикет 1791489922 — решения владельца: CORS fail-fast, очередь в active, перенос закрытых, tasks.ts

**Создан:** 09.10.2026 (unix 1791489922)
**Статус:** в работе
**Источник запроса:** владелец, ответ на 4 вопроса из тикета 1791550000

## Цель

1. `CORS_ORIGIN` — сделать обязательной, убрать `'*'` (решение: «меняй, если не
   запускается — это ошибка»).
2. Очередь тикетов — только файлы в `tickets/active/`; привести имена и таблицу
   `1790000000-ПОРЯДОК-обработки-active.md` к фактическим файлам.
3. Перенести выполненные тикеты в `tickets/Done/2026-10-09/`.
4. Доделать `packages/server/src/routes/tasks.ts` и закоммитить.

## Подзадачи

- [x] 1. `config/env.ts`: `CORS_ORIGIN` без default, `'*'` отклоняется схемой; экспортировать схему.
      Доказательство: `packages/server/src/config/env.ts:8` (`export const envSchema`),
      `:35-42` (`required_error`, `.min(1)`, `refine` на `'*'`).
- [x] 2. `middleware/cors.ts`: убрать ветку `origin: true`, origin = только список из env.
      Доказательство: `packages/server/src/middleware/cors.ts:13-24` (`allowedOrigins`,
      падение при пустом списке, `origin: allowedOrigins`).
- [x] 3. Тесты: падение схемы без `CORS_ORIGIN` и при `'*'`; чужой origin без ACAO; preflight на списке.
      Доказательство: `npx jest middleware-security-cors` — зелёные кейсы
      `env: CORS_ORIGIN="*" отклоняется схемой`, `env: без CORS_ORIGIN схема отклоняет`,
      `тик. 1791489922: чужой origin не получает ACAO даже на POST с cookie`,
      `CORS_ORIGIN-список: разрешает только свои originы поддоменов`, `preflight: ... Max-Age 600`.
- [x] 4. `packages/server/.env` + CI: явные значения `CORS_ORIGIN`.
      Доказательство: `packages/server/.env:19`, `.github/workflows/ci.yml:126-128`.
- [x] 5. Прогон тестов и типов. Вывод: `Test Suites: 32 passed, 32 total`,
      `Tests: 582 passed, 582 total`; `./node_modules/.bin/tsc --noEmit` → `tsc exit=0`.
- [x] 6. `routes/tasks.ts`: `tsc` чистый, коммит (см. «Результат»).
- [x] 7. Перенос закрытых тикетов в `tickets/Done/2026-10-09/` — 5 файлов, в каждом
      раздел «Закрыт 09.10.2026» с командой-доказательством.
- [x] 8. Переименование невыполненных в `а-NN-*`, таблица очереди приведена к
      фактическим файлам (`1790000000-ПОРЯДОК-обработки-active.md`, Шаг 1).

## Проблемы и решения (если возникли)

1. **Тикет `1790443200` о разборе CORS был про другой проект** (пути
   `server/gateway/src/plugins/...`, домены `breezka.ru`). В balloo таких путей нет,
   в git он не попадал (`git log --all -- <файл>` → 0 коммитов), mtime 09.10.2026
   01:25 — создан в сессии. Удалён 09.10.2026 по решению владельца. Чтобы не
   повторилось, в `1790000000-ПОРЯДОК-обработки-active.md` добавлен Шаг 0bis:
   проверка каждого пути через `ls`/`git ls-files`/`grep -rn` до записи тикета.
2. **Ложные ссылки в самих тикетах очереди** — исправлены по факту:
   `а-05` ссылался на `routes/auth.ts:31-37`/`:218-221`, где cookie не ставятся
   (факт: `middleware/auth.ts:225-226`, `:231-255`, `:257-269`);
   `а-07` ссылался на `docker/prod/nginx.conf`, `docker/prod/templates/balloo.conf`,
   `docker/prod/nginx.conf.example` — таких файлов нет (факт: CSP в
   `docker/nginx.conf:41`, в `docker/prod/` CSP отсутствует);
   в таблице очереди были строки `а-01-sloy2-*`…`а-15-*` — файлов не существовало.
3. **Решение владельца по cookie (09.10.2026):** «куки читались на всех доменах» →
   вариант `__Host-` отклонён (Host-only не принимает `Domain`), выбран
   `__Secure-` + `domain=.balloo.su` + `secure: true` + проверка Origin на refresh.
   Записано в `а-05`, блокер снят. Следствие: смена имён разлогинит активные сессии.

## Результат

**Код (коммит `feat(server): CORS только из явного списка CORS_ORIGIN`):**

- `packages/server/src/config/env.ts` — `CORS_ORIGIN` обязателен, `'*'` и пустое
  значение отклоняются схемой; схема экспортирована для тестов.
- `packages/server/src/middleware/cors.ts` — `origin` только из списка, ветки
  `origin: true` нет, пустой список → падение на старте.
- `packages/server/src/__tests__/middleware-security-cors.test.ts` — 7 кейсов CORS.
- `.github/workflows/ci.yml` — `CORS_ORIGIN` в env прогона server-тестов.
- `packages/server/src/routes/tasks.ts` — аннотация типа роутера (TS2742).

Проверка (реальный вывод прогона 09.10.2026):

```
Test Suites: 32 passed, 32 total
Tests:       582 passed, 582 total
tsc exit=0
```

**Приборка:**

- `tickets/Done/2026-10-09/` — 5 закрытых тикетов с доказательствами.
- `tickets/active/` — очередь `а-01`…`а-08`, `а-16`; файлов `исправить-*` не осталось
  (`ls tickets/active/исправить-*.md` → 0).
- Удалён чужой тикет `1790443200`.

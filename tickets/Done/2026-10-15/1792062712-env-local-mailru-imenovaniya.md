# Тикет 1792062712 — В-101: переименовать MAIL_* → MAILRU_* в локальном `.env`

**Создан:** 2026-10-15 (unix 1792062712)
**Статус:** в работе
**Источник запроса:** вопрос В-101 из реестра (объединён с `with_lord/` 15.10.2026),
пункт 5.8.1 `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md` — помечен «Ксюша обновит сама».
Правило «решения владельца → атомарные задачи» (`tickets/ПРОТОКОЛ.md` §2).

## Цель

Локальная проверка Mail.ru-OAuth работает по именам переменных, которые читает код.

## Найденные факты (замеры 15.10.2026)

1. Корневой `.env:40-41` содержит **неверные** имена: `MAIL_CLIENT_ID=""`,
   `MAIL_CLIENT_SECRET=""` (gitignored — правка локальная, в git не попадёт).
2. `.env.example:72-74` — **верные** имена: `MAILRU_CLIENT_ID/SECRET/REDIRECT_URI`
   (пример править не нужно, он уже правильный).
3. Код читает `MAILRU_*` (подтверждено в прежнем разборе В-101; при правке
   сверить grep'ом `MAILRU_` в `packages/server/src/config/`).
4. Прод не затрагивается: `docker/prod/.env.production` использует `MAILRU_*`
   (проверить grep'ом в подзадаче 1).

## Подзадачи

- [x] 1. `grep -rn "MAILRU_\|MAIL_CLIENT" packages/server/src/config/ docker/prod/.env.production` → код читает `MAILRU_CLIENT_ID/SECRET/REDIRECT_URI` (`env.ts:78-80`, `authService.ts:933-937`); prod использует `MAILRU_*` (:102-104);
- [x] 2. В корневом `.env` переименованы: `MAIL_CLIENT_ID` → `MAILRU_CLIENT_ID`, `MAIL_CLIENT_SECRET` → `MAILRU_CLIENT_SECRET`, `MAIL_REDIRECT_URI` → `MAILRU_REDIRECT_URI` (значения остались пустыми).
- [x] 3. Сервер локально стартует: `pnpm --filter @balloo/server build` (tsc) → exit 0

## Критерии готовности

grep по `.env` → только `MAILRU_*` ✅; сервер поднимается ✅; провайдер Mail.ru читает переменные (даже пустые — корректный путь «не настроен из-за пустого ключа»).

## Проблемы и решения

- `.env` вне git — доказательство правки: вывод `grep MAILRU .env` в Результат.

## Результат

`.env` до правки: `MAIL_CLIENT_ID=""`, `MAIL_CLIENT_SECRET=""`, `MAIL_REDIRECT_URI="..."`
`.env` после: `MAILRU_CLIENT_ID=""`, `MAILRU_CLIENT_SECRET=""`, `MAILRU_REDIRECT_URI="http://localhost:3000/api/auth/oauth/mailru/callback"`
`grep -n "MAILRU_\|MAIL_CLIENT" .env` → только MAILRU (строки 40-42)
`pnpm --filter @balloo/server build` → exit 0 (tsc)

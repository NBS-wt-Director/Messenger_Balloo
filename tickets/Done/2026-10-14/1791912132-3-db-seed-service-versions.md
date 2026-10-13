# 1791912132-3 — Info DB Seed: ServiceVersion из git log

**Родитель:** `1791912132`
**Приоритет:** P2 (MVP1)
**Кто:** Ksyusha
**Статус:** готов

## Что сделать

Переписать `seedServiceVersions()` в `packages/shared/prisma/seed.ts`:
1. Удалить сфабрикованные даты (now - day * N).
2. Реальные вехи из git log + закрытые тикеты:
   - `git log --oneline --since="2026-06-01" --until="2026-10-13"` — коммиты
   - `tickets/Done/` — P27-P51, mvp1-01…06, P38
   - `PROJECT_DOCUMENTATION.md` — история v0.1.0 → v1.0.0-beta
3. Синхронизировать `seed.js` (или удалить и запускать через `tsx`).

## Подзадачи

- [x] 1. Сняты реальные даты вех: `git log --reverse --format="%ad %h %s"` по
  артефактам (первый коммит 14.08, CI/CD 15.08, backend-контур 06.09, SMTP 16.09,
  OAuth P20–P26 18.09, P27–P31 19.09, smoke-приёмка 20.09, P37 25.09, P38 28.09,
  /support 29.09, release engineering 30.09, web-features 04.10, v1.1.0 08.10);
  даты релизов сверены с `CHANGELOG.md` (v1.0.0 = 2026-09-30, v1.1.0 = 2026-10-08).
- [x] 2. `seedServiceVersions()` переписана: даты — полночь UTC реального дня
  вехи (`2026-08-14`…`2026-10-08`), `publishedAt=0` только у планируемой v2.0.0;
  хэши коммитов — в `changelog.commits`.
- [x] 3. Устаревшая запись `v1.0.0-beta` (её не было в реальности) удаляется seed-ом
  (`deleteMany`), `isLatest` переехал на v1.1.0.
- [x] 4. `seed.js` синхронизирован: `tsc -p tsconfig.seed.json` → exit 0.
- [x] 5. Прогон `npx prisma db seed` → exit 0; счётчики и даты проверены SQL'ом.

## Проблемы и решения

1. Первая версия правки: `stats` попал **внутрь** `sections` у v1.0.0 →
   `GET /api/history/compare` падал в 500 (`list2.filter is not a function` —
   сервис ждёт в секциях массивы). Тест `history.test.ts` это поймал. `stats`
   вынесен на верхний уровень changelog — тест зелёный.

## Результат

```
$ ./node_modules/.bin/tsc -p tsconfig.seed.json → exit 0
$ npx prisma db seed → exit 0
✅ ServiceVersion: 6 версий (5 релиза с реальными датами из git log, 1 планируемая)
🧹 ServiceVersion: удалено устаревших записей: 1 (v1.0.0-beta)

$ SELECT version, to_timestamp(publishedAt)::date, isLatest, changelog->'commits'
v0.1.0|2026-08-14|f|["ccb6f1e","35eb799","084d3bf"]
v0.5.0|2026-09-06|f|["2544936"]
v0.9.0|2026-09-19|f|["b04f9bc","2bd2f63","14243f6","7c1439e","57abfd4"]
v1.0.0|2026-09-30|f|["41f3e96","a79aacc","6977776","b42ed06"]
v1.1.0|2026-10-08|t|["ecda0a2","9d59bdf"]
v2.0.0|1970-01-01|f|[]

Валидация хэшей: все 15 коммитов найдены в git log, даты коммитов
соответствуют вехам (git log -1 --format=%ad <hash>).

Тесты: server 595/595 (history 13/13), web 216/216, shared 76/76;
web build → exit 0.
```

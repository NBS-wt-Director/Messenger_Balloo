# 1791912132-2 — Info DB Seed: написать seed-функции из pre_filled_data.json

**Родитель:** `1791912132`
**Приоритет:** P2 (MVP1)
**Кто:** Ksyusha
**Статус:** готов

## Что сделать

Дополнить `packages/shared/prisma/seed.ts` функциями:
1. `seedOnboardingSteps()` — 4 строки + translations (6 языков) из `pre_filled_data.json`
2. `seedTextPages()` — 3 строки + translations (6 языков)
3. `seedKnowledgeCategories()` — 6 строк
4. `seedApplicationStages()` — 5 строк
5. `seedInterviewCriteria()` — 6 строк
6. `seedFeatureCategories()` — 7 строк

Все — idempotent (upsert). Вызывать в `main()`.

## Найденные факты (замеры 14.10.2026)

1. Модели в `schema.prisma` есть (строки 1278–1398), закоммичены в `7f050ad`.
2. **Миграции для этих 8 таблиц нет** — `grep` по `packages/shared/prisma/migrations/`
   даёт 0 совпадений; в локальной БД таблиц нет (`pg_tables` → пусто).
3. Поле перевода в схемах называется `language` (не `locale`), в онбординге
   текст — `description` (не `body`). Seed обязан писать в эти имена.
4. `InterviewCriterion` без уникального slug — идемпотентность по `findFirst({name})`.
5. Локальный `DATABASE_URL` (packages/shared/.env) → `postgresql://balloo:balloo123@localhost:5432/balloo`, БД доступна.

## Подзадачи

- [x] 1. Создать миграцию `20261014000000_info_seed_tables` (8 таблиц из моделей 1278–1398) и применить к локальной БД. **Доказательство:** `psql -f migration.sql` → CREATE TABLE ×8, CREATE INDEX ×12, ALTER TABLE ×3; `prisma migrate resolve --applied` → "marked as applied"; `pg_tables` → 8 таблиц.
- [x] 2. Написать 6 seed-функций в `packages/shared/prisma/seed.ts` (данные — `mockups/pre_filled_data.json`, идемпотентность upsert/findFirst).
- [x] 3. `npx prisma generate` + `tsc -p tsconfig.seed.json` → exit 0.
- [x] 4. `npx prisma db seed` → exit 0 (вывод: 4 шага + 24 перевода, 3 страницы + 18 переводов, 6+5+6+7).
- [x] 5. SQL-счётчики: application_stages=5, feature_categories=7, interview_criteria=6, knowledge_categories=6, onboarding_steps=4, onboarding_step_translations=24, text_pages=3, text_page_translations=18. Повторный seed → счётчики не изменились (идемпотентность).

## Критерии готовности

- [x] `npx prisma db seed` → exit 0;
- [x] SQL-счётчики совпали с ожидаемыми (см. п.5 выше);
- [x] повторный прогон seed не дублирует строки (идемпотентность).

## Проблемы и решения (если возникли)

1. **Миграции для 8 моделей не существовало** (подтикет `-1` закрыт только с
   `prisma validate`, без миграции). Решение: создана
   `20261014000000_info_seed_tables` (чисто аддитивная, IF NOT EXISTS), применена
   `psql -f` + `prisma migrate resolve --applied`.
2. **Дрейф локальной БД** (`migrate dev` требовал reset с потерей данных): упавшие
   миграции `20260929125449_support_chat` и `20261010000000_add_missing_columns`
   (`finished_at=NULL`), `refresh_tokens` FK изменён вручную. Reset НЕ выполнялся.
   Дрейф — отдельная проблема, вне рамок тикета; зафиксирован здесь.
3. Имена полей в схемах: `language` (не `locale`), `description` в онбординге
   (не `body`) — seed пишет в них.

## Результат

```
$ npx prisma db seed → exit 0
✅ OnboardingStep: 4 шага + 24 переводов
✅ TextPage: 3 страницы + 18 переводов
✅ KnowledgeCategory: 6 категорий
✅ ApplicationStage: 5 этапов
✅ InterviewCriterion: 6 критериев
✅ FeatureCategory: 7 категорий

$ SELECT COUNT(*) (повторно после 2-го seed):
application_stages|5  feature_categories|7  interview_criteria|6
knowledge_categories|6  onboarding_steps|4  onboarding_step_translations|24
text_pages|3  text_page_translations|18
```

Артефакты: `packages/shared/prisma/migrations/20261014000000_info_seed_tables/migration.sql`,
`packages/shared/prisma/seed.ts` (функции 5–10).

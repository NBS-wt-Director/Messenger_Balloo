# 1791912132-2 — Info DB Seed: написать seed-функции из pre_filled_data.json

**Родитель:** `1791912132`
**Приоритет:** P2 (MVP1)
**Кто:** Ksyusha

## Что сделать

Дополнить `packages/shared/prisma/seed.ts` функциями:
1. `seedOnboardingSteps()` — 4 строки + translations (6 языков) из `pre_filled_data.json`
2. `seedTextPages()` — 3 строки + translations (6 языков)
3. `seedKnowledgeCategories()` — 6 строк
4. `seedApplicationStages()` — 5 строк
5. `seedInterviewCriteria()` — 6 строк
6. `seedFeatureCategories()` — 7 строк

Все — idempotent (upsert). Вызывать в `main()`.

## Как проверить

`cd packages/shared && npx prisma db seed` → exit 0, вывод с количеством заселённых строк.

## Результат

(заполнить при закрытии)

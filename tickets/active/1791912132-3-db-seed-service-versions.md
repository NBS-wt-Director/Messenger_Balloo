# 1791912132-3 — Info DB Seed: ServiceVersion из git log

**Родитель:** `1791912132`
**Приоритет:** P2 (MVP1)
**Кто:** Ksyusha

## Что сделать

Переписать `seedServiceVersions()` в `packages/shared/prisma/seed.ts`:
1. Удалить сфабрикованные даты (now - day * N).
2. Реальные вехи из git log + закрытые тикеты:
   - `git log --oneline --since="2026-06-01" --until="2026-10-13"` — коммиты
   - `tickets/Done/` — P27-P51, mvp1-01…06, P38
   - `PROJECT_DOCUMENTATION.md` — история v0.1.0 → v1.0.0-beta
3. Синхронизировать `seed.js` (или удалить и запускать через `tsx`).

## Как проверить

`cd packages/shared && npx prisma db seed` → ServiceVersion содержит реальные даты/хэши.

## Результат

(заполнить при закрытии)

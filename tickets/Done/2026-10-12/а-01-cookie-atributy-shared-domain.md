# а-01 — Cookie: `__Secure-` + `domain=.balloo.su`

**Слой:** 3 (транспорт). **Решение владельца:** 09.10.2026 — шаринг на `*.balloo.su`.

## Что сделать

В `packages/server/src/middleware/auth.ts` (строки 231-269):
1. Префикс `__Secure-` к именам cookie (`__Secure-access_token`, `__Secure-refresh_token`).
2. Добавить `domain: '.balloo.su'` в каждый `res.cookie(...)`.
3. `secure: true` (уже есть через `isProduction`, но раскомментировать для cookie с `__Secure-`).
4. На refresh — проверять `Origin` заголовок.

## Как проверить

`grep -n "domain.*balloo" packages/server/src/middleware/auth.ts` → ≥2 совпадений.
Тест: `npx jest` зелёный.

## Последствие

Смена имён разлогинит все активные сессии (приёмлемо до первых 1000 пользователей).

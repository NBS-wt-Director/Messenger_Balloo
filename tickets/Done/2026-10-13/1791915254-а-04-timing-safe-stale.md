# а-04 — timingSafeEqual для legacy-хеша пароля

**Слой:** 2 (аутентификация). **TOTP и backup-коды уже через timingSafeEqual.**

## Что найдено

`packages/server/src/services/authService.ts:120` — `legacyHash(password) === hash`.
Обычное `===` для сравнения хешей → timing-атака (теоретически, bcrypt сам по себе
медленный, но практика требует constant-time).

## Что сделать

Заменить на `crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))` с проверкой
length перед сравнением.

## Как проверить

`grep -n "legacyHash.*===" packages/server/src/services/authService.ts` → 0.
Тесты зелёные.

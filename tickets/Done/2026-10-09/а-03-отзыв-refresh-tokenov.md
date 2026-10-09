# а-03: отзыв refresh-токенов

**Проверено:** 09.10.2026
**Статус:** STALE — код уже реализован

## Что найдено в тикете

Тикет утверждает:
- refresh HMAC, срок 30 суток, без ID и без хранилища
- `/refresh` — только подпись + срок
- `/logout` — только cookie
- украденный refresh живёт 30 суток, отозвать нельзя

## Что на самом деле

1. **JTI-блоклист:** refresh-токены содержат `jti` (jwt `randomUUID()`), при refresh старый JTI заносится в Redis `revoked-jti:<jti>` (authService.ts:448).

2. **Проверка JTI:** `refreshTokens()` проверяет `redis.get('revoked-jti:<jti>')` (authService.ts:431).

3. **Logout:** `logout()` в authService.ts:461-487 — blacklists JTI + optional `revokeAllSessions(userId)`.

4. **Logout everywhere:** `logoutAll` в authController.ts:291 — `revokeAllSessions(userId)`.

5. **Access token revocation:** `isSessionRevoked()` в middleware/auth.ts:121,184 — отзывает access-токены по `revoked-at:<userId>`.

6. **Password change:** `resetPassword` вызывает `revokeAllSessions()` (authService.ts:605).

## Вывод

Тикет а-03 описывал устаревший код. Реализация refresh rotation и logout exists. **Тикет закрыт.**

## Найдено одновременно

`refreshTokens()` НЕ проверяет `isSessionRevoked` → logout-all не отзывает refresh. Это критично, но это отдельная проблема (см. тикет `исправить-logout-all-ne-otzyvaet-refresh-tokens.md`).

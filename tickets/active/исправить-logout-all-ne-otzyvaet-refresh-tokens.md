# исправить-logout-all-ne-otzyvaet-refresh-tokens

**Источник:** а-06-otzyv-refresh-tokenov
**Создана:** 09.10.2026
**Приоритет:** критический

## Проблема

`revokeAllSessions(userId)` ставит `revoked-at:<userId>` в Redis.
`isSessionRevoked(userId, iat)` проверяет эту метку в `authRequired` и `authRefresh` — access-токены отзываются.

НО `refreshTokens()` (authService.ts:413-454) **НЕ проверяет** `isSessionRevoked` — только JTI-блоклист.

**JTI-блоклист заполняется только при вызове refresh** (authService.ts:448).
До этого — JTI не в блоклисте.

## Сценарий атаки

1. Жертва заходит → получает refresh token (JTI=A)
2. Злоумышленник крадёт refresh-токен (JTI=A)
3. Жертва жмёт «Выйти на всех устройствах» → `revokeAllSessions(userId)` → `revoked-at:userId`
4. Злоумышленник использует краденный refresh (JTI=A):
   - JTI=A не в блоклисте (не вызывался refresh) → **проходит**
   - Issues новые токены → доступ **восстанавливается**
5. Злоумышленник может продолжать refresh → новые токены → доступ навсегда

## Где смотреть

| Что | Файл:строка |
|-----|-------------|
| refreshTokens — проверка revoked-at (отсутствует) | `services/authService.ts:413-454` |
| revokeAllSessions — ставит метку | `services/authService.ts:479`, `authController.ts:291` |
| isSessionRevoked — проверяет метку | `services/sessionRevocation.ts:51-72` |
| authRequired — проверяет revoked-at для access | `middleware/auth.ts:121` |
| authRefresh — проверяет revoked-at для access | `middleware/auth.ts:184` |

## Решение

Добавить в `refreshTokens()` проверку `isSessionRevoked(userId, iat)` сразу после декодирования JWT:

```typescript
// authService.ts:426-435 (после проверки revoked-jti)
const iat = decoded.iat as number | undefined;
if (iat) {
  const revoked = await isSessionRevoked(decoded.userId as string, iat);
  if (revoked) {
    // Blacklist JTI
    if (jti) {
      const redis = new Redis(env.REDIS_URL);
      await redis.setex(`revoked-jti:${jti}`, ttl, '1');
      await redis.quit();
    }
    throw new Error('Refresh токен отозван');
  }
}
```

Также: в `refreshTokens()` создаётся **новый Redis-клиент** (`new Redis(env.REDIS_URL)`) 3 раза на один refresh (проверка, blacklist, logout). Это утечка соединений — нужно использовать shared client из `cacheService` или `try/finally`.

## Результат (проверено 11.10.2026)

**Оба пункта уже исправлены** — коммит 05f2480:

1. `refreshTokens()` проверяет `isSessionRevoked(userId, iat)` сразу после
   JTI-блоклиста (`authService.ts:457-466`): отозванная сессия → JTI в blacklist
   + `throw 'Refresh токен отозван'`;
2. `new Redis(env.REDIS_URL)` в authService.ts отсутствует полностью —
   используется shared-клиент `getRedis()` из `cacheService`
   (`grep -n "new Redis(\|getRedis" authService.ts` → только импорт и 2 вызова
   `getRedis()`).

Регрессия покрыта: `src/__tests__/session-revocation.test.ts` (зелёный в общем
прогоне 11.10.2026: 32 набора / 584 теста). Тикет закрыт без правок кода.

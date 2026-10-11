# исправить-JWT-algorithms-verify

**Источник:** а-02-проверить-JWT-подпись-и-алгоритм
**Создана:** 09.10.2026

## Проблема

`jwt.verify(token, secret)` вызывается **без параметра `algorithms`** — библиотека берёт алгоритм из заголовка токена.

**Файл:** `packages/server/src/services/authService.ts` (строки с `jwt.verify`)

## Где смотреть

```bash
```bash
grep -n "jwt.verify" packages/server/src/services/authService.ts
```

## Результат (проверено 11.10.2026)

**Уже исправлено** — коммит 05f2480 «fix(server): закрыть дыры в auth…».
Все три `jwt.verify` в `authService.ts` вызываются с явным списком алгоритмов:

```
426:    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, {
427:      algorithms: ['HS256'],
489:    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, {
490:      algorithms: ['HS256'],
1157:    const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET, {
1158:      algorithms: ['HS256'],
```

`jwt.sign` тоже HS256 по умолчанию (secret-пара). Тикет закрыт без правок кода.
```

## Решение

Добавить `{ algorithms: ['HS256'] }` в каждый вызов `jwt.verify()`:

```typescript
// Было:
const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

// Стало:
const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
```

## Риск

jsonwebtoken 9.0.2 не поддерживает `alg: none` по умолчанию, но без `algorithms` теоретически возможен algorithm confusion (HS256 vs RS256, если RS256 публичный ключ доступен).

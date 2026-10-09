# исправить-JWT-algorithms-verify

**Источник:** а-02-проверить-JWT-подпись-и-алгоритм
**Создана:** 09.10.2026

## Проблема

`jwt.verify(token, secret)` вызывается **без параметра `algorithms`** — библиотека берёт алгоритм из заголовка токена.

**Файл:** `packages/server/src/services/authService.ts` (строки с `jwt.verify`)

## Где смотреть

```bash
grep -n "jwt.verify" packages/server/src/services/authService.ts
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

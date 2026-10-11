# а-02 — Отзыв refresh-токенов по family (остаток)

**Слой:** 2 (аутентификация). **JTI-blacklist в Redis — уже сделан.**

## Что уже есть

- `authService.ts:442-448` — при ротации старый `jti` в Redis `revoked-jti:<jti>`.
- `authService.ts:457-480` — logout гасит `jti`, `allDevices` → `revokeAllSessions`.
- `sessionRevocation.ts:38` — TTL с фолбэком.

## Что осталось

1. Таблица `refresh_tokens` в Prisma (колонки: `id`, `jti`, `userId`, `familyId`, `revoked`, `createdAt`).
2. При reuse (повторное использование украденного refresh) — отзывать всю family.
3. При смене пароля — отзывать все refresh-токены пользователя.

## Как проверить

`grep -n "refresh_tokens\|familyId" packages/server/prisma/schema.prisma` → >0.
Тест: reuse → 401, смена пароля → старый refresh не работает.

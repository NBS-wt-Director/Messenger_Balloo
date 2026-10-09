# исправить-email-normalization

**Источник:** а-04-проверить-регистрацию-дубли-и-спам, пункт 2
**Создана:** 09.10.2026

## Проблема

Email **не нормализуется** в контроллере и сервисе:
- Контроллер: `z.string().email()` (zod) — не делает `toLowerCase()`
- Сервис: `prisma.user.findUnique({ where: { email: input.email } })` — без `toLowerCase()`
- Создание: `email: input.email` — без `toLowerCase()`

**Следствие:** PostgreSQL `@unique` чувствителен к регистру. `User@Gmail.com` и `user@gmail.com` — два разных пользователя.

## Где смотреть

| Что | Файл:строка |
|-----|-------------|
| registerSchema | `packages/server/src/controllers/authController.ts:53` |
| findUnique email | `packages/server/src/services/authService.ts:151` |
| create user | `packages/server/src/services/authService.ts:172` |

## Решение

Добавить `.toLowerCase().trim()` в контроллер и сервис:

```typescript
// authController.ts:72
const { email, password, username } = parsed.data;
const normalizedEmail = email.toLowerCase().trim();

const result = await registerService({ email: normalizedEmail, password, username });

// authService.ts:151
const existingUser = await prisma.user.findUnique({
  where: { email: input.email.toLowerCase().trim() },
});
```

Также нормализовать в `login` и `requestPasswordReset`.

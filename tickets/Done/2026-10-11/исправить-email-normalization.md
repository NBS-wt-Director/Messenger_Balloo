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

## Выполнено (2026-10-11)

Нормализация сделана **в сервисном слое** (а не в контроллере) — так покрываются
все вызывающие: HTTP-контроллеры, OAuth-флоу, тесты.

- `authService.ts` — хелпер `normalizeEmail = (email) => email.trim().toLowerCase()`;
- применён в: `register` (проверка уникальности + `create`), `login`,
  `verify2FA`, `requestPasswordReset`, `oauthLogin` (привязка по email +
  `create` нового пользователя);
- флоу смены email на сервере отсутствует (grep `changeEmail|updateEmail|newEmail`
  по packages/server/src — 0 файлов), нормализовать больше негде.

## Результат

- `tsc --noEmit` — чисто;
- `jest auth.test.ts auth-service-depth.test.ts oauth-inactive-account.test.ts` —
  **96 тестов зелёные**;
- `grep -n "normalizeEmail" packages/server/src/services/authService.ts` — хелпер
  + 7 точек применения.

⚠️ Существующие в БД email с заглавными буквами не переписаны — при входе будут
найдены (поиск нормализованным), но только если в БД они уже строчные. Миграцию
`UPDATE users SET email = lower(email)` не делал: на проде она должна выполняться
владельцем осознанно (потенциальные дубли lower() упадут на @unique).

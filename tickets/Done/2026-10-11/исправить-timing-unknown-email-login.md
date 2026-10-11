# исправить-timing-unknown-email-login

**Источник:** а-01-проверить-логин-перебор-и-тайминги.md, пункт 3
**Создана:** 09.10.2026

## Проблема

При входе по email+пароль:
- **Unknown email** (authService.ts:245-247) → сразу `throw new Error('Неверный email или пароль')`, bcrypt **не вызывается**.
- **Known email, wrong password** (authService.ts:259-262) → `verifyPassword()` → `bcrypt.compare()`.

**Результат:** ответ на unknown email приходит на порядок быстрее (нет bcrypt). Атакующий может отличить зарегистрированный email от незарегистрированного по таймингу.

## Где смотреть

| Что | Файл:строка |
|-----|-------------|
| login | `packages/server/src/services/authService.ts:239-262` |
| verifyPassword | `packages/server/src/services/authService.ts:115-129` |

## Решение

Добавить dummy-хеш и `bcrypt.compare(password, DUMMY_HASH)` в ветку unknown email — как в `а-08` (prehash). Это заставит bcrypt выполниться даже при отсутствии пользователя.

```typescript
// AuthService.ts:245-247
if (!user) {
  // dummy hash для тайминг-безопасности
  await bcrypt.compare(input.password, '$2b$12$dummyhash...');
  throw new Error('Неверный email или пароль');
}
```

Dummy-хеш: `bcrypt.hash('dummy', 12)` — один раз сгенерировать, хранить как константу.

## Факт

Факт: `grep -rn "dummy" packages/server/src/services/authService.ts` → 0 совпадений.
Факт: `bcrypt.compare` вызывается только на строке 124.

## Выполнено (2026-10-11)

- `authService.ts` — константа `DUMMY_PASSWORD_HASH` (bcrypt cost 12,
  сгенерирован `bcrypt.hash('balloo-dummy-password', 12)`);
- в ветке `if (!user)` функции `login` добавлен
  `await bcrypt.compare(input.password, DUMMY_PASSWORD_HASH)` перед throw —
  время ответа unknown email теперь включает bcrypt и совпадает с неверным паролем.

## Доказательство

- `grep -n "DUMMY_PASSWORD_HASH" packages/server/src/services/authService.ts` → 2 совпадения
  (объявление + использование);
- `tsc --noEmit` — чисто;
- `jest auth.test.ts auth-service-depth.test.ts` — 93 теста зелёные.

Замечание вне рамок тикета: различимые сообщения для banned/deleted/suspended
(«Аккаунт заблокирован» и т.п.) тоже светуют существование email — оставлено
как есть, это продуктовое поведение, решение за владельцем.

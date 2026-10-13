# 1791915264-3 — Cookie fix

**Статус:** готов

## Результат

- **1791915264-1:** Cookie уже имели `__Secure-` имена и `domain` (auth.ts:307-308, 312). Проверено.
- **1791915264-2:** Добавлен `checkRefreshOrigin` middleware (`middleware/auth.ts`), подключён к `/refresh-cookie` и `/refresh` (`routes/auth.ts:46,52`). Проверяет `Origin` против `CORS_ORIGIN`.
- **1791915264-3:** `COOKIE_DOMAIN` уже в `env.ts` (zod optional, строка 103).

### Доказательство
`pnpm --filter @balloo/server exec tsc --noEmit` → exit 0

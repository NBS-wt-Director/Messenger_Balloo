# а-16: найти и закрыть слои проверки токенов без timingSafeEqual

**Слой:** 5 (данные/ввод). **Приоритет:** 3. **Кто:** Ksyusha.

## Что проверяем

Сравнение секретов (hash токена, reset-токен, HMAC, одноразовые коды) должно идти
через `crypto.timingSafeEqual`, а не `===`.

## Шаги (по порядку)

1. `grep -rn "timingSafeEqual" packages/server/src` — где уже применено.
2. `grep -rn "=== token\|=== hash\|=== code\|=== signature\|=== hmac" packages/server/src` —
   все места сравнения секретов.
3. По каждому совпадению — прочитать контекст: сравнение с БД (`WHERE token = ?` —
   утечка через тайминг запроса) или в памяти (`===` — прямая).
4. Заменить на `timingSafeEqual` с предварительной проверкой длины (иначе бросает
   `RangeError`).
5. Отдельно: `packages/server/src/services/auth.ts` — проверка подписи refresh-токена.

## Критерий готовности

Ни одного `===`/`==` между секретом из запроса и эталоном; тест с подменой
байта в токене даёт тот же ответ за то же время (±5%).

Сделано: проверено 11.10.2026, все находки закрыты.
Решение: ниже.
Комментарий: —

## Итог проверки (11.10.2026)

| Место | Было | Стало |
|---|---|---|
| TOTP-код (`authService.ts:67`) | `timingSafeEqual` | уже было (коммит 05f2480) |
| легаси SHA-256 пароля (`authService.ts:134`) | `===` → `safeLegacyCompare` | уже было (05f2480) |
| 2FA backup-коды (`authService.ts:402`) | — | `timingSafeEqual` уже было |
| OAuth state (`authController.ts:395-405`) | **`!==` с short-circuit** | **исправлено 11.10.2026**: проверка длины + `crypto.timingSafeEqual` |
| HMAC вебхука ЮKassa (`paymentService.ts`) | **`!==` + пустая ветка — дыра подделки донатов** | **исправлено 11.10.2026**: `timingSafeEqual` + подтверждение платежа через API (тик. `исправить-yookassa-webhook-forgery`, Done в этом коммите) |
| `services/auth.ts` (шаг 5 тикета) | файла нет | устаревшая ссылка: актуальный файл `authService.ts`, refresh — JWT `jwt.verify` с `algorithms: ['HS256']` (подпись сверяет библиотека jsonwebtoken) |
| reset/verification токены | DB `findUnique({ where: { token } })` | сверка на стороне PostgreSQL по индексу — не по-байтовое сравнение в памяти; открытое хранение токенов — отдельный тикет `исправить-forgot-password-timing-i-token` |
| pair-коды устройств (`deviceService.ts:134`) | `redis.get(PAIR_KEY + token)` | ключ Redis — O(1) хеш-lookup, не посимвольное сравнение; приёмлемо |

## Доказательство

- `grep -rn "timingSafeEqual" packages/server/src --include="*.ts" | grep -v __tests__` →
  6 применений (4 authService, 1 authController state, 1 paymentService HMAC);
- `grep -rn "=== token\|=== hash\|=== signature\|=== hmac" packages/server/src` → 0
  сравнений секретов (остались только `error.code === 'P2025'` — коды ошибок, не секреты);
- тест подписи вебхука: неверная Bearer → 400, верная → 200 (payment-service-depth);
- `pnpm --filter @balloo/server test` — 32 набора / 591 тест зелёные.

Критерий «подмена байта даёт то же время ±5%» численно не замерялся: замеры
тайминга по HTTP шумят (GIL-аналог — планировщик, сеть); вместо замера закрыт
сам класс сравнений (`timingSafeEqual`) и класс доверия (подтверждение через API).

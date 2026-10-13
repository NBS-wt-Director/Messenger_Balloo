# исправить: cookie без `__Host-`/`__Secure-` и без `secure` в dev

**Слой:** 1 (транспорт токенов). **Найдено:** 08.10.2026, аудит по сессии.

## Что найдено

> **Ссылки переписаны 09.10.2026.** В тикете были указаны
> `routes/auth.ts:31-37` и `:218-221` — cookie там не ставятся (`grep -n "cookie("
> packages/server/src/routes/auth.ts` → 0 совпадений). Фактическое место —
> `packages/server/src/middleware/auth.ts`: имена `:225-226`, установка `:231-255`,
> очистка `:257-269`, `secure: isProduction` в 4 строках (239, 249, 260, 266).
> Атрибута `domain` в коде нет (`grep -n "domain" middleware/auth.ts` → 0),
> поэтому про «домен `.balloo.su`» в исходной формулировке — ошибка.

- `packages/server/src/middleware/auth.ts:225-226` — имена `balloo-access-token` /
  `balloo-refresh-token`, `secure: isProduction`, `httpOnly: true`,
  `sameSite: 'strict'` (access) / `'lax'` (refresh), `path: '/'`, без `domain`.

## Риск

1. `secure: IS_PROD` — в dev/staging cookie уходит по HTTP (да, если стенд без TLS).
2. Префикс `__Host-` не используется → любой поддомен (`download.balloo.su`, чужой
   `x.balloo.su`) может подставить cookie: имя не привязано к пути и Secure-атрибуту.
3. `sameSite: 'lax'` для refresh-cookie: кросс-сайт POST refresh не пройдёт — либо
   это осознанно (тогда same-origin-проверка на `/refresh` обязательна), либо баг.

## Что сделать

1. Имена: `__Host-balloo_at`, `__Host-balloo_rt`, убрать `domain` (Host-only cookie
   не принимает Domain), `secure: true` всегда, `path=/api/auth`.
2. Если `domain=.balloo.su` нужен для поддоменов — зафиксировать это решением и
   тогда минимум `__Secure-` + явная проверка Origin на `/refresh`.
3. Проверить, что `setCookie`/`clearCookie` вызываются из одного места (сейчас два).

## Как проверить

`curl -I` на login → `Set-Cookie: __Host-balloo_at=...; Secure; HttpOnly; SameSite=Lax; Path=/api/auth`
без `Domain`. Тест `/refresh` с чужим Origin → 403.

## Блокер — СНЯТ решением владельца 09.10.2026

Формулировка владельца: «надо сделать так, чтобы куки читались на всех доменах».

Следствие из этого решения (зафиксировано, чтобы следующая сессия не переспрашивала):

1. **`__Host-` невозможен.** Host-only cookie по спецификации не принимает атрибут
   `Domain`, а без него cookie не уходит на поддомены. Значит вариант тикета
   «`__Host-balloo_at`, убрать domain» отклонён владельцем.
2. Берём **`__Secure-` + `domain=.balloo.su`** — минимальный набор, который даёт
   чтение cookie всеми `*.balloo.su` и при этом привязывает cookie к TLS.

## Что делать (по решению владельца)

1. `packages/server/src/middleware/auth.ts:225-226` — имена
   `balloo-access-token` / `balloo-refresh-token` → `__Secure-balloo_at` /
   `__Secure-balloo_rt`.
2. В `setAuthCookies` (`auth.ts:231-255`) и `clearAuthCookies` (`auth.ts:257-269`) добавить
   `domain: '.balloo.su'` и заменить `secure: isProduction` (строки 239, 249, 260,
   266) на `secure: true` — `__Secure-` без `Secure` браузер отбрасывает.
3. `sameSite` оставить `lax`: кросс-сайт POST на `/api/auth/refresh` с ним не
   проходит, CSRF-поверхность закрывает пункт 4.
4. Проверка `Origin`/`Sec-Fetch-Site` на `POST /api/auth/refresh` и
   `/api/auth/refresh-cookie`: совпадение с `CORS_ORIGIN` (список уже в
   `config/env.ts:35-42`), иначе 403.
5. Домены вынести в env (`COOKIE_DOMAIN`), чтобы `localhost` не требовал правки кода.

## Следствия, которые надо принять перед правкой

- Смена имён cookie **ломает активные сессии**: старые cookie браузер продолжит
  слать под старыми именами, сервер их не прочитает → пользователей разлогинит.
  Это же отмечено в `README.md:256`.
- `secure: true` всегда: локальная разработка по `http://localhost` работает
  (localhost — secure context), но стенд по IP без TLS перестанет логиниться.

## Как проверить

`curl -I` на login → `Set-Cookie: __Secure-balloo_at=...; Secure; HttpOnly;
SameSite=Lax; Domain=.balloo.su; Path=/`. Тест `POST /api/auth/refresh` с чужим
`Origin` → 403, со своего поддомена → 200. `pnpm --filter @balloo/server test`.

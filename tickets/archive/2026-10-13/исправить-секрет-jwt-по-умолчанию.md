# исправить: секрет JWT по умолчанию (критично)

**Слой:** 1 (аутентификация). **Найдено:** 08.10.2026, аудит по сессии.

## Что найдено

Значение по умолчанию `dev-secret-key-change-in-production` подставляется, если
`JWT_SECRET` не задан, в четырёх местах:

- `packages/server/src/config.ts:41`
- `packages/server/src/index.ts:116`
- `packages/server/src/middleware/auth.ts:14`
- `packages/server/src/middleware/socket-auth.ts:14`

В `docker-compose.yml` (13 сервисов, строки 135/185/245/297/335/405/474/542/584/637/686/729/768)
и в `docker-compose.test.yml:22` — `JWT_SECRET=${JWT_SECRET:-dev-secret-key-change-in-production}`.

## Риск

Подпись токена предсказуемым секретом = вход под любым пользователем, если на
боевом сервере переменная не проставлена. Молча, без ошибки на старте.

## Что сделать

1. Во всех четырёх местах: отсутствие `JWT_SECRET` → `throw` на старте (fail-fast),
   без значения по умолчанию.
2. В обоих compose-файлах: убрать `:-dev-secret-key-change-in-production`, оставить
   `JWT_SECRET=${JWT_SECRET:?JWT_SECRET не задан}`.

## Как проверить

`JWT_SECRET= docker compose config` → падает с внятным сообщением;
`pnpm -F server test` зелёные; отдельный тест «без JWT_SECRET сервер стартует с ошибкой».

## Связь с решениями владельца

Не противоречит: ротация и чистка истории секретов отложены (решения №3, №8),
здесь только закрытие fallback-значения.

## Закрыт 09.10.2026 — неактуален (проверено по коду, Ksyusha)

| Утверждение тикета | Факт | Команда |
|---|---|---|
| fallback `dev-secret-key-change-in-production` в 4 местах | совпадений нет нигде | `grep -rn "dev-secret-key-change-in-production" packages/server/src docker-compose*.yml docker/prod/*.yml` -> 0 строк |
| секрет подставляется по умолчанию | `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` = `z.string().min(32)` **без default**, `envSchema.parse()` падает на старте | `packages/server/src/config/env.ts:16-17`, `:87` |
| файлы `config.ts`, `middleware/socket-auth.ts`, `services/auth.ts` | не существуют | `ls packages/server/src/config.ts` -> Нет такого файла |

Fallback-значения нет -> закрывать нечего.

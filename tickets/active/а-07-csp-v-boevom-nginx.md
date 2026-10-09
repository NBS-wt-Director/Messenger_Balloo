# исправить: CSP нет в боевом nginx (только в примере)

**Слой:** 3 (транспорт). **Найдено:** 08.10.2026, аудит по сессии.

## Что найдено (проверено 09.10.2026 по фактическим файлам)

> Предыдущие ссылки были ложными: `docker/prod/nginx.conf`,
> `docker/prod/templates/balloo.conf`, `docker/prod/nginx.conf.example` — таких
> файлов в репозитории нет (`ls docker/prod/`). Ниже — реальные пути.

- `docker/nginx.conf:41` — CSP **есть**, но с `'unsafe-inline'` в `script-src` и
  `style-src`: XSS-защита CSP этим обесценивается (то же отмечено как «б-3» в
  `tickets/security-audit-2026-06.md`).
- `docker/prod/nginx-production.conf` — боевой конфиг: заголовки `X-Frame-Options:
  SAMEORIGIN` (`:61`), `X-Content-Type-Options: nosniff` (`:62`), `Referrer-Policy`
  (`:64`), `Permissions-Policy` (`:65`), HSTS (`:141`, `:197`). **CSP нет** —
  `grep -rln "Content-Security-Policy" docker/prod/` → 0 файлов.
- `docker/prod/nginx/balloo-docker.conf` — **ни одного `add_header`**
  (`grep -c "add_header" → 0`): если этот файл подключается на проде, статика
  уходит вообще без security-заголовков.
- `packages/server/src/middleware/security.ts:40` — helmet закрывает CSP только на
  API (`contentSecurityPolicy`), статику SPA он не касается.

## Риск

Статика SPA (balloo.su, history, download) отдаётся без CSP: XSS во фронтенде не
ограничен источником скриптов; кликджекинг закрыт только `X-Frame-Options` (устаревшая
защита против современных браузеров без CSP).

## Что сделать

1. Перенести CSP из `nginx.conf.example` в `docker/prod/nginx.conf` и в
   `docker/prod/templates/balloo.conf`, плюс `add_header ... always` на 4xx.
2. Проверить, что SPA-сборка (Vite, инлайн-модули, YM Metrika, VK Pixel) не ломается:
   `script-src 'self' https://mc.yandex.ru https://apis.vk.ru` и т.д. по факту.
3. `report-to`/`Content-Security-Policy-Report-Only` на неделю — только после
   подтверждения владельцем, что репорты нужны.

## Как проверить

`curl -sI https://balloo.su | grep -i content-security-policy` → заголовок есть;
`pnpm -F web build` и прогон e2e-спеков без ошибок CSP в консоли браузера.

## Блокер

Применение на сервере (`nginx -t` + reload) — **только владелец** (решение №7).
Файл в репозитории я правлю сама.

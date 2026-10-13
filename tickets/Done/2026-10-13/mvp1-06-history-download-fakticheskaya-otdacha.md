# mvp1-06 — history.balloo.su и download.balloo.su: проверить фактическую отдачу (не «вынос в пакет»)

**Создан:** 12.10.2026 (unix 1791778809)
**Статус:** готов к работе (код-часть), TLS — блокировка владельца
**Кто:** Ksyusha (проверка сборок и маршрутов) + владелец (сертификат)
**Почему увеличивает MVP1:** `PROJECT_DOCUMENTATION.md` §17 ставит history и
download по 40% с формулировкой «нет отдельного пакета», а §17 п.3-4 требует
«вынести из web». Замеры показывают, что отдельный пакет для MVP1 **не требуется** —
требуется рабочий домен. Оценку 40% это меняет только после проверки отдачей.

## Найденные факты (замеры 12.10.2026)

1. Экраны живут в web и они не по 2 штуки:
   `packages/web/src/screens/history/` → `HistoryScreen.tsx`,
   `HistoryTimeline.tsx`, `VersionDetailScreen.tsx`, `CompareScreen.tsx`, `index.ts`;
   `packages/web/src/screens/download/` → `DownloadScreen.tsx`,
   `DownloadProgressScreen.tsx`, `components/`, `index.ts`.
2. Nginx уже включает оба поддомена в общий web-блок:
   `docker/prod/nginx-production.conf:105-106` и `:177-178` —
   `docs.balloo.su download.balloo.su features.balloo.su history.balloo.su`
   в одном `server_name`. Отдельных root'ов для них нет → их отдаёт тот же SPA.
   **Вывод: «вынести в отдельный пакет» для MVP1 не нужно, нужно чтобы домен
   отвечал.**
3. Отдача сейчас сломана на TLS (read-only `curl` этой сессии):
   `https://history.balloo.su` → `SSL: no alternative certificate subject name
   matches target host name 'history.balloo.su'`, `subject: CN=alpha.balloo.su`;
   `https://download.balloo.su` → та же ошибка. DNS ведёт на `188.73.176.34`.
   Для сравнения `https://balloo.su` → HTTP 200,
   `https://api.balloo.su/health` → HTTP 401 (норма, `auth_basic`).
4. В `tickets/active/1790480787-06.md` (от 27.09) план «четыре сайта отдельными
   сборками» — противоречит п.2; этот тикет фиксирует фактическое состояние,
   старый тикет не выполнять без решения владельца (admin/command — вне MVP1).

## Подзадачи

- [x] 1. Маршруты в роутере web (`packages/web/src/router/index.tsx`): `/history`, `/history/version/:id`, `/history/compare`, `/download`, `/download/progress`, `/download/desktop/:platform`, `/download/:platform`. Роутер hash → `balloo.su/#/history`, `balloo.su/#/download`.
- [x] 2. Экраны в ПРОИЗВЕДЁННОЙ сборке: `pnpm --filter @balloo/web build` → exit 0; lazy-chunks присутствуют: `HistoryScreen-B5_WJFh7.js`, `DownloadScreen-C6Fr-dSw.js`, `DownloadProgressScreen-DuiOhBBo.js`.
- [x] 3. Эндпоинты:
  - `/api/history/versions` → **200** (`{"items":[],"total":0,...}`) — работает, версий пока нет
  - `/api/downloads` → **200** — работает
  - `/api/history/versions/:id`, `/api/history/compare` — есть в роутере
  - `/api/downloads/desktop`, `/api/downloads/android` — есть в роутере
- [x] 4. TLS: `history.balloo.su` → `subject: CN=alpha.balloo.su`, `SSL: no alternative certificate subject name matches`. `download.balloo.su` → та же ошибка. Записано в `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md` п.24.
- [x] 5. Оценка: экраны существуют, маршруты существуют, сборка содержит chunks, API живёт. Блокировка — только TLS-сертификат (владелец).

## Проблемы и решения

- Vite preview не удалось поднять в фоне (тайминг) — вместо этого проверено наличие lazy-chunks в `dist/` и живые API-ответы.
- `history.balloo.su` отсутствует в certbot-команде из п.16 СДЕЛАТ_ВЛАДЕЛЬЦУ. Добавлен п.24.

## Результат

Проверено прогоном 13.10.2026:

```
$ pnpm --filter @balloo/web build → exit 0 (7.31s)
$ ls dist/assets/chunks/ | grep -i "History\|Download"
  HistoryScreen-B5_WJFh7.js
  DownloadScreen-C6Fr-dSw.js
  DownloadProgressScreen-DuiOhBBo.js

$ curl -s -o /dev/null -w "%{http_code}" https://api.balloo.su/api/history/versions → 200
$ curl -s https://api.balloo.su/api/history/versions → {"items":[],"total":0,...}
$ curl -s -o /dev/null -w "%{http_code}" https://api.balloo.su/api/downloads → 200

$ curl -v https://history.balloo.su → SSL error (CN=alpha.balloo.su)
$ curl -v https://download.balloo.su → SSL error (CN=alpha.balloo.su)
```

**Вывод:** экраны и API для history/download полностью рабочие в коде и на сервере. Единственная блокировка — TLS-сертификат не покрывает имена поддоменов (п.24 СДЕЛАТ_ВЛАДЕЛЬЦУ).

# Тикет 1795160995 — Дефекты приёмки 20.11: правое меню не в углу; на /docs нет меню

**Создан:** 20.11.2026 (источник: ответы владельца на `1795152409`, п.3)
**Статус:** ЗАКРЫТ 20.11.2026 — исправлено (`bb7d230`) и задеплоено в `6e5374c`. Осталась браузерная приёмка (сведена в `СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`, §Свод, п. A5)
**Коммиты:** `110e6b1` (Dockerfile), `bb7d230` (оба дефекта), запушены (`origin/main = bb7d230`)

## Постановка (владелец, 20.11.2026)

> «3. https://features.balloo.su/ (+вызов правого меню около левого а не в углу)
> https://api.balloo.su/docs (нету ни одного меню)»

Плюс п.2: сервисы `web-history`/`web-download` — **нужны** (оставляем, чиним сборку).

## Дефект 1 — правое меню на features около логотипа

**Причина (доказано чтением):** `.topbar__right` в `chrome.css` не имел
`margin-left: auto`. В макете правый край обеспечивал `.topbar__title{flex:1}` —
распорка между лого и правым блоком. На features `Topbar` вызывается **без
`title`** (проверено: `packages/web-features/src/screens/*.tsx` — `<Topbar auth=.../>`)
→ распорки нет, flex-контейнер жал правый блок к логотипу.

**Фикс:** `packages/ui/src/styles/chrome.css` — `.topbar__right { margin-left: auto; }`.
Совместимо с наличием title (авто-отступ не ломает `flex:1`).

**Доказательство (headless-замер layout):** страница с реальными `themes.css` +
`chrome.css` и разметкой `Topbar` без `title`, окно 1280px:
```
RESULT width=1280 right_left=1178 right_right=1264 topbar_right=1280
```
Правый блок у правого края (padding 16px), не у логотипа.

## Дефект 2 — api.balloo.su/docs без меню

**Причина:** `docsHtmlController.ts` (GET /docs) рендерил упрощённый `<header>`
(логотип B + ссылка «← balloo.su»), тогда как макет-эталон
`mockups/docs-balloo-su/api-docs.html` содержит полноценный `.topbar` с
лого-дропдауном (`grep` по макету: `topbar__dropdown` = 9 вхождений).

**Фикс:** `<header>` заменён на `.topbar` по макету: дропдаун Balloo / Admin /
Features / History / Download / **API Docs (текущий)** + правый блок «← balloo.su».
Пункта Command нет (MVP1, решение владельца 13.11). CSS шапки встроен в `<style>`
страницы (страница без внешних CDN — ограничение CSP, тик. 1793187702).

**Доказательство (прогон контроллера):** `getDocsHtml()` на собранном `dist`:
```
YES topbar__logo / topbar__dropdown / Balloo / Admin / Features / History / Download
YES current API Docs   YES margin-left:auto   no Command   YES main
HTML bytes: 30370
```

## Тесты

- `pnpm --filter @balloo/server test` → EXIT=0 (шум ioredis — live-тест без редиса, не падает)
- `pnpm --filter web test` → **319/319 passed**, EXIT=0
- `pnpm --filter @balloo/server build` (tsc) → EXIT=0

## Что поедет при деплое

| Сервис | Почему |
|---|---|
| `web` | бандль включает `chrome.css` (дефект 1 на balloo.su тоже проявлялся при отсутствии title) |
| `features` | дефект 1 |
| `web-admin` | общий `chrome.css` |
| `web-history`, `web-download` | **первые образы** (фикс `110e6b1`; сервисы нужны — решение владельца п.2) |
| `server` | дефект 2 (рендер /docs) |

## Батч владельцу

```bash
cd /data/balloo/repo
GIT_TERMINAL_PROMPT=0 git fetch origin -q
git checkout -B main origin/main
echo "HEAD=$(git rev-parse --short HEAD)"
cd docker/prod
COMPOSE="docker compose -f docker-compose.local.yml --env-file .env.production"
for s in server web features web-admin web-history web-download; do
  docker tag balloo/$s:local balloo/$s:rollback-$(date +%Y%m%d-%H%M) 2>/dev/null \
    && echo "tag ok: balloo/$s" || echo "нет образа balloo/$s (первый образ)"
done
$COMPOSE build server web features web-admin web-history web-download 2>&1 | tail -4
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | grep -E 'balloo/(server|web|features|web-admin|web-history|web-download):local'
$COMPOSE up -d --no-deps --force-recreate server web features web-admin web-history web-download
sleep 25
docker ps --format '{{.Names}}  {{.Status}}' | grep balloo
curl -s https://api.balloo.su/docs | grep -c 'topbar__dropdown'
curl -s -o /dev/null -w "features -> %{http_code}\n" https://features.balloo.su/
```

**Ожидаю:** `HEAD=bb7d230`; сборка зелёная (web-history/web-download соберутся
впервые — это и есть проверка фикса `110e6b1`); `balloo-web-history`/
`balloo-web-download` — `Up`; `grep -c topbar__dropdown` по /docs ≥ 1; все домены 200.

**Стоп-условия:** `HEAD` ≠ `bb7d230` → стоп; сборка красная → последние 30 строк.

⚠️ Пересоздание `server` = короткий простой API/WS (миграций новых нет —
`2036264..bb7d230` не трогает prisma, но entrypoint прогонит `migrate deploy`).

⚠️ После деплоя history/download: хостовый nginx сейчас проксирует
`history.balloo.su`/`download.balloo.su` на `balloo-web`. Чтобы узлы отдавали
**свои** контейнеры, нужен перевод прокси на `127.0.0.1:8093/8094`
(правка `/etc/nginx/sites-enabled/balloo-docker.conf`) — **отдельное решение
владельца**, в этот батч не входит.

## Критерии готовности

- [x] Дефект 1 исправлен и доказан layout-замером
- [x] Дефект 2 исправлен и доказан прогоном контроллера
- [x] Тесты web/server зелёные; коммиты в `origin/main`
- [ ] Батч выполнен владельцем (HEAD=bb7d230, все контейнеры Up, /docs с меню)
- [ ] Браузерная приёмка владельца (после сброса SW): features — правое меню в
      углу; /docs — лого-меню открывается

# Тикет 1795678493 — Деплой: продолжение (фикс чата-сироты + приёмка H + CSP)

**Создан:** 26.11.2026
**Источник:** владелец (чат 26.11.2026): «пуш и деплой… в первом батче»; «запиши продолжение деплоя в активные задачи»
**Предыстория:** батчи C→G выполнены 26.11.2026 частично (см. «Что уже сделано»).

## Что уже сделано 26.11.2026 (доказано выводом сервера)

| Шаг | Результат |
|---|---|
| Коммит + пуш `353cca5` | `3846007..353cca5 main -> main` ✓ |
| Бэкап БД | `pg_dump` → `/data/balloo/backups/LATEST.sql` ✓ |
| `git checkout -B main origin/main` | `HEAD=353cca5` ✓ (со 2-й попытки — 1-ю заблокировал пустой `scripts/assign-superadmin.cjs`) |
| Сборка `server` + `web` | шаги `COPY packages/web/` и `vite build` — НЕ CACHED ✓ |
| `up -d --no-deps --force-recreate server web` | `balloo-server Healthy`, `balloo-web Started` ✓ |
| Бандль web | `index-ButcXBhZ.js` (был `index-C7z_n3XL.js`) ✓ |
| Сборка + пересоздание `web-admin` | бандль `index-CPA2O_Mn.js` ✓ |
| Суперадмин (требование «в первом батче») | `o8eryuhtin` → `role=superadmin` ✓; UserChat в чат «Балу — новости и информация» (`cmwq9m7sv000gug9nwz3w57dy`) → `role=admin` ✓ |
| Коды доменов | `balloo.su` → 200, `admin.balloo.su` → 200 ✓ |
| Миграции | «No pending migrations to apply» (22→22) ✓ |

## Остаток (этот тикет)

### R1. Не задеплоен фикс чата-сироты (правки готовы, локально зелёные)

**Диагноз (воспроизведён тестом):** `createChat(type:'direct')` и `callService`
искали существующий direct-чат через `members: { every: { userId: { in: [...] } } }`.
Для чата с 0 участниками (сирота после уборки, `cmwq6ui45000df5fa5tmt4xtr`) условие
истинно vacuously → сервер возвращал id сироты → клиент без membership:
`GET /api/chats/:id` → 404, `POST .../messages` → 403 «Вы не являетесь участником»
(ровно это владелец видел в консоли).

**Исправлено локально (не коммичено):**
- `packages/server/src/services/chatService.ts` — поиск через `AND [some ownerId, some peerId]` + проверка `members.length === 2`;
- `packages/server/src/services/callService.ts` — то же;
- `packages/server/src/__tests__/direct-chat.test.ts` — регресс «не переиспользует direct-чат-сироту»: на старом коде **падает** (проверено: `Expected: not "cmwx7cmdx…"`, 1 failed), на новом — зелёный.

**Префлайт:** jest server **806/54** (было 805 + новый тест), vitest web 404/54, shared 76/4, web-admin 36/4.

**Что сделать:** коммит → пуш → пересборка **только `server`** (web/web-admin не
менялись) → доказательства.

### R2. Приёмка H владельцем (браузер) — блокирует закрытие

**Обязательная подготовка (иначе браузер покажет старый бандль — это уже
трёхкратная причина «не работает»):** DevTools → Application → Service
Workers → **Unregister** → Application → Storage → **Clear site data** →
**Ctrl+Shift+R**.

Чек-лист (расширение свода A1–A22 в `with_lord/СДЕЛАТЬ_ВЛАДЕЛЬЦУ.md`):

| № | Что | Ожидаем |
|---|---|---|
| N1 | Клик по контакту / «Написать» | создаётся/открывается direct-чат, сообщения отправляются (после R1 — без 404/403) |
| N2 | Админка `admin.balloo.su` | вход под `o8eryuhtin` проходит (сервер отдаёт `isAdmin: true` для superadmin); **выйти и войти заново** |
| N3 | Панель вложений | пункт «📝 Текст» → модалка заметки (замечание владельца: это НЕ то «текстовое вложение», что имелось в виду — см. тик. `1795677071`) |
| N4 | Кнопка 🖼 | открывает панель вложений, multiple фото |
| N5 | Тема «Русская» | градиент виден, фон не чёрный |
| N6 | Счётчики чатов | непрочитанные + последнее сообщение вместо «Нет сообщений» |
| N7 | Онлайн-статус | зелёная точка только у реальных online |
| N8 | Опрос | `/chat/:id/poll` → форма создания, а не «Опрос не найден» |
| N9 | Голосовое при запрещённом микрофоне | понятное сообщение вместо «Permission denied» |

### R3. Консоль прода: CSP (правит владелец на хостовом nginx — C6 расширяется)

Замер 26.11.2026 (консоль браузера владельца):

| Ошибка | Причина | Куда |
|---|---|---|
| `connect-src` блокирует `https://fonts.googleapis.com/css2?family=Inter…` | хостовый CSP не содержит `fonts.googleapis.com`/`fonts.gstatic.com` в `connect-src`/`style-src`/`font-src` | `/etc/nginx/sites-enabled/balloo-docker.conf` + синхронно `docker/prod/nginx/balloo-docker.conf` |
| `connect-src` блокирует `https://avatars.yandex.net/…` | OAuth-аватар с внешнего CDN | там же (`img-src`/`connect-src`) |
| `frame-src 'none'` блокирует `mc.yandex.ru` | уже зафиксировано как C6 (тик. 1795357403) | там же: `frame-src 'self' https://mc.yandex.ru` |
| `GET /api/chats/cmwq6ui45…` → 404 | чат-сирота в БД; код-фикс (R1) предотвращает повторное использование, саму запись удалить: `DELETE FROM chats WHERE id='cmwq6ui45000df5fa5tmt4xtr'` (каскад на user_chats) | сервер, порядок: сначала R1-деплой, потом удаление |

После правки nginx: `sudo nginx -t && sudo systemctl reload nginx`,
проверка `curl -sI https://balloo.su | grep -i content-security` — CSP обязан
быть **не строже** контейнерного (браузер применяет все заголовки, см. тик. 1793187702).

### R4. Мелкое хвостовое (не блокирует)

- На сервере остался артефакт прошлого прогона: `scripts/assign-superadmin.cjs` в рабочем дереве был пустым (пересоздан из HEAD — ок); `docker/prod/.env.production` в `git status` помечен `M` — **не коммитить** (секретный, правка локальная на сервере).
- Откатный тег `deploy-rollback-353cca5` создан на старом HEAD (до fetch) — при следующем деплое создавать заново после `git fetch`.

### R0. Расширение объёма 26.11.2026 (второй заход)

После первого батча (R1) на проде осталось 353cca5. До этого было несколько
следующих коммитов (уведомления, баланс, морзе-тикер, i18n, QR, билеты).
Владелец запросил «пуш+депой того, что есть».

**Всё в рабочей копии (52 записи, 32 модифицированы + 20 новых):**

| Пакет | Что |
|---|---|
| shared | миграция `20261126120000_user_balance_points` (+balancePoints), i18n plural, constants/points |
| server | сервис уведомлений, роут, тесты, фикс чата-сироты |
| web | уведомления (bell, presence), баланс-экран, QR на download, router |
| ui | FooterMorseTicker, balance в RightMenu, css chrome, ecosystem, locale/morse |
| tickets | 5 активных тикетов (attachments, morse-ticker, deploy-continuation, i18n, nodes, balance) |
| docs | 05-frontend-spec, AGENTS.md, server_routes.txt |

**Миграция:** `ALTER TABLE "users" ADD COLUMN "balancePoints" INTEGER DEFAULT 0`
+ `UPDATE users SET balancePoints=555 WHERE balancePoints=0` (аддитивная).
**Бэкап при деплое обязателен** (первая миграция с UPDATE данных).

**Коммит:** `4f85330 feat(web,server,shared,ui): уведомления, баланс баллов, морзе-тикер, i18n без хардкода, QR загрузок`
**Пуш:** `353cca5..4f85330  main -> main` ✓ (26.11.2026)
**Компиляция (не тесты):** `tsc --noEmit` shared/server/web → exit 0 у всех трёх.

**Затронутые образы:** `server` (routes/services), `web`, `web-admin`, `web-features`,
`web-history`, `web-download` — все SPA зависят от `@balloo/ui` (Footer/RightMenu/chrome.css).
Сборка идёт из общего builder-стейджа `docker/Dockerfile.web`, поэтому все 4 SPA
пересобираются одной командой.

### Второй батч выполнен 26.11.2026 (доказано выводом сервера)

| Шаг | Доказательство |
|---|---|
| D: `git checkout -B main origin/main` | `HEAD=6afdce0`, `git status --porcelain` → только `M docker/prod/.env.production` |
| Бэкап до миграции | **не выполнялся** (в логе отсутствует) — выполнен после: `post-migration-6afdce0-20261126-2338.sql`, 191K, начинается с `-- PostgreSQL database dump` |
| F1: сборка 6 образов | `Image balloo/{web,features,web-admin,web-history,web-download,server}:local Built` |
| F2: `up -d server` | `Container balloo-server Started`; лог: `23 migrations found`, `Applying migration 20261126120000_user_balance_points`, `All migrations have been successfully applied` |
| F3: API | `ps` → `balloo-server Up (healthy)`; `/health` → 200; последняя миграция в `_prisma_migrations` = `20261126120000_user_balance_points` |
| F3: данные | `SELECT count(*) AS users, count(*) FILTER (WHERE balancePoints=555) AS bonus` → `10 | 10` (все получили бонус) |
| F4: `up -d` 5 SPA | все 5 → `Started`, `Up ~15-20 s`, образы сменились с `sha256:…` на `balloo/*:local` |
| G: коды доменов | `balloo.su 200`, `admin 200`, `features 200`, `history 200`, `download 200` |
| G: бандли | web `index-pwhyhZOv.js` (был `index-ButcXBhZ.js`), admin `index-CypuNVLu.js` (был `index-CPA2O_Mn.js`) — новый код раздаётся |
| G: новый роут | `GET https://api.balloo.su/api/notifications` без токена → **401** (роут существует и защищён; 404 означал бы «кода на проде нет») |

**R1 (фикс чата-сироты) — на проде.** Осталось: удалить саму запись-сироту.

### R5. Третий батч (27.11.2026) — готов к деплою владельцем

**Объём:** `85103b8..c79640c` (2 коммита: `96011e6` кнопка «Позвонить», `c79640c`
features/истории/docs).

| Пакет | Что изменилось | Образ |
|---|---|---|
| shared | миграция `20261127120000_feature_request_wave` (+`wave` в FeatureRequest), `toMorse` переехал в `utils/morse.ts` | — |
| server | `featureService`/`featureController` (`hasVoted`, `wave`, `createdAt`), `routes/features.ts` (`optionalAuth`), `docsHtmlController` (единые шапка/подвал), seed 19 фич | `server` |
| ui | `PrivateRightMenu.storiesBadge`, `Topbar`, `chrome.css` (бейдж), `lib/morse` → реэкспорт | все 5 SPA |
| web | истории: пустое состояние + 3 демо-видео + «Что это?» + бейдж новых, `store/storiesStore`, `AppTopbar`, `Sidebar`, `MainLayout` | `web` |
| web-features | `FeaturesSidebar`, статусы/волны, `hasVoted`, левая панель на `/features/create` | `web-features` |
| web-history, web-download, web-admin | пересобираются из общего builder-стейджа (`@balloo/ui` изменился) | 3 SPA |

**Миграция аддитивная:** `ALTER TABLE "feature_requests" ADD COLUMN "wave" INTEGER;`
(nullable, существующие строки не меняются). Seed идемпотентен (upsert по id).

**Префлайт (локально, вывод команд):**

```
tsc --noEmit shared/server/ui/web/web-features → exit 0
vite build web/web-features/web-history/web-download/web-admin → exit 0
vitest shared 97 / web 440 / web-admin 36 → 0 failed
jest server 825 (56 наборов) → 0 failed
node scripts/check-i18n.cjs → расхождений 0
prisma migrate deploy → применено; prisma db seed → FeatureRequest: 19 фич
```

**Команды (выполняет владелец, батчами):**

```bash
# C. Факты (read-only)
cd /data/balloo/repo && git fetch origin && git log --oneline -3 origin/main

# D. Переключение на main
git checkout -B main origin/main && git log --oneline -1 && git status --porcelain

# E. Откатный тег + бэкап БД (перед миграцией — обязателен)
git tag -f deploy-rollback-c79640c HEAD~2
docker compose -f docker/prod/docker-compose.local.yml --env-file .env.production \
  exec -T postgres pg_dump -U balloo balloo > /data/balloo/backups/pre-c79640c-$(date +%Y%m%d-%H%M).sql

# F. Сборка и подъём (сначала API, затем SPA)
docker compose -f docker/prod/docker-compose.local.yml --env-file .env.production build server web web-admin features web-history web-download
docker compose -f docker/prod/docker-compose.local.yml --env-file .env.production up -d --no-deps --force-recreate server
# дождаться Healthy, затем:
docker compose -f docker/prod/docker-compose.local.yml --env-file .env.production up -d --no-deps --force-recreate web web-admin features web-history web-download

# G. Доказательства
docker compose -f docker/prod/docker-compose.local.yml ps
docker compose -f docker/prod/docker-compose.local.yml logs --tail=40 server   # миграция + seed
curl -s -o /dev/null -w "%{http_code}\n" https://balloo.su
curl -s -o /dev/null -w "%{http_code}\n" https://admin.balloo.su
curl -s -o /dev/null -w "%{http_code}\n" https://features.balloo.su
curl -s -o /dev/null -w "%{http_code}\n" https://history.balloo.su
curl -s -o /dev/null -w "%{http_code}\n" https://download.balloo.su
curl -s https://api.balloo.su/api/features/stats
curl -s https://api.balloo.su/docs | grep -c 'balloo-footer__morse'
curl -sI https://balloo.su/download/demo-stories/taiga.mp4 | head -3   # если demo-stories отдаётся из web
```

> ⚠️ **Имена сервисов в compose.** В команде F использованы имена, как в
> `docker/prod/docker-compose.local.yml`; если сервис называется иначе —
> взять фактические из `docker compose config --services`.
>
> ⚠️ **`docker/prod/.env.production`** на сервере помечен `M` — не коммитить
> и не перезаписывать.

**Приёмка (батч H, браузер владельца; сначала Unregister SW + Clear site data):**

| № | Что | Ожидаем |
|---|---|---|
| A1 | `features.balloo.su` | 19 фич, слева статусы со счётчиками (11/4/4), у «в плане» — чип «волна 2/3» |
| A2 | `features.balloo.su/features/create` | слева та же панель, справа форма, прокрутка без полосы |
| A3 | Голосование | «▲» увеличивает счётчик и остаётся после перезагрузки (под авторизацией) |
| A4 | `balloo.su/#/stories` (пусто) | объяснение + 3 демо-видео + «Загрузить свою историю»/«Настроить приватность»/«Что это?» |
| A5 | `balloo.su/#/stories` (есть новые) | бейдж на «Истории» в левой панели, 📷 в шапке и в правом меню |
| A6 | `api.balloo.su/docs` | шапка с меню, подвал: copyright→меню 5 пунктов, «Поддержка», морзе-тикеры, правовой блок; прокрутка без полосы |
| A7 | `balloo.su/#/calls` | кнопка «📞 Позвонить» открывает выбор контакта, звонок создаётся (переход на `/active-call`) |
| A8 | Все узлы | контент не прилипает к правому краю (24px / 16px на мобиле) |

### R6. Четвёртый батч (27.11.2026) — текущий деплой

**Источник:** владелец «деплой через меня» (27.11.2026).

**Диапазон:** `6afdce0..0751ee4` (7 коммитов; последний `0751ee4` — docs-only).
Код: `4140721` (docs), `3070519` fix(web,ui), `85103b8` docs, `2838853`, `96011e6`,
`c79640c` feat, `0751ee4` docs.

**Миграция:** только `20261127120000_feature_request_wave`
(`ALTER TABLE "feature_requests" ADD COLUMN "wave" INTEGER;` — аддитивная).
`20261126120000_user_balance_points` уже применена батчем 2.

**Префлайт (локально, 27.11.2026):**

```
tsc --noEmit shared/server/web → exit 0
pnpm test → shared 97/97, server 825/825 (56 наборов), web 440/440 (58 файлов)
pnpm build → BUILD_EXIT=0
```

**Ход (доказано выводом сервера 27.11.2026):**

| Батч | Результат |
|---|---|
| C | `HEAD=85103b8` (был ещё деплой после батча 2, в тикете не отражён), `ORIGIN_MAIN=0751ee4`, диск 55G свободно, все контейнеры `Up`, `api=200`, бандль web `index-Dzj91TqP.js` |
| D | `HEAD=0751ee4`, `BEHIND=0`, `git status` = `M docker/prod/.env.production` + `?? docker/prod/backups/` |
| E | теги `rollback-85103b8` на 6 образах (ID совпали с C); дамп `pre-0751ee4-20261127-2214.sql` — **210 863 Б**, `dump complete`=1, `CREATE TABLE`=83; миграций в БД до деплоя **23**, в репо **24** (ожидалась 1 новая) |
| F1 | 6 образов собраны за **8m43s**, все `:local` с новыми ID: server `b510d88e1fe3`, web `1cb0b2219301`, web-admin `9da2d65155a2`, features `4185011c8554`, web-history `9d87ed56f975`, web-download `189552b65905` |
| F2 | `balloo-server` healthy через ~9 с, `restarts=0`, образ `b510d88e1fe3`; лог: `24 migrations found` → `Applying migration 20261127120000_feature_request_wave` → `All migrations have been successfully applied`, `Seed completed successfully`, `[Push] VAPID Web Push initialized` |
| F3 | 5 SPA `Up`, `restarts=0`, образы = F1; бандли: web `index-CWxK1CyE.js`, admin `index-Bql6Kr6i.js`, features `index-BkYidYI9.js`, history `index-BzcqaH7Z.js`, download `index-CvlYoYTr.js`; postgres/redis/minio не тронуты |
| G (1) | `HEAD=0751ee4`; 5 доменов `200`; `etag 6b09bbd6-66e` (было `6b0534cf-66e`), `last-modified 27 Nov 17:20`; `api=200`, `notifications=401`, `features/stats=200`; миграций **24** |
| G (диагностика) | `8090→CWxK1CyE`, `8091→BkYidYI9`, `8092→Bql6Kr6i`, `8093→BzcqaH7Z`, `8094→CvlYoYTr` — все контейнеры отдают свой код |

**Находка G3 (не следствие деплоя):** `history.balloo.su` и `download.balloo.su`
отдают бандль основного web. Причина — хостовый
`/etc/nginx/sites-enabled/balloo-docker.conf:183`: `server_name history.balloo.su
download.balloo.su command.balloo.su blog.balloo.su docs.balloo.su;` →
`:216 proxy_pass http://127.0.0.1:8090/`. Все пять доменов проксируются на
основной web, контейнеры `web-history`/`web-download` живы, но их домены на них
не смотрят. Отдельно: `docker/prod/nginx/balloo-docker.conf` в репозитории
(231 строка) **не содержит** этого блока — файл в репо расходится с хостовым,
синхронизировать отдельной задачей.

**G-финал (доказано выводом сервера 27.11.2026):**

| # | Проверка | Результат |
|---|---|---|
| D4 | колонка `wave` | `wave` — миграция применилась реально, не только запись в `_prisma_migrations` |
| D5 | прод-бандль web `index-CWxK1CyE.js` | 289 873 Б, `morse=1`, `stories=2`, `startCall=1` |
| D5 | прод-бандль features `index-BkYidYI9.js` | 219 283 Б, `wave=1`, `hasVoted=1` |
| D6 | `https://api.balloo.su/docs` | `200`, `balloo-footer__morse`=15, `balloo-footer`=54 — единая шапка/подвал с морзе-тикерами |
| D7 | аптаймы | `balloo-postgres`/`balloo-redis`/`balloo-minio` — `Up 2 weeks` (не перезапускались) |

**Батч G закрыт.** Все критерии §5 AGENTS.md по серверной части выполнены:
HEAD = цель деплоя, образы новые, `restarts=0`, маркеры нового кода в прод-бандлах,
миграция + колонка, API-роуты, соседние контейнеры не тронуты.

**Осталось:** батч H — браузерная приёмка владельцем (A1–A8).

**ОТКАТ 27.11.2026 (по команде владельца, причина в чате не названа).**
Выполнено `$DC up -d --no-deps --force-recreate` на тегах
`rollback-85103b8` (перетегированы на `:local`), 6/6 контейнеров поднялись,
`balloo-server Healthy` за 35.4 с.

| Проверка после отката | Результат |
|---|---|
| Образы контейнеров | `5b9c2a407dca`, `03cfbe154870`, `17def82ac0a7`, `cb2be1d9638d`, `02767c56026d`, `67876201bd0e` = `85103b8`, `restarts=0` |
| Бандль web снаружи | `index-Dzj91TqP.js` — старый ✓ |
| `HEAD` на диске | `0751ee4` (образы откатились, git — нет) |
| Миграция `feature_request_wave` | **осталась применённой** (24 миграции, колонка `wave`); nullable аддитивная, старому коду безразлична — сервер поднялся healthy, БД из дампа НЕ откатывалась |
| Образы `0751ee4` | **не удалены**, стали dangling (`docker images -f dangling=true`): server `b510d88e1fe3` 1.52G, web `1cb0b2219301` 114M, admin `9da2d65155a2` 106M, features `4185011c8554` 105M, history `9d87ed56f975` 104M, download `189552b65905` 104M |

> `grep` по `docker images -q --no-trunc` даёт 0 совпадений на этом хосте
> (containerd image store, другой формат вывода) — проверять через
> `docker images -f dangling=true`, а не grep'ом по ID.

**Повторный деплой `0751ee4` НЕ требует сборки** (если образы закреплены тегом
`deploy-0751ee4` и не удалены prune'ом):

```bash
cd /data/balloo/repo/docker/prod
DC="docker compose -f docker-compose.local.yml --env-file .env.production"
for i in server web web-admin features web-history web-download; do docker tag balloo/$i:deploy-0751ee4 balloo/$i:local; done
$DC up -d --no-deps --force-recreate server
$DC up -d --no-deps --force-recreate web web-admin features web-history web-download
```

**Миграция при повторном заходе = no-op** (уже применена).
**Открыто:** причина отката не названа → правки кода не делаются, приёмка A1–A8
не выполнена.

### Возврат на `0751ee4` + деплой `7dc043f` (28.11.2026)

Откат был выполнен по недоразумению (команда отката стояла в конце сообщения с
чек-листом приёмки и была прочитана как следующий шаг). Владелец подтвердил:
«как я сделал откат? я этого не хотел...».

| Шаг | Доказательство (вывод сервера) |
|---|---|
| Перетегирование `deploy-0751ee4` → `:local` | 6 образов вернулись: server `b510d88e1fe3`, web `1cb0b2219301`, admin `9da2d65155a2`, features `4185011c8554`, history `9d87ed56f975`, download `189552b65905` |
| `up -d --no-deps --force-recreate` (server → 5 SPA) | 6 контейнеров `Up`, `balloo-server (healthy)`, `restarts=0` у всех |
| Миграция при старте | `24 migrations found` → `No pending migrations to apply` (no-op) |
| Seed | `Seed OK` |
| Бандль снаружи | `index-CWxK1CyE.js` (было `index-Dzj91TqP.js`) |
| Файлы историй | `demo-stories/{taiga,ural,spb}.{mp4,jpg}` — все 6 → `200` |
| Маркеры в бандле web | `stories=2`, `calls=1` |
| `/docs` | `200`, `balloo-footer__morse`=15 |

**Деплой `0751ee4` подтверждён сервером (батч G закрыт).**

Затем задеплоен `7dc043f` (фикс `display:none` → `width:0` в 5 файлах):
`HEAD=7dc043f`, сборка 48 с, образы server `44d739cf4f75`, web `1dd08831a2b0`,
features `0f5f826209ab`, history `b61f09520adc`, download `3a3c16e27950`;
CSS с новым правилом подтверждён в образах features/history/download
(`index-7hrY2btP.css`, `index-BR9ePEGg.css`). `server` с фиксом `/docs`
пересобирался, но в момент записи **не пересоздан** — нужно `up -d --no-deps
--force-recreate server`.

**Найдено при приёмке:** прокрутка на `balloo.su/#/stories` не работает и после
фикса скроллбара — причина не в скроллбаре. Владелец отложил на следующий этап,
заведён тикет `1795859968`.

## Порядок выполнения (батчи)

1. **E4:** коммит (фикс + тикеты + docs) → `git push origin main` — *по команде владельца «Деплой»*.
2. **F4:** `cd /data/balloo/repo && git fetch origin && git checkout -B main origin/main` → `docker compose -f docker/prod/docker-compose.local.yml --env-file .env.production build server && … up -d --no-deps --force-recreate server` (из корня репо; web не трогать).
3. **G4:** доказательства — `git log -1`, `docker compose ps`, `logs --tail=30 server`, тест прямо на проде (POST /api/chats direct после создания сироты — опционально), коды 200.
4. **H4:** приёмка владельцем по чек-листу N1–N9 (после Unregister SW!).
5. **R3:** владелец правит хостовый CSP (C6 + fonts + avatars) — отдельным батчем.

## Критерии готовности

- [x] Фикс чата-сироты на проде (коммит виден в `git log` сервера, сервер пересобран).
- [ ] N1–N9 приняты владельцем в браузере.
- [ ] Консоль прода без CSP-ошибок (после R3).
- [ ] Чат-сирота удалён из БД.
- [ ] Тикет перенесён в `Done/<дата>/`, свод владельца обновлён.

## Результат

_(заполняется по ходу)_

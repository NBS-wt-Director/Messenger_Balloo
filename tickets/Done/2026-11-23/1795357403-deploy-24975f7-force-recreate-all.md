# Тикет 1795357403 — Деплой 24975f7 (rate-limits) с пересозданием всех контейнеров

**Создан:** 22.11.2026 (unix 1795357403)
**Статус:** в работе
**Источник запроса:** команда владельца «деплой с пересозданием и перезапуском всех контейнеров»

## Цель

Выложить `24975f7` (тикет `1795343610` — rate-limit 3000/15мин на каждого клиента,
`trust proxy`, 429 не сбрасывает сессию) на прод, **пересоздав все контейнеры**
приложения (server, web, features, web-admin, web-history, web-download).

## Контент деплоя

- Один коммит: `24975f7` = `c42b69a..24975f7` (origin/main обновлён 22.11.2026, push EXIT=0).
- Миграций БД в диапазоне нет (`git diff c42b69a..24975f7 --stat` — только src/tests/docs/tickets).
- Затронуты оба пакета → пересборка **server** и **web** (6 web-образов).

## Решения / отступления от стандартного батча F

- Владелец явно заказал пересоздание ВСЕХ контейнеров → в батче F используется
  `up -d --force-recreate` без `--no-deps` по всем app-сервисам.
- **postgres/redis/minio НЕ пересоздаём** (решение владельца не упоминает их;
  простой БД + риск для сети balloo-net/SMTP = запрещённое действие из ТЗ §9).
  Если владелец хочет их тоже — пометить, дать команду.
- Ожидаемые побочные эффекты (норма для пересоздания server): разрыв всех WS,
  кратковременная недоступность API (start_period 90s на healthcheck).

## Префлайт (этап A) — доказано 22.11.2026

- [x] 1. `git status --porcelain | grep -v '^??'` → 8 файлов тикета 1795343610, закоммичены (`24975f7`, 11 files, +616/−223)
- [x] 2. Тесты поодиночке (параллельный `pnpm test` падает на ws — известный эффект общей тестовой БД, KODA.md §4):
      server `jest --runInBand` EXIT=0 (800 tests), web vitest 49 files/367 tests EXIT=0,
      shared 4 files/76 tests EXIT=0
- [x] 3. `pnpm build` → EXIT=0 (tsc+вite по всем пакетам)
- [x] 4. Этап B: `git push origin main` → `c42b69a..24975f7`, EXIT=0. **Цель деплоя = `24975f7`**

## Батчи (этап C–G — команды выполняет владелец, вывод в чат)

- [x] 5. Батч C — read-only факты (состояние ДО) — **вывод получен 22.11.2026 19:37+05**
- [x] 6. Батч D — `git checkout -B main origin/main` → **HEAD=24975f7** (вывод сервера 22.11.2026)
- [x] 7. Батч E — 6 тегов отката `:rollback-20261122` (пары ID совпадают) + бэкап 177 КБ
- [x] 8. Батч F — сборка 6 образов (`Image ... Built` ×6) + `up -d --no-deps --force-recreate`:
      F1 server (healthy с 1-й проверки, seed OK, `[Push] VAPID Web Push initialized`, WS поднят,
      SMTP verified), F2 web + features + web-admin + web-history + web-download (вывод 22.11.2026)
- [ ] 9. Батч G — доказательства: imageid/started/restart_count, /health, бандли 8090 vs домен
- [ ] 10. Этап H — браузерная приёмка владельца (чек-лист ниже)

## Критерии готовности

1. HEAD на сервере = `24975f7`.
2. Image ID balloo-server/balloo-web отличается от снятого в батче C; restart_count=0.
3. `balloo-server /health` зелёный; миграций применено столько же, сколько до деплоя
   (диапазон без миграций).
4. `assets/index-*.js` с порта 8090 и с `https://balloo.su` одинаков и отличается от батча C.
5. `POST /api/auth/refresh-cookie` не отдаёт 429 при нормальной нагрузке;
   `ratelimit-limit: 3000` в заголовках.
6. Приёмка владельца: холодное обновление вкладки НЕ выбрасывает на /login;
   вход через Яндекс работает; консоль без новых ошибок.

## Браузерный чек-лист (этап H)

- [ ] вход по логину/паролю → запросы идут на `https://api.balloo.su/api/...`
- [ ] холодное обновление (Ctrl+Shift+R) — сессия сохранена
- [ ] вход через Яндекс — возвращает в чаты, не «молча обратно»
- [ ] чат: отправка сообщений работает (WS переподключился после пересоздания server)
- [ ] консоль DevTools без новых ошибок; при старом коде — Unregister SW + жёсткая перезагрузка

## Проблемы и решения

- Параллельный `pnpm test` красный на ws-room/ws (● Timeout) при зелёных пакетных
  прогонах — не блокирует: причина и рецепт зафиксированы в KODA.md §4 и
  `tickets/Done/2026-11-04/1793621823.md`.
- Не закоммичены отладочные cypress-пробники `packages/web/cypress/e2e/zz-samesite.cy.ts`
  и `packages/web/cypress/samesite.json` (untracked, деплой не блокируют). Решение владельца: коммитить/удалить — потом.

## Результат

### Батч C — факты ДО (вывод сервера, 22.11.2026 19:37 +05)

```text
branch=main  HEAD=c42b69a
git status --porcelain (трекаемое): M docker/prod/.env.production
  → файл не менялся в c42b69a..24975f7 (проверено `git diff --stat c42b69a 24975f7 -- docker/prod/.env.production`
    = пусто), checkout его не тронет; прод-секреты сохраняются
fetch: HEAD..origin/main = 1 ; origin/main=24975f7
Стек: web Up 6h, server Up 19h (healthy), features/web-admin/web-history/web-download Up 2 days,
      postgres/redis/minio Up 2 weeks (healthy)

imageid ДО (сверяю после батча F):
  server        sha256:bb0d3486431b0b1807703f2561d0a89a5f2cab6edb2fb5c53278b83c9f6b302f  started=2026-11-21T19:25:40Z restarts=0
  web           sha256:4253f115d0e3c348cf0eca66df740eb7de3a512e9a3393e21e3c0052c4bc3d48  started=2026-11-22T08:53:24Z restarts=0
  features      sha256:bc6579ff176265d68ae7c2543cd89dcf2387f6ad81015806b6c444536aaca8a4  started=2026-11-20T13:31:49Z restarts=0
  web-admin     sha256:3bf73e1087faf62cf9770fccfa2a4ceba52e8de9915fbfd0c594e3a895da2d23  started=2026-11-20T13:31:52Z restarts=0
  web-history   sha256:0907ebfb3d9167d2e449206f15c4b06a3f5adca714b180baa8c7c956b1b54678  started=2026-11-20T13:31:50Z restarts=0
  web-download  sha256:1f666d280840fd4dbbc58a22ef441383781625fbff6e1c6fcd1eebb64aff783c  started=2026-11-20T13:31:48Z restarts=0

Бандль web ДО: index-CYNnwCWL.js
Миграций в БД ДО: 22
POST /api/auth/refresh-cookie ДО: 400  (не 429 — окно лимита на момент замера свободно)
Диск: / = 37G/98G, свободно 56G  ✅ (порог 4G пройден)
docker system df: Images 40 (15 active, 19.43GB, reclaimable 3.128GB), Volumes 1.075GB
```

### Батч D — код на сервере (вывод 22.11.2026)

```text
$ git checkout -B main origin/main
M       docker/prod/.env.production
branch 'main' set up to track 'origin/main'.
Reset branch 'main'
Your branch is up to date with 'origin/main'.
$ git rev-parse --short HEAD
24975f7
$ git log --oneline -1
24975f7 fix(rate-limits): лимит 3000/15мин на каждого клиента + trust proxy + 429 не выбрасывает
трекаемое: только M docker/prod/.env.production  (норма — прод-секреты, файл вне диапазона)
```

### Батч E — откатная точка (вывод 22.11.2026)

```text
6 тегов balloo/<svc>:rollback-20261122, пары с :local имеют ОДИНАКОВЫЙ ID:
  server bb0d3486 | web 4253f115 | features bc6579ff
  web-admin 3bf73e10 | web-history 0907ebfb | web-download 1f666d28
Бэкап БД: /data/balloo/backups/pre-deploy-20261122.sql — 177K, владелец cfr_balloo
```

### Батч F — сборка + пересоздание (вывод 22.11.2026)

```text
build: Image balloo/server:local Built, balloo/web:local Built, features, web-admin,
       web-history, web-download — все 6 Built, ошибок нет
F1: $COMPOSE up -d --no-deps --force-recreate server → Container balloo-server Started (29.0s)
    health: starting → healthy с 1-й проверки (10 с)
    docker logs: seed OK (идемпотентный), [Push] VAPID Web Push initialized,
                 [Cron] Story/Poll cleanup started, [WS] initialized on /ws/,
                 Server running on http://0.0.0.0:3000, [EMAIL] SMTP connection verified
F2: $COMPOSE up -d --no-deps --force-recreate web features web-admin web-history web-download
    → 5 × Container ... Started; в ps у всех IMAGE = balloo/<svc>:local
postgres/redis/minio: аптайм «Up 2 weeks» не изменился — сеть balloo-net и тома не тронуты
```

### Батч G — доказательства ПОСЛЕ (вывод 22.11.2026)

```text
HEAD=24975f7   (= цель этапа B)   ✅

imageid ПОСЛЕ — все 6 отличаются от батча C, restarts=0 у всех:
  server        sha256:f8c19be20839845902d27619ba6aa4c4ef5afacb45fa5a727b62d3582df8d9d6  started=2026-11-22T15:11:50Z
                (было bb0d3486)  ✅
  web           sha256:4a0e2542c906a989dbff0b17ecfd1e8ea92c5274380da69e207e246922914746  started=2026-11-22T15:20:51Z
                (было 4253f115)  ✅
  features      sha256:e320f56692651bc10421fdfc45a7807da8b28710da7a12228ee79c24ec35e4f7  (было bc6579ff)  ✅
  web-admin     sha256:cc1407765d89c6ac12b52dbc62ba7fc1a75faa850186fd95a2435ff325821208  (было 3bf73e10)  ✅
  web-history   sha256:223ca5517fdc7d36e6c0827e5288166b6ee9393667e095fe980be8672980bab9  (было 0907ebfb)  ✅
  web-download  sha256:cca76e17c62e32d0ffcfce9ff0a354969b3782e44360b65f3f3c341371a69f28  (было 1f666d28)  ✅

Бандль web:
  ДО   (батч C): index-CYNnwCWL.js
  ПОСЛЕ контейнер balloo-web : index-t_UYi3Xc.js
  ПОСЛЕ http://127.0.0.1:8090/ : index-t_UYi3Xc.js
  ПОСЛЕ https://balloo.su/      : index-t_UYi3Xc.js
  → порт и домен совпадают, от «до» отличается  ✅

Лимит запросов (главный предмет фикса):
  POST https://api.balloo.su/api/auth/refresh-cookie → HTTP/2 400
  ratelimit-policy: 3000;w=900     (было 100;w=900)
  ratelimit-limit: 3000            (было 100)
  ratelimit-remaining: 2999        (было 0)
  → 429 нет, потолок и окно соответствуют rateLimit.ts из 24975f7  ✅

Порты: 8090 200 | 8091 200 | 8092 200 | 8093 200 | 8094 200 | 3100 200  ✅
Миграций: 22 → 22 (диапазон без миграций, entrypoint отработал migrate deploy в no-op)  ✅
Инфраструктура: minio/postgres/redis — Up 2 weeks (healthy), не перезапускались  ✅
```

### Итог серверной части (после батча G)

Серверные критерии готовности 1–5 закрыты доказательством вывода батча G.
Откат не потребовался; теги `:rollback-20261122` и дамп остаются на сервере.

### Этап H — браузерная приёмка владельца

**22.11.2026, результат: НЕ ПРИНЯТО — экран чатов падает в ErrorBoundary.**

```text
https://balloo.su/#/chat → «Что-то пошло не так»
TypeError: Cannot read properties of null (reading 'split')
    at EmptyChatState.tsx:184:34  (at Array.map → EmptyChatState.tsx:163)
```

Диагноз: `User.displayName` nullable в Prisma-схеме (`schema.prisma:127`), клиент
вызывал `contact.displayName.split(' ')` напрямую. К краху деплой 24975f7
не имеет отношения — диф `c42b69a..24975f7` эти файлы не трогал
(проверено `git diff --stat`). Деплой лишь перестал выбрасывать пользователя
на /login по 429, и до экрана стало доходить.

Фикс: тикет `1795362308`, коммит `853da64` (push `24975f7..853da64`).
Фолбэк добавлен в 3 места, потребляющих `/api/users/contacts`:
EmptyChatState, CreateChannelScreen, CreateGroupScreen + общий хелпер
`packages/web/src/utils/display.ts` и 20 тестов.

Перед фиксом: серверные критерии 1–5 закрыты (см. батч G), в том числе
`ratelimit-limit: 3000` вместо 100.

### Побочные наблюдения из консоли (вне области этого деплоя, не блокируют)

- `frame-src 'none'` в CSP хостового nginx блокирует iframe `mc.yandex.ru`
  → доставка визита в Яндекс.Метрику под вопросом (пункт приёмки 3.3.10).
- `connect-src` без `fonts.googleapis.com` → `sw.js:cacheFirst` не может
  закэшировать шрифтовой CSS, в консоли 404 на `css2`.
- `avatars.yandex.net/get-yapic/62162/...-1/200` → 404: в БД лежит битый
  URL аватара, выданный Яндексом (внешний ресурс).

### Батч D2/E2/F2/G2 — переразвёртка web на 853da64 (вывод 22.11.2026)

```text
$ git checkout -B main origin/main → HEAD=853da64   (= цель этапа B2, push 24975f7..853da64)
трекаемое: только M docker/prod/.env.production (норма)

Откатная точка web: balloo/web:rollback-20261122b = 4a0e2542c906 — тот же ID, что у :local
  на момент замера, т.е. это рабочий образ с исправленными лимитами (24975f7).
  Более ранний rollback-20261122 = 4253f115d0e3 (с багом 429) сохранён.

build web: Image balloo/web:local Built, ошибок нет
up -d --no-deps --force-recreate web → Container balloo-web Started (8.8 s)

balloo-web id=sha256:528f8002e6ba…  (было 4a0e2542c906)  ✅ изменился
  started=2026-11-22T16:35:34Z  restarts=0                ✅

Бандль:
  контейнер balloo-web : index-BMhcrtaK.js
  https://balloo.su/   : index-BMhcrtaK.js                ✅ совпадают
  до фикса: index-t_UYi3Xc.js                             ✅ отличается

balloo-server | Up About an hour (healthy)               ✅ не перезапускался
```

Маркер кода фикса в чанке (из стека ошибки владельца до фикса был
`ChatViewScreen-lBP5lg57.js`; локальная сборка `853da64` даёт `ChatViewScreen-CNC8nxAt.js`):

```bash
docker exec balloo-web sh -c "ls /usr/share/nginx/html/assets/chunks | grep '^ChatViewScreen'"
```

(ждёт вывода владельца)

### Итог серверной части

Критерии 1–5 закрыты выводом батча G (лимиты 3000/IP-user, все app-контейнеры
на новых образах, restarts=0, миграции 22→22). Батч G2 подтвердил web-образ фикса
`853da64`. Откат не потребовался; теги `:rollback-20261122`, `:rollback-20261122b`
и дамп `pre-deploy-20261122.sql` остаются на сервере.

### Батчи C3–G3 — переразвёртка server+web на `65b4606` (23.11.2026)

Цель: выложить коммит `65b4606` (тикеты `1795369071` hash-ссылки приглашений,
`1795369072` личные чаты, `1795369073` тема «Наша», `1795369074` sw POST-guard;
сверх уже выложенного `853da64`). Диапазон `853da64..65b4606`: 2 коммита,
**миграций нет** (`packages/shared/prisma` не менялся), `.env.production` не менялся.

```text
C3 (read-only ДО):
  whoami=cfr_balloo branch=main HEAD=853da64  behind=2 origin/main=65b4606
  imageid ДО: server f8c19be20839 | web 528f8002e6ba | features e320f566 | web-admin cc140776
              web-history 223ca551 | web-download cca76e17
  bundle8090 ДО: index-BMhcrtaK.js
  migrations=22   диск: 98G/37G, свободно 56G (40%)

D3: $ git checkout -B main origin/main → HEAD=65b4606  (трекаемое: только M .env.production)

E3 (откатная точка, пары ID совпадают):
  balloo/server:rollback-20261123 = f8c19be20839 (= server:local)
  balloo/web:rollback-20261123    = 528f8002e6ba (= web:local)
  бэкап БД: /data/balloo/backups/pre-deploy-20261123.sql — 182 032 B

F1: build server → Image balloo/server:local Built (133.8s);
    up -d --no-deps --force-recreate server → Container balloo-server Started (29.8s),
    Up (healthy) с 1-й проверки; logs: Migrations applied (no-op), Seed OK,
    [Push] VAPID Web Push initialized, [WS] initialized on /ws/,
    Server running on http://0.0.0.0:3000, [EMAIL] SMTP connection verified

F2: build web → Image balloo/web:local Built (80.6s; vite по web/web-features/
    web-admin/web-history/web-download — все ✓);
    up -d --no-deps --force-recreate web → Container balloo-web Started (10.5s)

G3 (доказательства ПОСЛЕ):
  HEAD=65b4606                                                             ✅
  server img=sha256:a569328b96ff… (было f8c19be2) started=20:51:36Z restarts=0  ✅
  web    img=sha256:8c1aff2cfd9f… (было 528f8002) started=20:54:44Z restarts=0  ✅
  бандль: 8090 = index-BMWJl9HD.js ; домен = index-BMWJl9HD.js
          (совпадают, ≠ index-BMhcrtaK.js)                                ✅
  маркеры кода 65b4606:
    joinPathRescue в бандле web: есть
    sw.js: `method === 'GET'` = 2 (cacheFirst + apiFirst)
    chatService.js (server dist): `direct` = 11
  server /health = 200                                                     ✅
  features/web-admin/web-history/web-download: Up 6h (не пересоздавались)   ✅
  postgres/redis/minio: Up 2 weeks (не тронуты)                             ✅
```

Откат не потребовался. Теги `:rollback-20261123` (server+web) и дамп
`pre-deploy-20261123.sql` остаются на сервере.

**Остаток:** этап H — браузерная приёмка владельца (чек-лист ниже). До неё
серверная часть подтверждена выводом батча G3, пользовательская — нет.

### Чек-лист приёмки H (на владельце)

- [ ] `https://balloo.su/#/chat` открывается, экрана «Что-то пошло не так» нет
      (фикс `853da64` null-displayName);
- [ ] в контактах есть люди, имена и аватарки отображаются;
- [ ] клик по контакту открывает **личный чат**, повторный клик — **тот же** чат
      (тик. `1795369072`); контакт с открытым чатом исчезает из подсказок Балунишки;
- [ ] кнопка «✏️ Новый чат» фокусирует поиск списка контактов;
- [ ] приглашение: `POST /api/invites` → `url` = `https://balloo.su/#/join/…`
      (тик. `1795369071`); открытие ссылки ведёт на лендинг приглашения;
- [ ] регистрация по ссылке → реферал засчитан (вкладка «Я присоединил к Balloo»),
      контакты добавлены (если стояла галочка);
- [ ] тема «Наша»: карточки/панели/меню с золотой рамкой, стеклянные контейнеры,
      фон с флаговым градиентом (тик. `1795369073`);
- [ ] консоль DevTools без `Uncaught TypeError … Request method 'POST' is unsupported`
      от `sw.js` (тик. `1795369074`); при визуально старом коде — DevTools →
      Application → Service Workers → Unregister + жёсткая перезагрузка.

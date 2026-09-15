# Тикет: деплой Balloo на прод — передача в новую сессию

> Создан: 2026-09-12. Последнее обновление: **2026-09-14, этап 8**.
> Цель: довести прод-деплой balloo.su до состояния «работает по http+https, поднимается сам после ребута сервера».
> Этот файл — единственный входной документ новой сессии. Читать целиком, до первой команды.

**Протокол ведения документа (обязателен).** Каждый завершённый или прерванный этап:

1. дописывает **новую строку** в §2 «Журнал этапов» — старые строки не переписываются; отменённое решение помечается `⛔ ОТМЕНЕНО` внутри своей строки, а не удаляется;
2. обновляет §1 «Текущая точка», §5 «Открытые проблемы», §6 «Что осталось сделать», §10 «Критерии готовности»;
3. фиксирует **причину перехода**: что не сработало / какой вывод это показало.

Пометки достоверности: `✅` — подтверждено выводом с сервера; `🟡` — сделано в репозитории, на сервере не подтверждено; `❓` — вывод не получен (статус неизвестен); `⛔` — ложный след, отменено.

---

## 0. ЖЁСТКИЕ ПРАВИЛА РАБОТЫ (нарушение = критическая ошибка)

1. **Доступа к серверу у ассистента нет.** Ассистент работает на ноутбуке. Пользователь — глаза и руки на сервере: ассистент даёт команды, пользователь выполняет и присылает вывод.
2. **НИКАКИХ попыток подключения к серверу** со стороны ассистента: ни `ssh`, ни `scp`, ни `curl` к внутренним адресам, ни проверок портов/SSL-рукопожатий, ни `ping`. Даже «быстро проверять». Это не обходится молча при таймаутах.
3. **Состояние ноутбука ≠ состояние сервера.** По локальному checkout, локальному `git status`, локальному окружению нельзя делать выводы о том, что происходит на сервере. Любое такое утверждение — галлюцинация. Состояние сервера известно **только** из вывода, который пользователь прислал в этой сессии. Локальное воспроизведение бага допустимо и полезно, но оно доказывает только наличие бага в коде, а не состояние прода.
4. **Сервер физический, не VPS/облако.** Веб-консоли/панели управления нет. Перезагрузка — только кнопкой/физически, только по явной команде пользователя.
5. **Сервер мультипроектный.** Работают чужие проекты. Их не трогать, не перезапускать, не останавливать, не «оптимизировать», не проверять их конфиги. Особо беречь: **cockpit.balloo.su**, **центр-фр.рф** (`xn----itbymbjqk.xn--p1ai`), а также `alpha`, `console`, `vsc`.
6. **Любая правка nginx затрагивает все сайты** (общий процесс, один `reload`). Поэтому: один батч изменений → бэкап → `nginx -t` → ровно один `reload` → откат одной командой при ошибке. `systemctl restart nginx` не делать.
7. **Сертификаты не перевыпускать и аутентификатор не менять.** Все 7 сертификатов продлеваются плагином `certbot --nginx` (`authenticator = nginx`), таймер активен, `/var/www/certbot` отсутствует. ACME-локации и webroot-схему не добавлять.
8. Секреты, введённые в терминал, оседают в `~/.bash_history` — учитывать, чинить в финале по согласованию.
9. Рабочая область ассистента — только `/home/ivan/Рабочий стол/проекты/balloo`. Untracked-файлы не удалять (в одной из сессий так был потерян локальный `docker-compose.prod.yml` в корне — повторить нельзя).
10. **Документ обновляется ДО новых действий на сервере**, если с прошлого обновления сменился этап. Прерванная из-за соединения сессия не повод терять состояние: всё найденное уже здесь.
11. **Один батч = одна тема.** Не смешивать деплой кода, правку nginx и ротацию секретов в одном заходе: при ошибке невозможно понять, что именно сработало. Вывод батча присылается целиком (или `tail -n 40` того же лога).
12. Долгие команды (`docker compose build`) запускать фоном в свой лог: `setsid nohup … > /tmp/<имя>.log 2>&1 < /dev/null &`, затем `tail`. Иначе сессия рвётся, а сборка остаётся сиротой.
13. **Ожидание зашито в команду, а не в переписку.** Ассистент не пишет «подожди ~7 минут и пришли вывод». В блоке есть цикл опроса с таймаутом: `for i in $(seq 1 N); do …; [ условие ] && break; sleep 5; done`, либо `tail -f`-подобное чтение лога до маркера. Пауза между блоками = «пришли вывод», а не «подожди».

---

## 1. ТЕКУЩАЯ ТОЧКА (2026-09-14, этап 8 — блокёр WS закрыт)

### 1.1 Подтверждено выводом сервера (последняя вставка, 2026-09-14 ~15:30 local)

| # | Вывод | Что из него следует |
|---|---|---|
| 1 | `git pull --ff-only` → `356df36..ef74215`, `git log -1` → `ef74215` | На сервере код **с фиксом** `7f2854e` (он входит в `ef74215`) |
| 2 | `Image balloo/server:local Built`, `balloo-server Recreated → Started`, `startedAt=2026-09-14T10:02:27Z` | Образ пересобран и контейнер пересоздан из нового кода |
| 3 | `ws_local=401`, `ws_https=401` (handshake без токена) | **Падение ушло.** До фикса: `(52) Empty reply from server` и `502` от nginx. Теперь корректный отказ 401 |
| 4 | `restarts=0`, `status=running`, `health=healthy` | Цикла рестартов нет. `RestartCount` — достоверный счётчик (не healthcheck, см. P10) |
| 5 | `docker logs --since 3m \| grep -c 'WebSocket server initialized'` → **0**; в `--tail 20` ровно **одна** строка инициализации + две `[WS] Connection rejected: no token` | Было 3 инициализации за 3 минуты. Теперь процесс поднимается один раз, а отказы handshake его не роняют |
| 6 | `ss -ltnp` → `127.0.0.1:3100`, `127.0.0.1:8090` слушаются; `dockerd=/usr/bin/dockerd` | Порты на месте, докер на сервере свой |
| 7 | `[EMAIL] SMTP connection error: connect ECONNREFUSED 127.0.0.1:587` | **Новая проблема P11**: SMTP не настроен, почта (верификация, сброс пароля) недоступна |
| 8 | `cd /root/Messenger_Balloo` → `Permission denied`, `grep /root/...docker-compose*.yml` → `Permission denied` | **Моя ошибка в командах**: репозиторий на сервере в `~/balloo` = `/home/cfr_balloo/balloo` (видно по промпту). Пути `/root/*` — ложный след, в §9 |

### 1.1.1 Признак «фикс в образе» — как его читать правильно

Дана мной неверная команда: я искал `grep -c 'req\.headers'`, а в коде фикса такой строки **нет никогда** → `has_req_headers=0` ничего не означает. Второй признак `grep -c 'info\.url'` = 1 тоже **не** означает «код старый»: `tsconfig.json` не включает `removeComments`, tsc сохраняет комментарии, а в комментарии фикса есть подстрока `info.url` (`src/ws/index.ts:126`). Правильные признаки в `packages/server/dist/ws/index.js`:

```bash
docker exec balloo-server sh -lc 'f=/app/packages/server/dist/ws/index.js; printf "new_code_info_req_url="; grep -c "info\.req\.url" "$f"; printf "old_code_assign_info_url="; grep -c "=[[:space:]]*info\.url;" "$f"'
# ждём new_code_info_req_url=1, old_code_assign_info_url=0
```

Поведенческие признаки (строки 3–5 таблицы) сильнее текстовых и уже закрывают вопрос: 401 вместо обрыва + `restarts=0` + одна инициализация возможны только при работающем фиксе.

### 1.2 НЕ подтверждено ни одним выводом (не считать сделанным)

- `❓` P1 — удалён ли затеняющий vhost `api.balloo.su` (команды §6 шаг 1 выдавались, вывода нет).
- `❓` P2 — состояние MinIO в `/health/ready` после фикса `MINIO_ACCESS_KEY/SECRET_KEY` (**в последнюю вставку не входило**).
- `❓` P3/P4 — равен ли живой `/etc/nginx/sites-enabled/balloo-docker.conf` версии из репо (sha256).
- `❓` P5 — результат `certbot renew --dry-run` после отключения майских заглушек.
- `❓` P6 — выполнялась ли ротация секретов, `chmod 600` на `.env.production`.
- `❓` WS с настоящим токеном → `101` (шаг 4 батча A).
- `❓` basic-auth на probe-эндпоинтах.
- `❓` `systemctl is-enabled balloo.service`, `ufw status numbered`, ребут-тест автозапуска.
- `❓` `start_period` у healthcheck (проверялось по неверному пути, Permission denied).

### 1.3 Блокёр — ЗАКРЫТ 2026-09-14

**WebSocket handshake ронял процесс API.** Первопричина (`info.url` → `undefined.searchParams` → синхронный `TypeError` в обработчике `upgrade`, слушателей `uncaughtException` нет) исправлена в `7f2854e`, задеплоена и **подтверждена поведению на проде**: `ws_local=401`, `ws_https=401`, `restarts=0`, одна инициализация WS. Остался позитивный тест `101` с настоящим токеном (§11 батч A шаг 4).

### 1.4 Ближайшее действие — батч A шаг 4 (позитивный WS) и батч B (аудит `❓`)

Порядок: сначала §11 «Батч A шаг 4» (нужен существующий аккаунт; регистрацию нового пользователя в прод-БД без явного «да» не делаем), затем §11 «Батч B» — read-only аудит всего `❓` из §1.2. Оба блока ничего не меняют на сервере, `reload` не делают.

`⛔ АРХИВ (шаг 3 выполнен 2026-09-14, результат в §1.1). Не выполнять: текстовые признаки ниже были неверные — см. §1.1.1.`

```bash
cd ~/balloo/docker/prod
for i in $(seq 1 30); do h=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}nohealth{{end}}' balloo-server 2>/dev/null || echo nodocker); printf 'wait %02d health=%s\n' "$i" "$h"; [ "$h" = healthy ] && break; sleep 5; done
echo '--- 1. фикс в РАБОТАЮЩЕМ образе (главный признак) ---'
docker exec balloo-server sh -lc 'for r in /app /usr/src/app /srv/app /home/app; do [ -d "$r" ] || continue; f=$(grep -rl "WebSocket server initialized" "$r" --include=*.js 2>/dev/null | head -1); [ -n "$f" ] && break; done; echo "ws_file=$f"; [ -n "$f" ] && { printf "has_req_headers="; grep -c "req\.headers" "$f"; printf "has_info_url="; grep -c "info\.url" "$f"; }'
echo '--- 2. контейнер до тестов ---'
docker inspect -f 'status={{.State.Status}} restarts={{.RestartCount}} health={{if .State.Health}}{{.State.Health.Status}}{{end}} startedAt={{.State.StartedAt}}' balloo-server
echo '--- 3. health + ready (снимает P2 по MinIO) ---'
curl -sS -o /dev/null -w 'health=%{http_code}\n' --max-time 8 http://127.0.0.1:3100/health
curl -sS --max-time 8 http://127.0.0.1:3100/health/ready | head -c 500; echo
echo '--- 4. WS без токена: ждём 401, не обрыв ---'
curl -sS -o /dev/null -w 'ws_local=%{http_code}\n' --max-time 8 --http1.1 -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' http://127.0.0.1:3100/ws/
curl -sS -o /dev/null -w 'ws_https=%{http_code}\n' --max-time 8 --http1.1 -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' https://balloo.su/ws/
echo '--- 5. после тестов: сколько раз инициализировался WS и рестарты ---'
docker logs --since 3m balloo-server 2>&1 | grep -cE 'WebSocket server initialized'
docker inspect -f 'restarts_after_tests={{.RestartCount}}' balloo-server
```

**Ожидание:** `has_req_headers` ≥ `1` и `has_info_url` = `0` (иначе образ собран не из `ef74215` — проверить, что `git log -1` на сервере = `ef74215`); `ws_local=401`, `ws_https=401` (без токена это правильный ответ, а не обрыв); `restarts_after_tests` == `restarts` из п.2; в п.5 число `1`. Если код `52`/`502` или рестарты растут — фикс не применился либо есть второй источник падения, вывод присылать целиком.

Если цикл `wait` за 150 с не дошёл до `healthy`: `tail -n 40 /tmp/ws-build-2.log` и `docker logs --tail 40 balloo-server` — это отдельный вывод, не следующая команда.

### 1.5 Батч A шаг 4 — позитивный WS-тест с настоящим токеном (после шага 3)

Нужен существующий аккаунт. Регистрацию нового пользователя в прод-БД без явного «да» не делаем. Пароли через `read -s` — в `bash_history` не попадают (правило 8).

```bash
read -rsp 'email: ' E; echo; read -rsp 'password: ' P; echo
curl -sS -c /tmp/bj -X POST https://balloo.su/api/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"$E\",\"password\":\"$P\"}" -o /tmp/lg.json -w 'login=%{http_code}\n'
curl -sS -b /tmp/bj https://balloo.su/api/auth/ws-token -o /tmp/wst.json -w 'ws_token_http=%{http_code}\n'
T=$(sed -n 's/.*"token":"\([^"]*\)".*/\1/p' /tmp/wst.json); echo "ws_token_len=${#T}"
curl -sS -o /dev/null -w 'ws_with_token=%{http_code}\n' --max-time 8 --http1.1 -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' "https://balloo.su/ws/?token=$T"
shred -u /tmp/bj /tmp/lg.json /tmp/wst.json 2>/dev/null; unset E P T
```

**Ожидание:** `login=200`, `ws_token_http=200`, `ws_token_len≈200`, `ws_with_token=101`. Локально этот путь закрыт тестом `пропускает подключение с валидным access-токеном` (5 passed на `ef74215`), на проде ещё не подтверждён.

---

## 2. ЖУРНАЛ ЭТАПОВ (не стирать, только дополнять)

| № | Дата | Что делали | Состояние, подтверждённое выводом | Решение | Зачем переход / что не сработало |
|---|---|---|---|---|---|
| 1 | 2026-09-11 | Починка начальной миграции Prisma (`9416404`), `migrate deploy` на сервере | ✅ `tables=51`, `migrate status` → «Database schema is up to date!» | Миграции считать валидным каналом схемы, `db push` не использовать | БД больше не блокёр → перешли к nginx и API |
| 2 | 2026-09-11 | `07ccb89` — запекать `VITE_API_URL` в бандль фронта вместо `localhost:3100` | ✅ Фронт с прод-домена ходит на прод-API (регистрация/логин `200`) | URL API — build-time параметр, не runtime-подмена | Подтверждён базовый HTTP: `https://balloo.su/health` → `200`, `http→https` `301` |
| 3 | 2026-09-12 | `6409de8` — канонический vhost `docker/prod/nginx/balloo-docker.conf`: `client_max_body_size 120m` + `map $http_upgrade $balloo_upgrade_connection` | 🟡 В репо. На сервере sha256 живого конфига **не сверялся** | P3 (413 на >1 МБ) и P4 (`Connection "upgrade"` всем запросам) закрыть только этим файлом; `map` с уникальным именем `balloo_*` — чтобы не конфликтовать с чужими конфигами | Нужна сверка «байт в байт» (критерий готовности), отложена до шага проверки |
| 4 | 2026-09-12 | `355efb1` + `2b71222` — `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` для приложения | 🟡 В репо. `/health/ready` после этого **не проверяли** | Ключи MinIO объявлять **только у сервиса `server`** (в `x-common-variables` их быть не должно — иначе утекают в postgres/redis/web) | П2 закрыт только наполовину: ждём `minio:{"ok":true}` |
| 5 | 2026-09-12 | `bbf83fb` + `e435458` — скрипты ротации секретов (`rotate-secrets.mjs`, `apply-rotated-secrets.sh`, учёт кавычек в `.env.production`) | 🟡 Скрипты в репо, неприменены | Ротация = `ALTER USER` в контейнере postgres → правка env → `up -d --force-recreate`; `.env.production` → `chmod 600` | Отложено: сбрасывает сессии пользователей, делать одним заходом после того как код стабилен |
| 6 | 2026-09-12 | `8d0d55e` — handoff-документ, фиксация `P1…P7` и ложных следов | ✅ Документ в репо | Дальнейшая работа только по нему | — |
| 7 | 2026-09-12 23:27 | `356df36` — `callback(false, 401)` вместо `1008` в `verifyClient` (гипотеза: `ERR_HTTP_INVALID_STATUS_CODE` рвёт соединение → nginx 502) | ❓ На сервере применён, тест дал `Empty reply` / `502` | `⛔ ОТМЕНЕНО как первопричина`: неверный HTTP-код — реальный, но вторичный баг. Фикс оставлен (он правильный сам по себе) | Вывод не изменился после деплоя → гипотеза не объясняет `52/502`. Нужна первопричина, а не симптом |
| 8 | 2026-09-13 00:09 | `7f2854e` — токен брать из `req.url`, тело `verifyClient` в `try/catch` | ✅ Локально воспроизведён `TypeError` на строке `websocket-server.js:335` — та же строка, что в стеке с сервера; `ws-handshake.test.ts` 5 passed | `ws` передаёт в `verifyClient` только `{origin, secure, req}`; `info.url` → `undefined` → `url.searchParams` бросает **синхронно** в обработчике `'upgrade'` → процесс падает без ответа (слушателей `uncaughtException` нет) | Ждёт применения на сервере — это батч A (§1.4). Только локальное доказательство, прод ещё не подтверждён |
| 9 | 2026-09-14 | Инвентаризация состояния: сервер на `356df36`, фикс на сервере не применялся; составлен список `❓` (§1.2) | ✅ По выводу последней сессии | Порядок дальше: батч A (код) → батч B (read-only аудит `❓`) → шаг 4 basic-auth → финал/ребут | Сессии рвались по соединению и по размеру контекста — отсюда этот протокол ведения документа |
| 10 | 2026-09-14 | Батч A, шаги 1–2: `git pull` → `356df36..ef74215` (`git log -1` = `ef74215`), пересборка `balloo/server:local`, `up -d server` | ✅ `Image Built`, `balloo-server Recreated → Started`, `postgres/redis/minio Healthy`. Про фикс в образе: вывод `docker exec balloo-server grep -n "req.url" packages/server/dist/ws/index.js` **не получен** | Образ сервера пересобирается только по `--build`; `restart: always` оставлен как есть (рестарты считаем по `RestartCount`, P10) | Шаг 3 (верификация WS) не выполнен — выводов нет. Батч A остаётся текущим действием, команда ожидания встроена в блок 1 (§11) |
| 11 | 2026-09-14 | Верификация задеплоенного фикса: текстовые признаки в `dist/ws/index.js` + `restarts` + коды handshake + число инициализаций WS | ✅ `ws_local=401`, `ws_https=401` (было `52`/`502`), `restarts=0`, `status=running`, инициализаций WS за 3 мин `0` (было `3`), в логе одна инициализация + две `Connection rejected: no token`. Побочно: `127.0.0.1:3100`/`:8090` слушаются, `dockerd` свой, `[EMAIL] SMTP ... ECONNREFUSED 127.0.0.1:587` | **P8 закрыт** по поведению. Текстовые признаки аннулированы и заменены на `info.req.url` / `= info.url;` (§1.1.1). Достоверный счётчик падений — `RestartCount`, не `health`. Путь репо на сервере — `~/balloo` | Две мои ошибки в командах: путь `/root/Messenger_Balloo` (нет прав, ложный след) и признак `grep req.headers` (такой строки в коде нет) → `has_req_headers=0` читался как «фикса нет», хотя фикс работает. Переход: перестать проверять фикс текстом, опираться на коды ответов; дальше — батч A шаг 4 (`101`) и батч B. Новая проблема — P11 (SMTP) |
| 12 | 2026-09-14 | По команде пользователя все ветки сведены в `main`: `git checkout main && git merge --ff-only fix/prisma-initial-migration-ddl`, `git push origin main` → `bc03cec..f408029` | ✅ `main` = `fix/prisma-initial-migration-ddl` = `f408029`. `main..fix` = 14 коммитов, `fix..main` = 0 → общих предков достаточно, fast-forward без конфликтов | Единственная целевая ветка — `main`. Рабочую ветку **не удалять**: на ней сейчас стоит прод (`git pull origin fix/...` на сервере), удаление сломает следующий деплой | Дальше: сервер перевести на `main` (`git fetch && git checkout main && git pull`), содержимое идентично — переключение не меняет код. Все новые правки — в `main` |

---

## 3. Параметры сервера (подтверждено выводом пользователя)

| Параметр | Значение |
|---|---|
| ОС | Ubuntu 24.04.4 LTS, ядро 6.8.0-138 (сервер просит reboot — отложить до финала) |
| hostname | `aedgar` |
| Пользователь | `cfr_balloo`, `HOME=/home/cfr_balloo` |
| Сеть | `eno1` 192.168.1.85, внешний адрес 188.73.176.34 |
| Репозиторий | `~/balloo`, remote `https://github.com/NBS-wt-Director/Messenger_Balloo.git` |
| Ветка на сервере | `fix/prisma-initial-migration-ddl` (HEAD `356df36` по последнему выводу) |
| Compose-файл | `~/balloo/docker/prod/docker-compose.local.yml` + `--env-file .env.production` |
| nginx | `nginx/1.24.0 (Ubuntu)`, хостовый, наши сайты — `sites-enabled/balloo-docker.conf` |
| Firewall | `ufw` активен, `deny (incoming)` |

Контейнеры: `balloo-postgres`, `balloo-redis`, `balloo-minio` — `Up (healthy)`; `balloo-server` — `Up (healthy)`, но с признаками рестартов (§1.1 п.5); `balloo-web` — `Up`. Порты опубликованы только на `127.0.0.1`: `3100` (API), `8090` (web), `9001` (MinIO console). Postgres/Redis наружу не опубликованы.

Чужие слушающие (не трогать): `*:3000` — чужой `next-server`, `127.0.0.1:8080` — чужой node, хостовые `postgres 127.0.0.1:5432` и `redis 127.0.0.1:6379` — **чужие**, наши контейнеры с ними не конфликтуют.

---

## 4. Что уже сделано и подтверждено

### 4.1 БД
Миграции Prisma применены, `tables=51`, `migrate status` → «up to date». Начальная миграция починена заранее (ветка `fix/prisma-initial-migration-ddl`).

### 4.2 HTTPS/HTTP базово работают
- `curl https://balloo.su/health` → `200 {"status":"ok",...}`
- `POST /api/auth/register` и `/api/auth/login` → `200`, JWT в httpOnly-cookie с `Secure`, HSTS/CSP от helmet присутствуют.
- HTTP отдаёт `301` на HTTPS.

### 4.3 Автозапуск стека
- `/usr/local/bin/balloo-deploy.sh` — создан, ждёт готовности docker-демона, делает `up -d --remove-orphans` + `ps`.
- `/etc/systemd/system/balloo.service` — переписан без ошибок экранирования, `systemd-analyze verify` → `rc=0`, `systemctl start` → `active (exited)`, живые контейнеры не перезапустились (идемпотентность подтверждена).
- `docker`, `nginx` — `enabled`. Статус `balloo.service` после `enable` **не подтверждён выводом** — проверить (§11 батч B).

### 4.4 Заглушки balloo.su/api.balloo.su (майские статик-сайты)
Пользователь подтвердил: это заглушки, отключаются. Команды отключения выдавались, **выполнены ли — не подтверждено** (`❓`).

---

## 5. Открытые проблемы и их статусы

| ID | Проблема | Статус | Что нужно, чтобы закрыть |
|---|---|---|---|
| P1 | `api.balloo.su` затенён майским статик-блоком `/etc/nginx/sites-available/api.balloo.su` (`server_name api.balloo.su www.api.balloo.su; root /home/cfr_balloo/sites/api.balloo.su;`). Алфавитно раньше `balloo-docker.conf` → nginx пишет `conflicting server name ... ignored`, и `https://api.balloo.su/health` отдаёт nginx-404 вместо API | `❓` Лечение выдавалось, вывод не получен | Батч B: `sudo nginx -t 2>&1 \| tail -5` (нет ли `conflicting server name`) + `curl -o /dev/null -w '%{http_code}' https://api.balloo.su/health` |
| P2 | MinIO недоступен приложению: `/health/ready` давал `"minio":{"ok":false,"error":"The Access Key Id you provided does not exist in our records."}`. Приложение читает `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` (`config/env.ts`, `services/uploadService.ts`), compose отдавал только `MINIO_ROOT_USER/PASSWORD` → дефолт `minioadmin` | `🟡` код в репо и на сервере (`2b71222` в составе `356df36`), вывод не получен | Батч B: `curl -sS http://127.0.0.1:3100/health/ready` → ждём `"minio":{"ok":true}` |
| P3 | Нет `client_max_body_size` в живом конфиге → дефолт nginx 1 МБ против 50 МБ в приложении (`MAX_FILE_SIZE=52428800`), истории 100 МБ → 413 | `🟡` `6409de8` | Сверка sha256 + тест загрузки 5 МБ (§6 шаг 2) |
| P4 | `Connection "upgrade"` жёстко проставлялся всем API-запросам | `🟡` `6409de8` (`map $http_upgrade $balloo_upgrade_connection`) | Сверка sha256 живого конфига с репо |
| P5 | ACME на :80 работает только потому, что `authenticator = nginx` сам вставляет локации при продлении. Менять способ нельзя (правило 7) | `❓` | Батч B: `sudo certbot renew --dry-run 2>&1 \| tail -5` |
| P6 | Секреты в git: `docker/prod/.env.production` закоммичен с реальными паролями | `❓` Ротация не подтверждена | §8, одним заходом в финале; решение «убрать файл из репо» — за пользователем |
| P7 | Мелочи: `~/.bashrc:117` — `syntax error near unexpected token 'fi'`; секреты probe-эндпоинтов в `~/.bash_history`; `/metrics` в API нет (`prom-client` не подключён) | `❓` | Шаг финала (§6) |
| P8 | **WS-путь ронял весь процесс API** (`52` локально / `502` через nginx / повторяющиеся инициализации WS) | `✅` **ЗАКРЫТ 2026-09-14**: `ws_local=401`, `ws_https=401`, `restarts=0`, 0 лишних инициализаций за 3 мин | Осталось только `101` с настоящим токеном — §11 батч A шаг 4 |
| P9 | В `ws/index.ts:72` `handleWsMessage()` — async, вызывается без `await` из синхронного `try/catch`; при Node 22 необработанное отклонение промиса **роняет процесс** (внутренний `try/catch` в `handlers.ts` прикрывает большую часть, но не `sendError`) | `🟡` найдено при разборе, кода не изменено. Кандидат №2 после закрытия P8 | Обсудить с пользователем: (а) `void handleWsMessage(...).catch(...)`, (б) глобальные `process.on('unhandledRejection'/'uncaughtException')`. Молча не делать |
| P10 | Healthcheck контейнера сервера не различает «жив» и «циклически перезапускается» | `🟡` наблюдение, но **важность снижена**: `restarts=0` при `healthy` — цикла рестартов не было, были падения до фикса. `start_period` не проверен (Permission denied из-за неверного пути) | Считать достоверным `RestartCount`, а не `health`. `start_period` проверить в батче B по пути `~/balloo/docker/prod` |
| P11 | **SMTP не настроен**: `[EMAIL] SMTP connection error: connect ECONNREFUSED 127.0.0.1:587`, «Email-функции будут недоступны до настройки SMTP» | `❓` подтверждено логом 2026-09-14, объём работ не оценен | Выяснить у пользователя: есть ли реальный SMTP-релей (хост/порт/логин/пароль/TLS) или почта отложена. Пока — верификация email и сброс пароля не работают |

---

## 6. Что осталось сделать (порядок)

### Шаг 1. Батч A — применить `7f2854e` и проверить WS
Команды в §1.4. Критерий: handshake без токена → `401`, `RestartCount` не изменился, одна строка `[WS] WebSocket server initialized`.

### Шаг 2. Батч B — read-only аудит всего `❓` из §1.2
Команды в §11. Никаких правок, никаких `reload`. По итогам — обновить статусы P1…P7 в §5.

### Шаг 3. Убрать затеняющий vhost (если батч B покажет, что он жив)
```bash
sudo mkdir -p /root/nginx-disabled-20260911
sudo cp -a /etc/nginx/sites-enabled/balloo-docker.conf /root/nginx-disabled-20260911/balloo-docker.conf.bak
sudo rm -f /etc/nginx/sites-enabled/api.balloo.su
sudo mv -v /etc/nginx/sites-available/api.balloo.su /root/nginx-disabled-20260911/
sudo mv -v /etc/nginx/sites-available/balloo.su  /root/nginx-disabled-20260911/ 2>/dev/null
sudo nginx -t && sudo systemctl reload nginx && echo RELOAD_OK
curl -sS https://api.balloo.su/health; echo     # ждём JSON, не nginx-404
curl -sS https://balloo.su/health; echo         # ждём JSON
sudo certbot renew --dry-run 2>&1 | tail -5     # ждём "simulated renewals" ok
```
Каталоги `~/sites/balloo.su`, `~/sites/api.balloo.su` не удалять. Откат: `sudo cp -a /root/nginx-disabled-20260911/*.bak /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx`.

### Шаг 4. Синхронизация конфига «байт в байт»
Если батч B показал расхождение sha256 — живой конфиг является источником истины (пользователь просил «байт в байт»): живой переносится в репозиторий `docker/prod/nginx/balloo-docker.conf`, а не наоборот. Проверка — совпадение `sha256sum` + коды ответов + загрузка файла 5 МБ без 413.

### Шаг 5. Probe-эндпоинты под basic-auth
`/etc/nginx/.htpasswd-balloo` уже создан (`root:www-data`, `640`). Блок `location ~ ^/(health|health/ready)(/|$)` с `auth_basic` вставить в оба блока. Healthcheck'и контейнеров ходят внутрь контейнера и nginx не затрагивают. Открытый вопрос пользователю: нужен ли внешний uptime-мониторинг (тогда `/health` оставить открытым).

### Шаг 6. Ротация секретов (§8) — одним заходом.

### Шаг 7. Финал
`sudo ufw status numbered` (проверить 80/443 и что не открыто лишнее) → починка `.bashrc` → чистка истории → **ребут по команде пользователя** → `docker compose ps` без единой команды → smoke-тест.

---

## 7. Изменения в репозитории

Ветка `fix/prisma-initial-migration-ddl`, `origin` = локальный HEAD = `8d0d55e`. Всё перечисленное в §2 **закоммичено и запушено** (на сервере по последнему выводу — `356df36`). Рабочее дерево ноутбука чистое.

Канонический путь vhost: `docker/prod/nginx/balloo-docker.conf` → на сервере `/etc/nginx/sites-enabled/balloo-docker.conf`. Старые шаблоны `nginx-host-balloo-http.conf` / `nginx-host-balloo-ssl.conf` удалены как устаревшие.

Файлы, созданные ассистентом в ходе этого тикета: `docker/prod/nginx/balloo-docker.conf`, `docker/prod/rotate-secrets.mjs`, `docker/prod/apply-rotated-secrets.sh`, `packages/server/src/ws/ws-handshake.test.ts`, этот документ. `.tmp/` (мусор из ошибочной ветки рассуждений) — удалить только по явной команде пользователя.

---

## 8. Ротация секретов (порядок)

`POSTGRES_PASSWORD` применяется только при первой инициализации тома, поэтому: сначала `ALTER USER` внутри контейнера postgres, потом правка env, потом `up -d --force-recreate`. Ротировать: `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_PASSWORD`, `MINIO_ROOT_PASSWORD`. Сессии пользователей сбросятся. Файлу `.env.production` поставить `chmod 600`. Скрипты: `docker/prod/rotate-secrets.mjs` (генерация) + `docker/prod/apply-rotated-secrets.sh` (применение, учитывает кавычки в `.env.production`).

---

## 9. Ложные следы — НЕ ИСПОЛЬЗОВАТЬ

`⛔` Аннулированы целиком (не подтверждены выводом и/или относятся к другим машинам):

- хосты/пути `101.166.3.3`, `192.168.20.9`, `/opt/balloo`, `/srv/gigachat`, `root@...`, `giga.gogot.ru`, `balloo-locations.conf`, «сервер лежит / nginx не слушает 80/443»;
- «сертификат тестовый», «таймера автопродления нет», «контейнеры в цикле рестартов из-за БД», «P1000 / неверный пароль БД», `JWT_SECRET`/`CRON_SECRET` (в этом коде таких переменных нет);
- «`return 503` в живом конфиге», `client_max_body_size 10m`, «21 включённый конфиг», «нужен webroot `/var/www/certbot`»;
- `⛔` (этап 7) «502 на `/ws/` вызван неверным HTTP-кодом в `callback`» — фикс `356df36` сам по себе верный, но первопричиной не являлся;
- `⛔` (2026-09-14) путь репозитория **`/root/Messenger_Balloo`** — на сервере репозиторий в `~/balloo` = `/home/cfr_balloo/balloo` (видно по приглашению терминала). Пути `/root/*` дают `Permission denied` и ничего не доказывают;
- `⛔` (2026-09-14) приватный реестр `192.168.68.12:5000` и «прод тянет `:latest` из реестра, поэтому пересборка не помогла» — выводом не подтверждено; на сервере свой `dockerd=/usr/bin/dockerd`, образ `balloo/server:local` собирается локально;
- `⛔` (2026-09-14) текстовые признаки фикса в образе `has_req_headers` / `has_info_url` — первый ищет строку, которой в коде нет, второй срабатывает на комментарий (`removeComments` не включён). Правильные признаки — §1.1.1;
- `⛔` (2026-09-14) «контейнер вечно рестартует, виноват `start_period: 30s`» — гипотеза не подтвердилась: `restarts=0`. Повторы `[WS] WebSocket server initialized` в старом логе были падениями процесса, а не рестартами healthcheck'а;
- любые выводы о сервере, построенные на локальном checkout ноутбука.

Единственный источник истины по серверу — вывод, присланный пользователем.

---

## 10. Критерии готовности

- [ ] `https://balloo.su` и `http://balloo.su` (301) работают, страница логина отдаётся — `🟡` частично подтверждено
- [ ] `https://api.balloo.su/health` отвечает JSON от приложения, а не nginx-404 — `❓` P1
- [ ] `/health/ready` → все три проверки `ok:true` — `❓` P2
- [ ] Загрузка файла 5–50 МБ проходит без 413 — `❓` P3
- [ ] WS: `wss://balloo.su/ws/?token=<access>` отвечает `101`, без токена `401`, процесс не падает — `🟡` P8: `401` и «не падает» подтверждены 2026-09-14, `101` с токеном нет
- [x] `RestartCount` контейнера `balloo-server` = 0 после нагрузки/тестов — `✅` подтверждено 2026-09-14 (`restarts=0`, 0 лишних инициализаций WS)
- [ ] Probe-эндпоинты закрыты basic-auth (401 снаружи), healthcheck'и контейнеров `healthy` — `❓`
- [ ] `certbot renew --dry-run` зелёный, таймер активен — `❓` P5
- [ ] `balloo.service` в `enabled`, после ребута стек поднимается без ручных команд — `❓`
- [ ] Чужие сайты (cockpit, центр-фр.рф, alpha, console, vsc) живы и не изменены — `❓`
- [ ] Конфиг в репозитории байт-в-байт равен живому на сервере (`sha256sum` совпадает) — `❓` P4
- [ ] Секреты ротированы, `.env.production` вне git или с `chmod 600` — `❓` P6

---

## 11. Диагностические батчи (готовые команды)

### Батч A шаг 4 — позитивный WS с настоящим токеном

Блок в §1.5. Нужен существующий аккаунт, пароли через `read -s`.

### Батч B — read-only аудит (ничего не меняет, `reload` не делает)

Пути — от `$HOME`, репозиторий на сервере `~/balloo` (`/root/*` не использовать, §9). Блок рассчитан на обычного пользователя `cfr_balloo`; строки с `sudo` спросить пароль — это нормально, вывод прислать целиком.

```bash
R=$HOME/balloo; D=$(date +%H%M)
{ echo "=== 0. фикс в образе: правильные признаки ==="
  docker exec balloo-server sh -lc 'f=/app/packages/server/dist/ws/index.js; printf "new_info_req_url="; grep -c "info\.req\.url" "$f"; printf "old_assign_info_url="; grep -c "=[[:space:]]*info\.url;" "$f"'
  echo "=== 1. start_period (P10) ==="
  grep -n 'start_period\|start_interval\|retries\|interval' "$R/docker/prod/docker-compose.local.yml" | head -8
  echo "=== 2. P2: готовности ==="
  curl -sS --max-time 8 http://127.0.0.1:3100/health/ready; echo
  echo "=== 3. P1: кто владеет api.balloo.su ==="
  sudo nginx -t 2>&1 | tail -4
  curl -sS -o /dev/null -w 'api_health=%{http_code}\n' --max-time 8 https://api.balloo.su/health
  ls -l /etc/nginx/sites-enabled/ | grep -iE 'api\.balloo|balloo' || echo "balloo-конфигов нет"
  echo "=== 4. P3/P4: живой конфиг vs репозиторий ==="
  sha256sum "$R/docker/prod/nginx/balloo-docker.conf" /etc/nginx/sites-enabled/balloo-docker.conf 2>&1
  echo "=== 5. P5: сертификаты и таймеры ==="
  sudo certbot certificates 2>/dev/null | grep -E 'Name:|Expiry' | head -16
  systemctl is-enabled certbot.timer balloo.service docker nginx 2>&1
  echo "=== 6. P7: firewall ==="
  sudo ufw status numbered | head -20
  echo "=== 7. чужие сайты живы (только коды) ==="
  for h in cockpit.balloo.su alpha.balloo.su console.balloo.su; do curl -sS -o /dev/null -w "$h=%{http_code}\n" --max-time 8 "https://$h/" 2>&1; done
  echo "=== 8. P11: SMTP в окружении контейнера ==="
  docker exec balloo-server sh -lc 'env | grep -iE "^SMTP|MAIL" | sed -E "s/(PASS|PASSWORD)=.*/\1=***/"' || echo "нет env"
} 2>&1 | tee /tmp/audit-$D.log
```

**Что ожидаем:** п.0 `new_info_req_url=1`, `old_assign_info_url=0`; п.2 `"minio":{"ok":true}` (иначе — разбор ключей MinIO, P2 остаётся); п.3 `api_health=200` и нет `conflicting server name` (иначе — §6 шаг 3); п.4 одинаковые sha256 (иначе — §6 шаг 4, живой конфиг канон); п.5 `certbot.timer enabled`, `balloo.service enabled`, сроки сертификатов > 14 дней; п.6 в списке только 22/80/443 + известные чужие; п.7 чужие сайты не `000` и не `5xx`; п.8 — видно, задан ли `SMTP_HOST` вообще (для решения по P11).

---

## 12. Как запускать следующую сессию

1. Прислать ассистенту: `прочитай tickets/prod-deploy-handoff-20260912.md и продолжай`.
2. Ассистент смотрит §1 «Текущая точка» и §2 «Журнал этапов», ничего не переизобретает.
3. Пользователь выполняет батч из §11 и присылает вывод целиком.
4. Ассистент обновляет документ (новая строка журнала + статусы), затем даёт следующий батч.

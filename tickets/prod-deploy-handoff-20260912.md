# Тикет: деплой Balloo на прод — передача в новую сессию

> Дата: 2026-09-12
> Цель сессии: довести прод-деплой balloo.su до состояния «работает по http+https, поднимается сам после ребута сервера».
> Этот файл — единственный входной документ новой сессии. Читать целиком, до первой команды.

---

## 0. ЖЁСТКИЕ ПРАВИЛА РАБОТЫ (нарушение = критическая ошибка)

1. **Доступа к серверу у ассистента нет.** Ассистент работает на ноутбуке. Пользователь — глаза и руки на сервере: ассистент даёт команды, пользователь выполняет и присылает вывод.
2. **НИКАКИХ попыток подключения к серверу** со стороны ассистента: ни `ssh`, ни `scp`, ни `curl` к внутренним адресам, ни проверок портов/SSL-рукопожатий, ни `ping`. Даже «быстро проверять». Это не обходится молча при таймаутах.
3. **Состояние ноутбука ≠ состояние сервера.** По локальному checkout, локальному `git status`, локальному окружению нельзя делать выводы о том, что происходит на сервере. Любое такое утверждение — галлюцинация. Состояние сервера известно **только** из вывода, который пользователь прислал в этой сессии.
4. **Сервер физический, не VPS/облако.** Веб-консоли/панели управления нет. Перезагрузка — только кнопкой/физически, только по явной команде пользователя.
5. **Сервер мультипроектный.** Работают чужие проекты. Их не трогать, не перезапускать, не останавливать, не «оптимизировать», не проверять их конфиги. Особо беречь: **cockpit.balloo.su**, **центр-фр.рф** (`xn----itbymbjqk.xn--p1ai`), а также `alpha`, `console`, `vsc`.
6. **Любая правка nginx затрагивает все сайты** (общий процесс, один `reload`). Поэтому: один батч изменений → бэкап → `nginx -t` → ровно один `reload` → откат одной командой при ошибке. `systemctl restart nginx` не делать.
7. **Сертификаты не перевыпускать и аутентификатор не менять.** Все 7 сертификатов продлеваются плагином `certbot --nginx` (`authenticator = nginx`), таймер активен, `/var/www/certbot` отсутствует. ACME-локации и webroot-схему не добавлять.
8. Секреты, введённые в терминал, оседают в `~/.bash_history` — учитывать, чистить в финале по согласованию.
9. Рабочая область ассистента — только `/home/ivan/Рабочий стол/проекты/balloo`. Untracked-файлы не удалять (в этой сессии так был потерян локальный `docker-compose.prod.yml` в корне — повторить нельзя).

---

## 1. Параметры сервера (подтверждено выводом пользователя)

| Параметр | Значение |
|---|---|
| ОС | Ubuntu 24.04.4 LTS, ядро 6.8.0-138 (сервер просит reboot — отложить до финала) |
| hostname | `aedgar` |
| Пользователь | `cfr_balloo`, `HOME=/home/cfr_balloo` |
| Сеть | `eno1` 192.168.1.85, внешний адрес 188.73.176.34 |
| Репозиторий | `~/balloo`, remote `https://github.com/NBS-wt-Director/Messenger_Balloo.git` |
| Ветка на сервере | `fix/prisma-initial-migration-ddl` (HEAD `07ccb89`) |
| Compose-файл | `~/balloo/docker/prod/docker-compose.local.yml` + `--env-file .env.production` |
| Firewall | `ufw` активен, `deny (incoming)` |

Контейнеры (по последнему выводу): `balloo-postgres`, `balloo-redis`, `balloo-minio`, `balloo-server` — `Up (healthy)`, `balloo-web` — `Up`. Порты опубликованы только на `127.0.0.1`: `3100` (API), `8090` (web), `9001` (MinIO console). Postgres/Redis наружу не опубликованы.

Свободные/чужие слушающие: `*:3000` — чужой `next-server`, `127.0.0.1:8080` — чужой node, хостовые `postgres 127.0.0.1:5432` и `redis 127.0.0.1:6379` — **чужие**, наши контейнеры с ними не конфликтуют.

---

## 2. Что уже сделано и подтверждено

### 2.1 БД
Миграции Prisma применены, `tables=51`, `migrate status` → «up to date». Начальная миграция была починена заранее (ветка `fix/prisma-initial-migration-ddl`).

### 2.2 HTTPS/HTTP базово работают
- `curl https://balloo.su/health` → `200 {"status":"ok",...}`
- `POST /api/auth/register` и `/api/auth/login` → `200`, JWT в httpOnly-cookie с `Secure`, HSTS/CSP от helmet присутствуют.
- HTTP отдаёт `301` на HTTPS.

### 2.3 Автозапуск стека
- `/usr/local/bin/balloo-deploy.sh` — создан, ждёт готовности docker-демона, делает `up -d --remove-orphans` + `ps`.
- `/etc/systemd/system/balloo.service` — переписан без ошибок экранирования, `systemd-analyze verify` → `rc=0`, `systemctl start` → `active (exited)`, живые контейнеры не перезапустились (идемпотентность подтверждена).
- `docker`, `nginx` — `enabled`. Статус `balloo.service` после `enable` **не подтверждён выводом** — проверить.

### 2.4 Заглушки balloo.su/api.balloo.su (майские статик-сайты)
Пользователь подтвердил: это заглушки, отключаются. Команды отключения выдавались, **выполнены ли — не подтверждено**.

---

## 3. открытые проблемы (все — из реального вывода)

### P1. `api.balloo.su` затенён майским статик-блоком — ПОДТВЕРЖДЕНО
`/etc/nginx/sites-enabled/api.balloo.su` → `sites-available/api.balloo.su`: `server_name api.balloo.su www.api.balloo.su; root /home/cfr_balloo/sites/api.balloo.su; location / { try_files ... =404; }`.
Алфавитно раньше `balloo-docker.conf`, поэтому nginx оставляет его, а наш блок помечает `conflicting server name ... ignored`.
Следствие: `https://api.balloo.su/health` отдаёт **nginx 404**, а не API; весь нашенский api-блок (включая WS upgrade) не работает. Живой путь только `balloo.su/api/` и `balloo.su/ws/`.
Лечение: удалить симлинк + убрать файл в резерв (см. §4 шаг 1).

### P2. MinIO недоступен приложению — ПОДТВЕРЖДЕНО ЖИВЬЁМ
`curl http://127.0.0.1:3100/health/ready` вернул:
```json
{"status":"not_ready","checks":{"database":{"ok":true},"redis":{"ok":true},
"minio":{"ok":false,"error":"The Access Key Id you provided does not exist in our records."}}}
```
Причина по коду: приложение читает `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` (`packages/server/src/config/env.ts:31-32`, `app.ts:77-78`, `services/uploadService.ts:79-80`), а `docker-compose.local.yml` передаёт только `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` → приложение сидит на дефолте `minioadmin:minioadmin`.
Лечение: добавить две строки в `x-common-variables` compose-файла (см. §5).

### P3. Нет `client_max_body_size` в живом `balloo-docker.conf`
Дефолт nginx = 1 МБ, приложение разрешает 50 МБ (`MAX_FILE_SIZE=52428800`), истории — 100 МБ. Загрузки >1 МБ получат 413.

### P4. `Connection "upgrade"` проставлен всем API-запросам
Лечится `map` с уникальным именем переменной (не конфликтовать с чужими конфигами).

### P5. ACME на :80
Сейчас `authenticator = nginx` сам вставляет нужные локации при продлении, поэтому работает. **Менять способ продления нельзя** (см. правило 7). При удалении майских заглушек убедиться, что `certbot renew --dry-run` остаётся зелёным.

### P6. Секреты в git
`docker/prod/.env.production` закоммичен (в `.gitignore:21` явно не исключён) с реальными паролями. Ротация обесценивает утечку; сам файл из репо стоит убрать — **решение за пользователем**.

### P7. Мелочи
- `~/.bashrc:117` — `syntax error near unexpected token 'fi'` (лишний `fi`), чинится удалением строки после проверки.
- Пароль probe-эндпоинтов вводился в терминал → осел в истории.
- Probe-эндпоинты (`/health`, `/health/ready`) открыты снаружи; `/metrics` в API нет (`prom-client` не подключён, `PROMETHEUS_*` код не читает).

---

## 4. Что осталось сделать (порядок)

### Шаг 1. Убрать затеняющий vhost и проверить API
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
Каталоги `~/sites/balloo.su`, `~/sites/api.balloo.su` не удалять.

### Шаг 2. Минимальная правка живого конфига (только подтверждённое)
Только: `client_max_body_size 120m` в оба HTTPS-блока + `map` для WS upgrade вместо жёсткого `Connection "upgrade"`. Ничего больше не переписывать. Проверка — коды ответов + `curl` загрузки файла ~5 МБ.

### Шаг 3. MinIO-доступ + ротация секретов одним `up -d`
См. §5 и §6. После — `/health/ready` обязан отдать `minio:{"ok":true}`.

### Шаг 4. Probe-эндпоинты под basic-auth
`/etc/nginx/.htpasswd-balloo` уже создан (`root:www-data`, `640`). Блок `location ~ ^/(health|health/ready)(/|$)` с `auth_basic` вставить в оба блока. Healthcheck'и контейнеров ходят внутрь контейнера и nginx не затрагивают.
Открытый вопрос пользователю: нужен ли внешний uptime-мониторинг (тогда `/health` оставить открытым).

### Шаг 5. Финал
`sudo ufw status numbered` (проверить 80/443 и что не открыто лишнее) → починка `.bashrc` → чистка истории → **ребут по команде пользователя** → `docker compose ps` без единой команды → smoke-тест.

---

## 5. Изменения в репозитории (сделаны локально на ноутбуке, НЕ применены на сервере)

Локальный checkout: ветка `fix/prisma-initial-migration-ddl`, HEAD `07ccb89`. `git status`:

```
 M docker/prod/docker-compose.local.yml        # + MINIO_ACCESS_KEY / MINIO_SECRET_KEY, CDN_BASE_URL параметризован
D  docker/prod/nginx-host-balloo-http.conf     # удалены как устаревшие шаблоны
D  docker/prod/nginx-host-balloo-ssl.conf
?? docker/prod/nginx/balloo-docker.conf        # новый канонический vhost
?? .tmp/                                       # мусор из ошибочной ветки рассуждений
```

Локальный `.tmp/balloo-locations.conf` удалён ассистентом (файл создан ассистентом в этой же сессии, чужих данных в нём не было).

**Ничего из этого не закоммичено и не запушено.** Перед применением на сервере: проверить, не расходится ли живой `balloo-docker.conf` с версией в репозитории, и выбрать канон (пользователь просил «байт в байт» — значит живой конфиг переносится в репозиторий, а не наоборот).

Канонический путь файла в репо: `docker/prod/nginx/balloo-docker.conf` → на сервер `/etc/nginx/sites-enabled/balloo-docker.conf`.

---

## 6. Ротация секретов (порядок)

`POSTGRES_PASSWORD` применяется только при первой инициализации тома, поэтому: сначала `ALTER USER` внутри контейнера postgres, потом правка env, потом `up -d --force-recreate`. Ротировать: `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_PASSWORD`, `MINIO_ROOT_PASSWORD`. Сессии пользователей сбросятся. Файлу `.env.production` поставить `chmod 600`.

---

## 7. Ложные следы из этой сессии — НЕ ИСПОЛЬЗОВАТЬ

В сессии прозвучали утверждения и пути, которые не подтверждены выводом и/или относятся к другим машинам. Аннулированы целиком:

- хосты/пути `101.166.3.3`, `192.168.20.9`, `/opt/balloo`, `/srv/gigachat`, `root@...`, `giga.gogot.ru`, `balloo-locations.conf`, «сервер лежит / nginx не слушает 80/443»;
- «сертификат тестовый», «таймера автопродления нет», «контейнеры в цикле рестартов», «P1000 / неверный пароль БД», `JWT_SECRET`/`CRON_SECRET` (в этом коде таких переменных нет);
- «`return 503` в живом конфиге», `client_max_body_size 10m`, «21 включённый конфиг», «нужен webroot `/var/www/certbot`»;
- любые выводы о сервере, построенные на локальном checkout ноутбука.

Единственный источник истины по серверу — вывод, присланный пользователем.

---

## 8. Критерии готовности

- [ ] `https://balloo.su` и `http://balloo.su` (301) работают, страница логина отдаётся
- [ ] `https://api.balloo.su/health` отвечает JSON от приложения, а не nginx-404
- [ ] `/health/ready` → `not_ready` отсутствует, все три проверки `ok:true`
- [ ] Загрузка файла 5–50 МБ проходит без 413
- [ ] Probe-эндпоинты закрыты basic-auth (401 снаружи), healthcheck'и контейнеров `healthy`
- [ ] `certbot renew --dry-run` зелёный, таймер активен
- [ ] `balloo.service` в `enabled`, после ребута стек поднимается без ручных команд
- [ ] Чужие сайты (cockpit, центр-фр.рф, alpha, console, vsc) живы и не изменены
- [ ] Конфиг в репозитории байт-в-байт равен живому на сервере (`sha256sum` совпадает)
- [ ] Секреты ротированы, `.env.production` вне git или с `chmod 600`

# Balloo — статус прод-сервера `aedgar`

**Последнее обновление:** 29.10.2026, сессия деплоя P38 (тикет `tickets/active/1792812416.md`)
**Кто заполняет:** Ksyusha (AI-ассистент), по выводу команд, выполненных владельцем на сервере.
**Правило документа:** каждое утверждение сопровождается командой-доказательством и её фактическим выводом. Утверждение без вывода в этот файл не попадает.

---

## 1. Краткая сводка (TL;DR)

| Параметр | Значение |
|---|---|
| Хост / пользователь | `aedgar` / `cfr_balloo` (uid=1000, группы: `cfr_balloo`, `adm`, `cdrom`, …) |
| Публичный IP | `188.73.176.34` (подтверждён ранее; LAN-адрес `192.168.1.85`) |
| ОС | Ubuntu 24.04.4 LTS, ядро 6.8.0-138-generic |
| Каталог репозитория | `/home/cfr_balloo/balloo` (68 МБ) |
| Compose-файл прода | `/home/cfr_balloo/balloo/docker/prod/docker-compose.local.yml` |
| Git HEAD сервера | `fe602f0` (ветка `main`, up to date с `origin/main`) |
| Рабочее дерево сервера | чистое (`git status --porcelain` → пусто) |
| Корневой диск | `/dev/mapper/ubuntu--vg-ubuntu--lv`, 98 ГБ, занято 84 ГБ, **свободно 9,6 ГБ (90%)** |
| Диск данных Balloo | `/dev/sdd` (3,6 ТБ, метка `balloo`) → `/data/balloo`; **Docker data-root = `/data/balloo/docker`** |
| Свободно на диске данных | 3,4 ТБ (занято 1,1 ГБ, 1%) |
| Контейнеры Balloo | 6 живых: `balloo-web`, `balloo-web-admin`, `balloo-server`, `balloo-postgres`, `balloo-redis`, `balloo-minio` |
| Откатные теги | `balloo/web:rollback-20261029`, `balloo/web-admin:rollback-20261029` |
| Бэкап хостового nginx | `/root/balloo-docker.conf.bak-20261029` (6350 байт) |
| Состояние деплоя | **P38 задеплоен и работает**: nginx поправлен (admin→8092, CSP), `web`+`web-admin` пересозданы, ID Метрики в бандле (батч J 29.10.2026). Осталось: браузерная приёмка K |

---

## 2. Дисковая ёмкость и размещение (ключевой раздел)

### 2.1. Факт: данные Balloo — на отдельном диске `sdd`

```text
$ lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT | grep -v loop
NAME                       SIZE FSTYPE      LABEL      MOUNTPOINT
sda                        3,6T
├─sda1                       1M
├─sda2                       2G ext4                   /boot
└─sda3                     3,6T LVM2_member
└─ubuntu--vg-ubuntu--lv  100G ext4                   /
sdb                        3,6T
├─sdb1                       1M vfat
├─sdb2                     3,5T ext4        messenger  /data/messenger
└─sdb3                     128G swap                   [SWAP]
sdc                        3,6T ext4        nc1000     /data/nextcloud-1000
sdd                        3,6T ext4        balloo     /data/balloo
sr0                       1024M
```

```text
$ docker info --format "{{.DockerRootDir}}"
/data/balloo/docker

$ df -h / /data/balloo
Filesystem                         Size  Used Avail Use% Mounted on
/dev/mapper/ubuntu--vg-ubuntu--lv    98G   84G  9,6G  90% /
/dev/sdd                            3,6T  1,1G  3,4T   1% /data/balloo
```

**Вывод:** Docker data-root = `/data/balloo/docker` на диске `sdd` (3,6 ТБ, метка `balloo`).
Образы, тома PostgreSQL/Redis/MinIO, кэш сборки — **на отдельном диске**. Требование
владельца «Balloo не на системном диске» — **выполнено**.

### 2.2. Что осталось на системном диске

| Объект | Путь | Размер | Оценка |
|---|---|---|---|
| Репозиторий (только код) | `/home/cfr_balloo/balloo` | 68 МБ | ✅ допустимо (код, не данные) |
| `/var/lib/docker` | — | **0 байт** (`sudo du -sh` → `0`) | ✅ data-root перенесён |
| `/home/cfr_balloo` целиком | — | 42 ГБ | ⚠️ из них `sites` — 38 ГБ статики центр-фр.рф (чужой проект, D-002 п.5: перенос отложен) |
| `/usr` | — | 12 ГБ | системное |
| `/var/log` | — | 3,9 ГБ | системное |
| `/` итого | — | 84 ГБ из 98 (90%) | ⚠️ свободно 9,6 ГБ |

### 2.3. Расхождение с документацией соседнего репозитория

`protocols/server-main.md` в соседнем репозитории содержит **устаревшие** строки:

| Файл, строка | Что написано | Факт |
|---|---|---|
| `protocols/server-main.md:137` | «Данные контейнеров — `/data/raid/docker` (RAID1)» | `/data/balloo/docker` (sdd), рейда нет с 26.10 |
| `protocols/server-main.md:56` | «/data/raid — 3,6 ТБ, RAID1 (sdc+sdd, DDF), 106 МБ, пустует» | рейд распущен; `sdc` → `/data/nextcloud-1000`, `sdd` → `/data/balloo` |
| `protocols/server-main.md` (volumes) | «`prod_minio-data`, `prod_postgres-data`, `prod_redis-data`» | фактически: `balloo_pgdata`, `balloo_postgres-data`, `balloo_redis-data` |
| `inventory/hardware-aedgar.md:116` | «/data/raid 3,6T, 106M, пуст» | `/data/raid` больше не существует |
| `protocols/server-main.md:50` | «Root 98 ГБ, занято 68 ГБ (68,8%)» | занято 84 ГБ (90%) |

**Уведомление отправлено** — см. `tasks/T-008-aedgar-facts-2026-10-29.md` в соседнем
репозитории `работа с серверами (не код, а настройка установка)`.

### 2.4. Нерешённое расхождение (требует проверки)

`docker system df` показывает **14.59 ГБ** образов, но `/data/balloo` занят всего **1,1 ГБ**.
Одно из двух неверно. Гипотезы:

1. `docker system df` считает размер слоёв из `containerd` на root (в документации
   соседнего репо: «containerd-слои на root (1,9 ГБ после prune)»).
2. Образы разделяют слои с чужими проектами (`crm`, `nc1000`, `ollama`).
3. `du` на `/data/balloo` не видит часть из-за прав.

Проверяется батчем D5 (см. §10). До проверки **утверждать, что все образы на sdd, нельзя**.

---

## 3. Git-состояние сервера

```text
$ cd /home/cfr_balloo/balloo && git rev-parse --abbrev-ref HEAD && git rev-parse --short HEAD
main
fe602f0

$ git fetch origin
From https://github.com/NBS-wt-Director/Messenger_Balloo
   ab1575c..fe602f0  main       -> origin/main

$ git rev-list --count HEAD..origin/main   # было до checkout
4
$ git rev-list --count origin/main..HEAD
0

$ git status --porcelain | head -20
(пусто)
```

**История:** сервер стоял на `ab1575c`, отставал на 4 коммита. Выполнен `git checkout -B main origin/main` → HEAD стал `fe602f0`. Дерево чистое, локальных правок на сервере нет.

**Что вошло в эти 4 коммита:**

| Коммит | Содержание |
|---|---|
| `cbb0747` | запись сервиса balloo в каталог `Servers_Servises` (9 файлов) |
| `d07ad9e` | фикс админки: lazy-обёртки для named-экспортов, вход через `balloo.su/#/login`, CSP `mc.yandex.ru` в `docker/nginx.conf` |
| `69e5b04` | закрытие тикетов 1793187702, 1793259599 |
| `fe602f0` | правка протокола деплоя (этап A/B, батч F, батч C) |

```text
$ git diff --stat ab1575c..fe602f0 | tail -3
 46 files changed, 944 insertions(+), 10613 deletions(-)
```

**Миграции БД:** в диапазоне `ab1575c..fe602f0` **отсутствуют**.

```text
$ git diff --name-only ab1575c..fe602f0 | grep -i migration
(пусто)
$ ls packages/shared/prisma/migrations/ | tail -3
20261017000000_group_rules_media_requests
20261021000000_add_employees
migration_lock.toml
```

**Следствие:** контейнер `balloo-server` пересоздавать не нужно, шаг F2 (миграции) снят.

---

## 4. Контейнеры

```text
$ docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Ports}}' | head -30
nc1000-collabora        Up 26 hours (healthy)   127.0.0.1:9980->9980/tcp
balloo-web-admin        Up 28 hours     127.0.0.1:8092->80/tcp
balloo-web              Up 28 hours     127.0.0.1:8090->80/tcp
ollama                  Up 37 hours     127.0.0.1:11434->11434/tcp
crm-app                 Up 2 days       127.0.0.1:8084->80/tcp
crm-db                  Up 2 days       5432/tcp
nc1000-app              Up 2 days       127.0.0.1:8081->80/tcp
nc1000-db               Up 2 days       5432/tcp
nc1000-redis            Up 2 days       6379/tcp
balloo-server           Up 2 days (healthy)     127.0.0.1:3100->3000/tcp
balloo-postgres         Up 2 days (healthy)     5432/tcp
balloo-redis            Up 2 days (healthy)     6379/tcp
balloo-minio            Up 2 days (healthy)     9000/tcp, 127.0.0.1:9001->9001/tcp
```

**Важно:** на хосте живут **чужие проекты** (`crm`, `nc1000`, `ollama`, `collabora`). Любые операции уровня `docker system prune`, перезапуск Docker-демона, пересоздание сети `balloo-net` затронут их. Запрещены протоколом.

| Контейнер | Порт (loopback) | Роль |
|---|---|---|
| `balloo-web` | 127.0.0.1:8090 | основной SPA (`packages/web`) |
| `balloo-web-admin` | 127.0.0.1:8092 | админ-SPA (`packages/web-admin`) |
| `balloo-server` | 127.0.0.1:3100 → 3000 | backend (Node) |
| `balloo-postgres` | внутренний 5432 | БД |
| `balloo-redis` | внутренний 6379 | кэш/WS |
| `balloo-minio` | 9000 внутр., 9001 loopback | S3-хранилище |

---

## 5. Nginx: критичное расхождение хоста и репозитория

### 5.1. Факты

```text
$ sudo diff -q /etc/nginx/sites-enabled/balloo-docker.conf /home/cfr_balloo/balloo/docker/prod/nginx/balloo-docker.conf
Files ... differ
NGINX: РАЗЛИЧАЕТСЯ

$ sudo grep -c mc.yandex.ru /etc/nginx/sites-enabled/balloo-docker.conf
0

$ sudo ls -la /etc/nginx/sites-enabled/balloo-docker.conf
-rw-r--r-- 1 root root 6350 окт 15 21:42 balloo-docker.conf

# размер версии из репозитория:
$ wc -c docker/prod/nginx/balloo-docker.conf
9680 docker/prod/nginx/balloo-docker.conf
```

### 5.2. Таблица различий

| Свойство | Хостовый конфиг (сервер, 15.10) | Репозиторий (`fe602f0`) |
|---|---|---|
| Размер | 6350 байт | 9680 байт |
| `add_header Content-Security-Policy` | **отсутствует вообще** | есть в блоках web / features / admin |
| Блок `admin.balloo.su` | **отдельного нет** | есть, проксирует на `:8092` |
| Проксирование админки | через общий SPA-блок на **`:8090`** | отдельный блок на **`:8092`** |
| Блок `cdn.balloo.su` | **есть** (→ `minio:9000/balloo-media/`) | **отсутствует** |
| Сертификат `balloo.su` | `/etc/letsencrypt/live/balloo.su-0001/` | `/etc/letsencrypt/live/balloo.su/` |

> **Примечание от 29.10.2026:** таблица описывает состояние хоста **на 15.10**
> (это снимок, по которому принималось решение). После батча G хост изменён:
> CSP добавлен (2 заголовка), блок `admin.balloo.su` выделен и ведёт на `:8092`.
> Актуальное состояние — §6.5 и блок `nginx:` в §9. Копировать репозиторный файл
> целиком по-прежнему нельзя: он не содержит блок `cdn.balloo.su` и ссылается на
> `live/balloo.su/` вместо `live/balloo.su-0001/`.

### 5.3. Почему это критично

Локальная проверка репозитория:

```text
$ grep -n "admin" packages/web/src/App.tsx
(пусто)
$ ls packages/web/src/screens/admin/
(каталог отсутствует)
```

В `fe602f0` 24 админ-экрана **удалены из `packages/web`** и живут только в `packages/web-admin`.

> **Ловушка:** если пересобрать `web` и пересоздать `balloo-web`, не поправив хостовый nginx, то `admin.balloo.su` (сейчас проксируется на `:8090`) начнёт отдавать **белый экран** — маршрутов админки в основном бандле больше нет.
>
> Поэтому порядок обязателен: **сначала правка nginx (`admin` → `:8092`), потом пересоздание контейнеров**.

### 5.4. Что отдаётся сейчас (до правок)

```text
$ curl -sI https://balloo.su/ | grep -i content-security-policy
content-security-policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://api.balloo.su https://balloo.su https://cdn.balloo.su wss://api.balloo.su; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-src 'none'; media-src 'self' https: data:;

$ curl -sI https://admin.balloo.su/ | grep -i content-security-policy
(тот же заголовок — отдаёт контейнер, не хост)

$ curl -s -o /dev/null -w "balloo.su=%{http_code}\n" https://balloo.su/
balloo.su=200
$ curl -s -o /dev/null -w "admin.balloo.su=%{http_code}\n" https://admin.balloo.su/
admin.balloo.su=200
```

**Вывод:** CSP сейчас приходит **только из контейнера** `balloo-web` (старый образ, `script-src 'self'` без Метрики). Хостовый nginx CSP не добавляет вовсе. Метрика на проде заблокирована.

### 5.5. Сертификат

```text
$ sudo ls /etc/letsencrypt/live/
alpha.balloo.su  cockpit.balloo.su  xn--1000-...
api.balloo.su    console.balloo.su  xn--d1acoigc6ae0f...
balloo.su        README             xn----itbymbjqk...
balloo.su-0001   vsc.balloo.su      xn--j1ael...

$ echo | openssl s_client -connect 127.0.0.1:443 -servername admin.balloo.su 2>/dev/null | openssl x509 -noout -ext subjectAltName
X509v3 Subject Alternative Name:
DNS:admin.balloo.su, DNS:api.balloo.su, DNS:app.balloo.su, DNS:balloo.su, DNS:blog.balloo.su, DNS:cdn.balloo.su, DNS:command.balloo.su, DNS:docs.balloo.su, DNS:download.balloo.su, DNS:history.balloo.su
```

**Вывод:** сертификат `balloo.su-0001` покрывает все нужные домены, включая `admin.balloo.su`. Отдельный сертификат для админки не требуется.

---

## 6. Состояние деплоя P38 на момент записи

### 6.1. Сделано

| Шаг | Доказательство |
|---|---|
| A. Локальный префлайт | `pnpm test` EXIT=0 (shared 76, server 712, web 266, admin 32); `pnpm build` EXIT=0 |
| B. Push | `69e5b04..fe602f0  main -> main` |
| C. Разведка сервера | §1–§4 этого документа |
| D. Код на сервере | `git rev-parse --short HEAD` → `fe602f0`, дерево чистое |
| E. Откатная точка | см. §6.3 |
| F. Сборка образов | см. §6.2 |

### 6.2. Результат сборки (батч F)

```text
$ cd /home/cfr_balloo/balloo/docker/prod && docker compose -f docker-compose.local.yml --env-file .env.production build web web-admin
...
#36 exporting manifest sha256:ecaf4b6ae2b6e39e0ed0569779c93bbff5a35436929eb86b7b89283ea303308c
#36 exporting config   sha256:db9ccaa3a396ca96eabc2a511077aa15b4930f3849f637f144f119769b3206f1
#36 naming to docker.io/balloo/web:local
#36 DONE 10.9s
#37 exporting manifest sha256:0b9e6848af5cc9af6ecab3779ff156e8d0c0d081fd3ffe3580a371a4a5dbd700
#37 exporting config   sha256:838a31fcc139449360b6f75248dfa1ba0016c779aa52603f11cc4d993c053270
#37 naming to docker.io/balloo/web-admin:local
#37 DONE 11.0s
Image balloo/web:local Built
Image balloo/web-admin:local Built
```

| Образ | Новый manifest | Новый config |
|---|---|---|
| `balloo/web:local` | `sha256:ecaf4b6a…308c` | `sha256:db9ccaa3…06f1` |
| `balloo/web-admin:local` | `sha256:0b9e6848…d700` | `sha256:838a31fc…3270` |

**Сборка прошла без ошибок.** Контейнеры при этом **не пересозданы** — прод продолжает работать на старом коде.

### 6.3. Точки отката

```text
$ docker images | grep -E "rollback-20261029|balloo/web:local|balloo/web-admin:local"
balloo/web-admin:local               87ab1e4c067d    97MB   27MB
balloo/web-admin:rollback-20261029   87ab1e4c067d    97MB   27MB
balloo/web:local                     fa56089b41cc   101MB   28.2MB
balloo/web:rollback-20261029         fa56089b41cc   101MB   28.2MB
```

**Внимание:** `balloo/web:local` на момент снятия тега = `fa56089b41cc` (старый образ). После сборки тег `:local` уже указывает на новый образ, а `rollback-20261029` сохранил старый ID — это и есть точка возврата.

Бэкап конфига nginx:

```text
$ sudo cp -a /etc/nginx/sites-enabled/balloo-docker.conf /root/balloo-docker.conf.bak-20261029
$ sudo ls -la /root/balloo-docker.conf.bak-20261029
-rw-r--r-- 1 root root 6350 окт 15 21:42 /root/balloo-docker.conf.bak-20261029
```

| Шаг | Статус |
|---|---|
| G. Точечная правка хостового nginx (`admin` → `:8092`, + CSP с Метрикой) | **выполнено 29.10.2026** (файл 6350 → 8373 байт, `nginx -t` зелёный) |
| H. `nginx -t` + reload | **выполнено 29.10.2026** (`reload OK`, в памяти 2× `server_name admin.balloo.su;`, 1× `proxy_pass …:8092/`) |
| I. Пересоздание `balloo-web` и `balloo-web-admin` | **выполнено 29.10.2026** (image `84da8c18…` / `5eab97e7…`, `restarts=0`) |
| J. Доказательства (`imageid`, `restart_count`, хэши бандлей, `curl`) | **снято 29.10.2026**, см. §6.5 |
| K. Браузерный чек-лист владельца | **не выполнено** |
| L. Метрика: ID не попадал в сборку (тикет 1793270207) | **не выполнено на проде** — ждёт пересборки `web` (батч J в тикете 1792812416) |

### 6.5. Доказательства из батча I (29.10.2026)

```text
=== 1. КОНТЕЙНЕРЫ: ID ОБРАЗА, ЗАПУСК, РЕСТАРТЫ ===
/balloo-web image=sha256:84da8c18b61c3da83e4993264b3b2cc093a91a40ab53e9ac9b7c2224f2eb176a started=2026-10-29T10:25:44.651363755Z restarts=0 status=running
/balloo-web-admin image=sha256:5eab97e7e55ae61943ef5dff979c3dd2008c945e0e0a1e984ceb8f2ac612dde8 started=2026-10-29T10:25:43.606919792Z restarts=0 status=running
balloo-server   Up 2 days (healthy)
balloo-postgres Up 2 days (healthy)
balloo-redis    Up 2 days (healthy)
balloo-minio    Up 2 days (healthy)

=== 2. ОТКАТНЫЕ ТЕГИ НА МЕСТЕ ===
balloo/web:rollback-20261029 sha256:fa56089b41cc…
balloo/web-admin:rollback-20261029 sha256:87ab1e4c067d…

=== 3. БАНДЛИ: web ===
8090:   assets/index-DEfZrNHf.js
домен:  assets/index-DEfZrNHf.js

=== 4. БАНДЛИ: admin ===
8092:   assets/index-Df-Nw9rr.js
домен:  assets/index-Df-Nw9rr.js

=== 5. CSP НА balloo.su ===
2
content-security-policy: … script-src 'self' https://mc.yandex.ru; …
content-security-policy: … script-src 'self' https://mc.yandex.ru; …

=== 6. МАРКЕР НОВОГО КОДА В WEB-БАНДЛЕ ===
mc.yandex.ru в бандле: 0

=== 7. ЖИВЫЕ ОТВЕТЫ ===
https://balloo.su/               200
https://admin.balloo.su/         200
https://api.balloo.su/health     401
admin title: <title>Balloo Admin</title>
```

**Чтение результатов — честно, без прикрас:**

1. **Имя web-бандля не изменилось** (`index-DEfZrNHf.js` до и после). Это **не**
   провал деплоя: `git diff --stat ab1575c..fe602f0 -- packages/web/src` →
   27 файлов, 10 545 удалений, **0 добавлений** (мёртвые admin-копии, в граф
   модулей не входили: `git show ab1575c:packages/web/src/App.tsx | grep -i admin`
   → пусто). Содержимое бандля идентично → хэш имени совпал.
   Новизна подтверждается иначе: `image=84da8c18…` (было `fa56089b…`) и
   появление `mc.yandex.ru` в контейнерном CSP (п.5 — оба заголовка с Метрикой).
   **Вывод на будущее: для web хэш бандля — ненадёжный маркер; маркер = ID
   образа + CSP контейнера + наличие целевого кода в бандле.**
2. **`mc.yandex.ru` в бандле = 0 → Метрика на проде мертва, и CSP тут ни при
   чём.** Причина в сборке: `docker/Dockerfile.web` принимал только
   `ARG VITE_API_URL`; `VITE_YM_METRIKA_ID` (есть в `.env.production:158`)
   не попадал в build args → `import.meta.env.VITE_YM_METRIKA_ID` = undefined →
   `getMetrikaId()` → null → `initYandexMetrika()` выходит на
   `packages/web/src/utils/yandex-metrika.ts:53-57` **до** вставки `<script>`.
   Локальная проверка обеих веток: сборка с env → `tag.js` 1, `mc.yandex.ru` 1,
   `112269610` найдено; без env → `tag.js` 0, `yaCounter` 0, `mc.` 0.
   Исправление — тикет **1793270207**, коммит `2f2d584` (Dockerfile `ARG`+`ENV`,
   compose build arg для `web`, тест `metrika-build-args.test.ts`, 4/4).
3. **Админка починена полностью:** отдельный vhost на `:8092`, бандль совпадает
   портом и доменом, `<title>Balloo Admin</title>`, 200.
4. **Двойной CSP сохранён намеренно:** контейнерный и хостовый теперь
   согласованы (оба с `mc.yandex.ru`), браузер применяет оба — ни один не
   блокирует Метрику.

### 6.6. Батч J — Метрика в проде (29.10.2026)

```text
=== 1. КОД ===
HEAD=4dae02b
docker/Dockerfile.web:54:ARG VITE_YM_METRIKA_ID=
docker/Dockerfile.web:55:ENV VITE_YM_METRIKA_ID=${VITE_YM_METRIKA_ID}
docker/prod/docker-compose.local.yml:206:        VITE_YM_METRIKA_ID: ${VITE_YM_METRIKA_ID:-}

=== 2. ID В ENV ===
158:VITE_YM_METRIKA_ID="112269610"

=== 3. ДО СБОРКИ ===
image=sha256:84da8c18b61c… started=2026-10-29T10:25:44Z
assets/index-DEfZrNHf.js

=== 4. СБОРКА web ===
#34 naming to docker.io/balloo/web:local … DONE 6.0s
Image balloo/web:local Built

=== 5. ПЕРЕСОЗДАНИЕ ===
Container balloo-web Recreated
Container balloo-web Started

=== 6. МАРКЕР: Метрика в бандле ===
бандль: assets/index-2omaDl-E.js
tag.js: 1
mc.yandex.ru: 1
112269610: 1

=== 7. КОНТЕЙНЕРЫ ===
balloo-web  Up 4 seconds
balloo-web-admin  Up 56 minutes
balloo-server  Up 2 days (healthy)
balloo-postgres Up 2 days (healthy)
balloo-redis    Up 2 days (healthy)
balloo-minio    Up 2 days (healthy)
```

**Чтение:**

- **Имя бандля изменилось** (`index-DEfZrNHf.js` → `index-2omaDl-E.js`) —
  в отличие от батча I, где код web в диапазоне не менялся. Здесь в код реально
  добавился рабочий блок счётчика, что и подтверждают все три маркера по 1.
- Манифест нового образа: `sha256:5c271dcc…` (в `docker inspect` отразится как
  ID образа, это разные хэши — см. §6.5 примечание).
- `balloo-web-admin` показывает `Up 56 minutes` — это перезапуск из батча H,
  батч J его не трогал (`--no-deps web`).
- Остальные четыре — прежний аптайм 2 days: пересоздание затронуло ровно один
  контейнер, как и планировалось.
- **Что ещё НЕ подтверждено:** что счётчик реально шлёт beacon в Яндексе —
  это требует браузера (этап K, пункт K5). На уровне артефакта сборки всё сходится.

---

## 7. Ограничения и запреты на этом хосте

Взято из `AGENTS.md` (раздел «Команда Деплой») и подтверждено фактами §4:

| Запрещено | Причина (фактическая) |
|---|---|
| `docker compose down` / `rm` / `network prune` | сеть `balloo-net` — SMTP-релей postfix; плюс на хосте 6 чужих контейнеров |
| `up -d --build` на весь стек | пересоздаст `balloo-server`, `balloo-postgres` — простой БД и разрыв WS |
| `systemctl restart docker` | уронит `crm`, `nc1000`, `ollama`, `collabora` |
| `git clean -fd` / `git reset --hard` | снесёт untracked-файлы прод-машины (сейчас их нет, но правило постоянное) |
| `docker builder prune -a` | потеря кэша pnpm-store и prisma-engines → долгая сборка |
| Копирование репо-конфига nginx целиком | потеряет блок `cdn.balloo.su`, сошлётся на несуществующий `live/balloo.su/` |
| Пересоздание `web` без правки nginx | админка (`admin.balloo.su` → `:8090`) останется без маршрутов → белый экран |

---

## 8. Вопросы, требующие решения владельца

1. **Правка nginx — ЗАКРЫТО 29.10.2026.** Точечная правка применена (батч G),
   `nginx -t` зелёный, reload выполнен (G2). Доказательства: §6.5, блок
   `nginx:` в §9. Файл 6350 → 8373 байт, бэкап
   `/root/balloo-docker.conf.bak-20261029-g`.
2. **Место на корне.** Свободно 9,6 ГБ из 98 (90%). Данные Balloo на sdd, но корень
   растёт (68 ГБ → 84 ГБ с 27.10). Источник роста — `/home/cfr_balloo/sites` (38 ГБ
   статики центр-фр.рф, чужой проект). По D-002 п.5 перенос отложен владельцем.
   Нужно решение: переносить статику на sdb или пока не трогать.
3. **Проверить расхождение `docker system df` (14.59 ГБ) vs `du /data/balloo` (1,1 ГБ).**
   Батч D5 ниже. До проверки неизвестно, все ли образы действительно на sdd.
4. **Браузерная приёмка P38 (этап K).** Чек-лист в тикете 1792812416: вход,
   запросы на `api.balloo.su`, консоль, `/#/`-роутер, `admin.balloo.su`
   (вход + список), Метрика в Network.
5. **Пересборка web с ID Метрики (батч J в тикете 1792812416).** Без неё
   счётчик 112269610 не инициализируется, несмотря на открытый CSP.

---

## 9. Машиночитаемый блок

```yaml
server:
  hostname: aedgar
  user: cfr_balloo
  uid: 1000
  os: Ubuntu 24.04.4 LTS
  kernel: 6.8.0-138-generic
  lan_ip: 192.168.1.85
  public_ip: 188.73.176.34

storage:
  separate_disk_for_balloo: true         # требование владельца ВЫПОЛНЕНО
  data_disk_device: /dev/sdd
  data_disk_label: balloo
  data_disk_mount: /data/balloo
  data_disk_size: 3.6T
  data_disk_used: 1.1G
  data_disk_avail: 3.4T
  data_disk_use_percent: 1
  root_device: /dev/mapper/ubuntu--vg-ubuntu--lv
  root_size: 98G
  root_used: 84G
  root_avail: 9.6G
  root_use_percent: 90
  root_top_consumers:
    home_cfr_balloo: 42G
    home_sites_static: 38G          # чужой проект центр-фр.рф, D-002 п.5 отложено
    usr: 12G
    var_log: 3.9G
  repo_path: /home/cfr_balloo/balloo
  repo_size: 68M
  docker_root: /data/balloo/docker   # НА ОТДЕЛЬНОМ ДИСКЕ sdd
  var_lib_docker_size: 0             # du -sh → 0 (перенесён)
  docker_images_size: 14.59GB        # ⚠️ расходится с du /data/balloo = 1.1G
  docker_containers_size: 395.4MB
  docker_volumes_size: 1.056GB
  docker_build_cache: 1.599GB
  docker_build_cache_reclaimable: 1.561GB
  disks:
    sda: {size: 3.6T, role: "OS: /boot 2G + LVM root 100G"}
    sdb: {size: 3.6T, role: "/data/messenger (3.5T, пуст) + swap 128G"}
    sdc: {size: 3.6T, role: "/data/nextcloud-1000 (nc1000)"}
    sdd: {size: 3.6T, role: "/data/balloo (Docker data-root)"}
  raid: none                             # распущен 26.10 (D-002, T-005)


git:
  repo: /home/cfr_balloo/balloo
  branch: main
  head: fe602f0
  origin_main: fe602f0
  behind: 0
  ahead: 0
  dirty: false
  migrations_in_range: false
  range: ab1575c..fe602f0
  commits_in_range: 4

compose:
  file: /home/cfr_balloo/balloo/docker/prod/docker-compose.local.yml
  env_file: /home/cfr_balloo/balloo/docker/prod/.env.production
  env_file_size: 9241
  command: docker compose -f docker-compose.local.yml --env-file .env.production

containers:
  balloo-web:        { port: "127.0.0.1:8090", status: "Up 28 hours" }
  balloo-web-admin:  { port: "127.0.0.1:8092", status: "Up 28 hours" }
  balloo-server:     { port: "127.0.0.1:3100", status: "Up 2 days (healthy)" }
  balloo-postgres:   { port: "internal:5432",  status: "Up 2 days (healthy)" }
  balloo-redis:      { port: "internal:6379",  status: "Up 2 days (healthy)" }
  balloo-minio:      { port: "9000/127.0.0.1:9001", status: "Up 2 days (healthy)" }

foreign_containers:   # не трогать
  - nc1000-collabora
  - nc1000-app
  - nc1000-db
  - nc1000-redis
  - crm-app
  - crm-db
  - ollama

nginx:
  host_config: /etc/nginx/sites-enabled/balloo-docker.conf
  host_config_size: 8373            # после правки G (было 6350)
  host_config_mtime: "2026-10-29 15:15"
  host_config_sha_before: ef5e068ff5262439d67a4a97cabb5f30bd895dff90b65fb2cd5b9ea9291f5a1f
  host_backup_g: /root/balloo-docker.conf.bak-20261029-g
  repo_config: /home/cfr_balloo/balloo/docker/prod/nginx/balloo-docker.conf
  repo_config_size: 9680
  configs_identical: false          # по-прежнему: хост хранит cdn-блок и balloo.su-0001
  host_has_csp: true                # было false; 2 заголовка (web + admin)
  host_has_admin_block: true        # было false
  host_admin_proxies_to: "127.0.0.1:8092"   # было 8090 (ошибка)
  repo_admin_proxies_to: "127.0.0.1:8092"
  host_has_cdn_block: true
  repo_has_cdn_block: false
  cert_dir_used_by_host: /etc/letsencrypt/live/balloo.su-0001
  cert_dir_used_by_repo: /etc/letsencrypt/live/balloo.su
  cert_san_covers_admin: true
  nginx_t: successful
  reloaded: true

live_http:
  balloo_su_status: 200
  admin_balloo_su_status: 200
  csp_source: container_and_host     # было container_only
  csp_headers_count: 2
  csp_has_mc_yandex: true            # было false
  metrika_blocked: false             # CSP открыт (батч G)
  metrika_id_in_bundle: true         # было false; чинится тикетом 1793270207, батч J 29.10.2026
  metrika_working: unconfirmed       # требуется K5 (браузерный Network)
  admin_title: "Balloo Admin"
  web_bundle: assets/index-2omaDl-E.js    # после J (было index-DEfZrNHf.js)
  admin_bundle: assets/index-Df-Nw9rr.js  # после H

rollback:
  web_tag: balloo/web:rollback-20261029
  web_image_id: fa56089b41cc
  web_admin_tag: balloo/web-admin:rollback-20261029
  web_admin_image_id: 87ab1e4c067d
  nginx_backup: /root/balloo-docker.conf.bak-20261029
  nginx_backup_g: /root/balloo-docker.conf.bak-20261029-g

running_images:
  balloo-web: sha256:5c271dcc41885d0dbdcf3b874e9e0e41080013f08c877557ca580eb9f0d95fb0   # J 29.10.2026 (было 84da8c18)
  balloo-web-admin: sha256:5eab97e7e55ae61943ef5dff979c3dd2008c945e0e0a1e984ceb8f2ac612dde8
  restart_count: 0
  web_bundle: assets/index-2omaDl-E.js   # изменился после J (было index-DEfZrNHf.js)
  admin_bundle: assets/index-Df-Nw9rr.js # с H
  metrika_markers: {tag.js: 1, mc.yandex.ru: 1, id_112269610: 1}  # в прод-бандле

deploy_state:
  stage_completed: [A, B, C, C2, C3, D, E, F, G, G2, H, I, J]
  stage_pending: [K_browser_checklist]
  containers_recreated: true
  nginx_reloaded: true
  prod_serves_new_code: true
  metrika_id_in_bundle: true
  status: "P38 на проде работает (включая Метрику); ждёт браузерной приёмки K"

blockers:
  - id: nginx-stale
    severity: resolved
    description: "Хостовый nginx не знал про admin:8092 и CSP"
    resolution: "правка G + reload G2 29.10.2026: admin → :8092, 2 CSP с mc.yandex.ru"
    evidence: "nginx -T | grep -c 'server_name admin.balloo.su;' → 2; curl -sI → 2 CSP"
  - id: metrika-env
    severity: resolved
    description: "VITE_YM_METRIKA_ID не пробрасывался в docker-сборку web → счётчик мёртв"
    resolution: "тик. 1793270207 (коммит 2f2d584), пересборка батчем J 29.10.2026"
    evidence: "grep -c tag.js в прод-бандле → 1; mc.yandex.ru → 1; 112269610 → 1"
  - id: disk-space-root
    severity: warning
    description: "9,6 ГБ свободно из 98 ГБ (90%); рост с 68 до 84 ГБ из-за /home/cfr_balloo/sites (38 ГБ, чужой проект)"
  - id: docker-df-mismatch
    severity: warning
    description: "docker system df = 14.59 ГБ образов, du /data/balloo = 1.1 ГБ — не подтверждено, что все образы на sdd"

resolved:
  - id: disk-placement
    resolution: "Требование выполнено: sdd 3,6 ТБ → /data/balloo, Docker data-root = /data/balloo/docker"
    evidence: "docker info --format '{{.DockerRootDir}}' → /data/balloo/docker; lsblk: sdd ext4 balloo /data/balloo"
```

---

## 10. Следующий батч (D5) — проверка расхождения размеров

Не выдано владельцу на момент записи. Назначение: выяснить, почему `docker system df`
даёт 14.59 ГБ, а `du /data/balloo` — 1,1 ГБ.

```bash
bash -c 'echo "=== 1. DOCKER ROOT ==="; docker info --format "{{.DockerRootDir}}"; echo "=== 2. DU ==="; sudo du -sh /data/balloo/docker /data/balloo/docker/overlay2 /data/balloo/docker/volumes 2>/dev/null; echo "=== 3. CONTAINERD ==="; sudo du -sh /var/lib/containerd 2>/dev/null; echo "=== 4. ТОМА ==="; for v in $(docker volume ls -q); do printf "%-45s " "$v"; docker volume inspect "$v" --format "{{.Mountpoint}}"; done'
```

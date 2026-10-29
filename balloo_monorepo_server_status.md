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
| Состояние деплоя | образы **собраны**, контейнеры **не пересозданы**; nginx **не тронут** |

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

### 6.4. Осталось

| Шаг | Статус |
|---|---|
| G. Точечная правка хостового nginx (`admin` → `:8092`, + CSP с Метрикой) | **не выполнено** |
| H. `nginx -t` + reload | **не выполнено** |
| I. Пересоздание `balloo-web` и `balloo-web-admin` | **не выполнено** |
| J. Доказательства (`imageid`, `restart_count`, хэши бандлей, `curl`) | **не выполнено** |
| K. Браузерный чек-лист владельца | **не выполнено** |

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

1. **Правка nginx (блокирующее).** Подтвердить точечную правку (не копирование файла):
   блок `admin.balloo.su` → `:8092` + `add_header CSP` с `mc.yandex.ru` в web-блоке.
   Без этого пересоздание `web` даст белый экран админки.
2. **Место на корне.** Свободно 9,6 ГБ из 98 (90%). Данные Balloo на sdd, но корень
   растёт (68 ГБ → 84 ГБ с 27.10). Источник роста — `/home/cfr_balloo/sites` (38 ГБ
   статики центр-фр.рф, чужой проект). По D-002 п.5 перенос отложен владельцем.
   Нужно решение: переносить статику на sdb или пока не трогать.
3. **Проверить расхождение `docker system df` (14.59 ГБ) vs `du /data/balloo` (1,1 ГБ).**
   Батч D5 ниже. До проверки неизвестно, все ли образы действительно на sdd.

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
  host_config_size: 6350
  host_config_mtime: "2026-10-15 21:42"
  repo_config: /home/cfr_balloo/balloo/docker/prod/nginx/balloo-docker.conf
  repo_config_size: 9680
  configs_identical: false
  host_has_csp: false
  host_has_admin_block: false
  host_admin_proxies_to: "127.0.0.1:8090"   # ОШИБКА: должно быть 8092
  repo_admin_proxies_to: "127.0.0.1:8092"
  host_has_cdn_block: true
  repo_has_cdn_block: false
  cert_dir_used_by_host: /etc/letsencrypt/live/balloo.su-0001
  cert_dir_used_by_repo: /etc/letsencrypt/live/balloo.su
  cert_san_covers_admin: true

live_http:
  balloo_su_status: 200
  admin_balloo_su_status: 200
  csp_source: container_only
  csp_has_mc_yandex: false
  metrika_blocked: true

rollback:
  web_tag: balloo/web:rollback-20261029
  web_image_id: fa56089b41cc
  web_admin_tag: balloo/web-admin:rollback-20261029
  web_admin_image_id: 87ab1e4c067d
  nginx_backup: /root/balloo-docker.conf.bak-20261029

built_images:
  web:
    manifest: sha256:ecaf4b6ae2b6e39e0ed0569779c93bbff5a35436929eb86b7b89283ea303308c
    config: sha256:db9ccaa3a396ca96eabc2a511077aa15b4930f3849f637f144f119769b3206f1
  web_admin:
    manifest: sha256:0b9e6848af5cc9af6ecab3779ff156e8d0c0d081fd3ffe3580a371a4a5dbd700
    config: sha256:838a31fcc139449360b6f75248dfa1ba0016c779aa52603f11cc4d993c053270

deploy_state:
  stage_completed: [A, B, C, D, E, F]
  stage_pending: [G, H, I, J, K]
  containers_recreated: false
  nginx_reloaded: false
  prod_serves_new_code: false
  status: "не подтверждено"

blockers:
  - id: nginx-stale
    severity: blocking
    description: "Хостовый nginx не знает про admin:8092 и не отдаёт CSP; пересоздание web без правки = белый экран админки"
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

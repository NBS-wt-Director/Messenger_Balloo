# 📋 Operations Manual — Balloo Messenger

> **Версия:** 1.1 | **Дата:** 2026-10-01 (актуализация по HEAD `411d69a`)
> Инструкции для владельца сервера. Факты сверены с `docker/prod/docker-compose.local.yml`
> и `.env.production`; прод-команды проверены выводом сервера 29.09 (тикеты `1790523936`, `1790700801`).

---

## 1. Мониторинг

### Prometheus + Grafana

В docker-стеке (`docker/prod/docker-compose.local.yml`) сервисы мониторинга:

| Сервис | Порт на хосте (127.0.0.1) | Контейнерный порт |
|---|---|---|
| Prometheus | `${PROMETHEUS_HOST_PORT:-9091}` | 9090 |
| Grafana | `${GRAFANA_HOST_PORT:-3002}` | 3000 |
| Alertmanager | `${ALERTMANAGER_HOST_PORT:-9094}` | 9093 |

Все три — `profile: monitoring` (не поднимаются основным `up -d`).

**Сбор метрик:** prometheus.yml скрейпит `server:3000/metrics` (scrape_interval 10s).
⚠️ **Фактический статус:** `/metrics` на сервере отдаёт только админ-маршрут
`GET /api/admin/metrics` (JSON с бизнес-счётчиками, authRequired+adminOnly) —
**Prometheus-формата метрик (`prom-client`) в коде нет**. Скрейпинг получит 401/JSON
вместо текстового формата. Дашборды будут пустыми, пока `/metrics` в формате
Prometheus не реализован (кандидат в v2 / отдельный тикет).

**Дашборды:** провижнены в `docker/prod/grafana/provisioning/dashboards/`
(`balloo-production.json`); datasource-провижнинг пуст (`datasources/` пусто) —
Grafana потребует ручного подключения Prometheus после первого старта.

**Алерты:** `docker/prod/alertmanager.yml` — receivers `slack-critical` /
`slack-notifications` (Slack webhooks); email/telegram receivers закомментированы.
⚠️ `SLACK_WEBHOOK` в `.env.production` пуст — алерты сейчас никуда не доставляются.

**Service Status (в приложении):** модель `ServiceMetric` (`schema.prisma:1028`)
есть и заполняется `getMetrics` (admin); health-check воркера на node-cron и
WebSocket-канала `status.update` **в коде нет** — раздел «Service Status» в
`docs/06` описывает целевую v1-схему, не факт (см. §7 ниже).

---

## 2. Бэкапы

### PostgreSQL

**Механизм:** `pg_dump` в bind-каталог `/home/cfr_balloo/balloo/docker/prod/backups`
(примонтирован в контейнер как `/backups` — единственный bind у postgres, остальное —
named volumes).

**Скрипт бэкапа (внутри контейнера, роль `balloo` — в контейнере нет роли `postgres`):**

```bash
docker exec -i balloo-postgres pg_dump -U balloo -d balloo \
  | gzip > /backups/balloo-backup-$(date +%Y%m%d-%H%M%S).sql.gz
```

**Периодичность:** на данный момент **резервных копий нет** (cron у `cfr_balloo` пуст,
подтверждено сервером 27.09). Необходимо настроить cron:

```cron
# /etc/cron.d/balloo-backup (от пользователя cfr_balloo)
0 3 * * * docker exec -i balloo-postgres pg_dump -U balloo -d balloo | gzip > /backups/balloo-backup-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz
```

**Восстановление:**

```bash
# 1. Остановить запись в БД (батч от владельца — см. AGENTS.md «Команда Деплой»;
#    up -d --no-deps server после остановки web)

# 2. Восстановить из бэкапа (роль balloo, не postgres!):
zcat /backups/balloo-backup-20260930-030000.sql.gz \
  | docker exec -i balloo-postgres psql -U balloo -d balloo

# 3. Поднять server после восстановления:
cd /home/cfr_balloo/balloo
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production up -d --no-deps server
```

⚠️ **Ловушка ролей:** `docker exec balloo-postgres psql -U postgres …` падает с
`FATAL: role "postgres" does not exist` (подтверждено сервером 29.09) — в контейнере
только роль `balloo`. То же для хостовых `psql`/`redis-cli`: они попадают в
**хостовые** postgres/redis, не в контейнерные. В контейнер — только через `docker exec`.

**Хранение:** автоматическая чистка старше 7 дней:

```cron
0 4 * * * find /backups -name "balloo-backup-*.sql.gz" -mtime +7 -delete
```

### MinIO (S3)

MinIO данные в named volume `prod_minio-data`. Ручной бэкап:

```bash
docker run --rm -v prod_minio-data:/data -v /backups:/backup alpine \
  tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz -C /data .
```

---

## 3. Логирование

### Логи контейнеров

Логи Docker-контейнеров хранятся в `/var/lib/docker/containers/` на хосте. Просмотр:

```bash
# Последние 100 строк логов server:
docker logs --tail 100 balloo-server

# Последние 100 строк логов web:
docker logs --tail 100 balloo-web

# Live-режим:
docker logs -f balloo-server
```

**Ротация:** конфигурация Docker по умолчанию хранит логи до 10 файлов по 100 МБ. Рекомендуется ограничить: в `docker/prod/docker-compose.local.yml` добавить каждому сервису:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "50m"
    max-file: "3"
```

### Логи nginx (хост)

```bash
# Навигация: хостовый nginx, не контейнерный
tail -f /var/log/nginx/balloo.su.error.log
tail -f /var/log/nginx/balloo.su.access.log
```

---

## 4. Troubleshooting

### ⚠️ Сеть `balloo-net` = SMTP-ретранслятор postfix

Сеть `balloo-net` (docker-compose проект `prod`) имеет закреплённый шлюз `172.19.0.1`. Это **хостовый postfix-релей** (`SMTP_HOST` в `.env.production`).

**НЕЛЬЗЯ:**
- `docker compose down` — пересоздаст сеть, сломает почту
- `docker network prune` — удалит сеть
- `docker network rm balloo-net` — удалит сеть

**Проверка:** `docker network inspect balloo-net | grep Gateway`

### `/health` = 401 без учётных записей — это норма

На `https://balloo.su/health` и `https://api.balloo.su/health` ответ **401** без авторизации — это `auth_basic` от nginx. Это ожидаемое поведение. Авторизованный запрос (с cookie) возвращает `200`.

### `systemctl restart balloo` — НЕ деплой

systemd-юнит `balloo` вызывает `/usr/local/bin/balloo-deploy.sh`, который делает `docker compose up -d --remove-orphans` **без `--build`**. Новый код не соберётся. Для деплоя используйте батчи из AGENTS.md «Команда Деплой».

### Ловушка старой локальной `main` на сервере

Если на сервере `git checkout main` и `git pull` возвращает `Already up to date` при наличии новых коммитов в `origin/main` — значит сервер на старой ветке. **Правильный способ:**

```bash
cd /home/cfr_balloo/balloo
git fetch origin
git checkout -B main origin/main  # пересоздаёт main из origin
git merge --ff-only origin/main   # fast-forward только
git rev-parse --short HEAD        # сверяем HEAD с локальным
```

### Диск заполнен — сборочный кэш Docker

```bash
# Проверка:
docker system df

# Очистка кэша сборки (безопасно, без потери образов):
docker builder prune -f

# Полная очистка неиспользуемых данных (осторожно — удалит неиспользуемые образы):
docker system prune -f
```

### Порт 3000 на хосте занят чужим процессом

Порт `*:3000` слушает `next-server` (pid 1646994, опознан 29.09.2026) — это
чужой Next.js-проект на хосте, **не Balloo**. Порт приложения (`balloo-server`)
внутренний 3000, но наружу опубликован как `127.0.0.1:3100`, конфликта нет.
Порт 3000 в ufw не открыт — снаружи недоступен. Для повторной идентификации:

```bash
sudo ss -ltnp | grep ':3000'
```

### Ловушка: корректный health-путь

У приложения health — `/health` (и `/health/ready`), не `/api/health`:
`curl https://api.balloo.su/api/health` даст 404 (подтверждено 29.09).
На проде оба health-пути закрыты `auth_basic` nginx — **401 без учёток = норма**;
healthcheck'и контейнеров ходят на `127.0.0.1:3100` напрямую, мимо nginx.

### Ловушка: контракт API — с префиксом /api

Все API-маршруты живут под `/api/...` (`https://api.balloo.su/api/...`).
Путь без префикса (`https://api.balloo.su/auth/refresh-cookie`) даст 404 от Express
(подтверждено 29.09: 404 с helmet-заголовками — ответ приложения, не nginx).

---

## 5. Структура сервера (сводка)

| Компонент | Путь / Порт |
|---|---|
| Git-репо | `/home/cfr_balloo/balloo` |
| Compose (реально запущен) | `/home/cfr_balloo/balloo/docker/prod/docker-compose.local.yml` |
| Env (единственный источник секретов) | `/home/cfr_balloo/balloo/docker/prod/.env.production` (`chmod 600`) |
| Nginx vhost | `/etc/nginx/sites-enabled/balloo-docker.conf` |
| Бэкапы БД | `/home/cfr_balloo/balloo/docker/prod/backups` ↔ `/backups` в контейнере |
| Сертификаты | `/etc/letsencrypt/live/` (certbot, по поддомену) |
| БД | named volume `prod_postgres-data` |
| Медиа | named volume `prod_minio-data` |
| Сессии | named volume `prod_redis-data` |
| server наружу | `127.0.0.1:3100` (web-контейнер `127.0.0.1:8090→80`, `WEB_HOST_PORT=8090`) |
| MinIO console | `127.0.0.1:9001` (S3 9000 наружу не опубликован) |

Контейнеры: `balloo-postgres`, `balloo-redis`, `balloo-minio`, `balloo-server`,
`balloo-web` (все `restart: always`); мониторинг (`balloo-prometheus`,
`balloo-grafana`, `balloo-alertmanager`) — профиль `monitoring`.

⚠️ **Сеть `balloo-net` (compose-проект `prod`) — не пересоздавать** (см. §4):
шлюз `172.19.0.1` = хостовый postfix, `SMTP_HOST` для исходящей почты.

⚠️ **На той же машине другие проекты** (shared-хост): сайт cfrsite
(`/home/cfr_balloo/sites/`), чужой next-server на `*:3000`, хостовые
PostgreSQL/Redis (5432/6379), vsc/cockpit/console-вхосты. Их не трогать.

---

## 6. Контакты и доступы

| Роль | Способ |
|---|---|
| SSH | `ssh cfr_balloo@188.76.243.185` (хост `aedgar`) |
| PostgreSQL (контейнер) | `docker exec -it balloo-postgres psql -U balloo -d balloo` |
| Redis (контейнер) | `docker exec -it balloo-redis redis-cli` |
| GitHub | `https://github.com/NBS-wt-Director/Messenger_Balloo` |
| Канонический вход | хостовый nginx + Let's Encrypt (Cloudflare-туннель для balloo.su не задействован — проверено `cf-ray` отсутствует) |

---

## 7. Расхождения docs/06 с фактом (зафиксировано 01.10)

В `docs/06-devops-infrastructure.md` первые таблицы (v1, от 30.07) описывают
целевую схему и **не соответствуют факту**; фактическая часть начинается с
заголовка «Доменная схема и env API (Вариант C…)»:

- порты web `8080` / grafana `3001` / prometheus `9090` в таблицах v1 — факт:
  `8090` (WEB_HOST_PORT), `3002` (GRAFANA_HOST_PORT), `9091` (PROMETHEUS_HOST_PORT);
- nginx в контейнере (`nginx:1.25-alpine`, порт 80/443) — факт: nginx **хостовый**,
  контейнера nginx в compose нет;
- health-check воркер, WS-канал `status.update`, модель `ServiceStatusSnapshot` —
  в коде отсутствуют (есть только `ServiceMetric`);
- CI с 10 job'ами (e2e/load/security-tests, автодеплой SSH) — факт: `ci.yml`
  (install→migrate→seed→typecheck×3→lint×3→test×3→build), `cd.yml` — сборка и
  публикация образов в ghcr по тегу; автодеплоя SSH в CI нет;
- «Прямой пуш в main запрещён» — правило процесса, в CI-конфиге не реализовано.

Этот раздел — первоисточник для правки `docs/06` (задача п.6 тикета
`1790479920-03`); сами таблицы v1 в `docs/06` помечены при сверке.

---

*Документ создан 2026-09-30, актуализирован 2026-10-01. Обновлять при изменении инфраструктуры.*

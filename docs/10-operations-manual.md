# 📋 Operations Manual — Balloo Messenger

> **Версия:** 1.0 | **Дата:** 2026-09-30
> Инструкции для владельца сервера. Все команды проверены на хосте `aedgar` (188.76.243.185).

---

## 1. Мониторинг

### Prometheus + Grafana

В docker-стеке (`docker/prod/docker-compose.local.yml`) сервисы мониторинга включены через профиль `monitoring`:

| Сервис | Порт | Назначение |
|---|---|---|
| Prometheus | 9090 | Сбор метрик |
| Grafana | 3001 | Дашборды |
| Alertmanager | 9093 | Алерты |

**Сбор метрик:** сервер экспортирует метрики на `/metrics` (порт 3100). Prometheus scrape-конфиг в `docker/prod/prometheus.yml`.

**Дашборды:** провижнены в `docker/prod/grafana/provisioning/dashboards/`. На момент v1.0.0 дашборды базовые — CPU, память, сеть, запросы/сек. Расширение дашбордов — задача v2.

**Алерты:** настроены в `docker/prod/alertmanager.yml`. Каналы уведомлений: Telegram-бот, Email.

---

## 2. Бэкапы

### PostgreSQL

**Механизм:** `pg_dump` в именованный volume `prod_postgres-backups` (примонтирован в контейнер как `/backups`).

**Скрипт бэкапа:**

```bash
# Запуск бэкапа вручную:
docker exec -i balloo-postgres pg_dump -U balloo -d balloo \
  | gzip > /backups/balloo-backup-$(date +%Y%m%d-%H%M%S).sql.gz
```

**Периодичность:** на данный момент **резервных копий нет** (cron у `cfr_balloo` пуст). Необходимо настроить cron:

```cron
# /etc/cron.d/balloo-backup (от пользователя cfr_balloo)
0 3 * * * docker exec -i balloo-postgres pg_dump -U balloo -d balloo | gzip > /backups/balloo-backup-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz
```

**Восстановление:**

```bash
# 1. Остановить сервер (чтобы не было записей во время восстановления):
# (батч от владельца — см. AGENTS.md «Команда Деплой»)

# 2. Восстановить из бэкапа:
zcat /backups/balloo-backup-20260930-030000.sql.gz \
  | docker exec -i balloo-postgres psql -U balloo -d balloo

# 3. Пересоздать индексы после восстановления (если были DROP):
cd /home/cfr_balloo/balloo
docker compose -f docker/prod/docker-compose.local.yml --env-file docker/prod/.env.production up -d --no-deps server
```

**Хранение:** автоматическая чистка старше 7 дней:

```cron
0 4 * * * find /backups -name "balloo-backup-*.sql.gz" -mtime +7 -delete
```

### MinIO (S3)

MinIO данные в volume `prod_minio-data`. Ручной бэкап:

```bash
docker run --rm -v prod_minio-data:/data -v /backups:/backup alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz -C /data .
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

### Порт 3000 на хосте занят неизвестным процессом

Порт `*:3000` слушает неизвестный процесс на хосте. Порт приложения (`balloo-server`) опубликован на `127.0.0.1:3100`, поэтому конфликта нет. Для идентификации:

```bash
sudo lsof -i :3000
```

---

## 5. Структура сервера (сводка)

| Компонент | Путь / Порт |
|---|---|
| Git-репо | `/home/cfr_balloo/balloo` |
| Compose | `/home/cfr_balloo/balloo/docker/prod/docker-compose.local.yml` |
| Env | `/home/cfr_balloo/balloo/docker/prod/.env.production` |
| Nginx конфиг | `/etc/nginx/sites-enabled/balloo-docker.conf` |
| Бэкапы БД | `/backups` (volume, примонтирован в контейнер) |
| Сертификаты | `/etc/letsencrypt/live/` (certbot) |
| БД | volume `prod_postgres-data` |
| Медиа | volume `prod_minio-data` |
| Сессии | volume `prod_redis-data` |

---

## 6. Контакты и доступы

| Роль | Способ |
|---|---|
| SSH | `ssh cfr_balloo@188.76.243.185` (хост `aedgar`) |
| PostgreSQL | `docker exec -it balloo-postgres psql -U balloo -d balloo` |
| Redis | `docker exec -it balloo-redis redis-cli` |
| GitHub | `https://github.com/NBS-wt-Director/Messenger_Balloo` |

---

*Документ создан 2026-09-30. Обновлять при изменении инфраструктуры.*

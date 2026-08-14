# AI-Agent: DevOps & Infrastructure Specification

> Этот документ — спецификация для генерации Docker Compose, CI/CD и инфраструктуры.
> **Версия:** 1.1 | **Дата:** 2026-07-30

---

## 🏗️ Production Docker Compose

**Файл:** `docker/prod/docker-compose.yml`

### Сервисы

| Сервис | Образ | Порты | Реплики | Описание |
|--------|-------|-------|---------|----------|
| `postgres` | postgres:16-alpine | 5432 | 1 | Основная БД |
| `redis` | redis:7-alpine | 6379 | 1 | Кэш и сессии |
| `minio` | minio/minio:latest | 9000, 9001 | 1 | S3-совместимое хранилище |
| `server` | balloo-server | 3100 | 2 | Бэкенд (Express + WebSocket) |
| `web` | balloo-web | 8080 | 2 | Фронтенд (React + Vite) |
| `nginx` | nginx:1.25-alpine | 80, 443 | 1 | Фронтальный прокси + SSL |
| `prometheus` | prom/prometheus:latest | 9090 | 1 | Сбор метрик |
| `grafana` | grafana/grafana:latest | 3001 | 1 | Дашборды |
| `alertmanager` | prom/alertmanager:latest | 9093 | 1 | Алерты |

### Конфигурационные файлы

- `docker/prod/docker-compose.yml` — orchestration
- `docker/prod/nginx.conf` — SSL, rate limiting, reverse proxy
- `docker/prod/prometheus.yml` — scrape configs
- `docker/prod/alertmanager.yml` — routing и receivers
- `docker/prod/grafana/provisioning/datasources/` — datasource configs
- `docker/prod/grafana/provisioning/dashboards/` — dashboard configs

---

## 🐳 Local Development Docker Compose

**Файл:** `docker-compose.yml`

```yaml
# docker/docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: balloo
      POSTGRES_PASSWORD: balloo
      POSTGRES_DB: balloo
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U balloo"]

  minio:
    image: minio/minio:latest
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: balloo
      MINIO_ROOT_PASSWORD: balloo_secret
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  smtp:
    image: maildev/maildev
    ports: ["1025:1025", "1080:1080"]

  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports: ["3001:3000"]
    depends_on: [prometheus]

volumes:
  postgres_data:
  minio_data:
```

## MinIO — Структура бакетов

```
balloo-avatars/     ← аватарки пользователей и групп
balloo-chats/       ← медиа из чатов (фото, видео, голосовые, документы)
balloo-public/      ← публичные медиа (иллюстрации, иконки, стикеры)
balloo-backups/     ← бэкапы БД (хранение 3 дня)
```

## Docker Compose — сервисы и поддомены (v1)

### Сервисы в Docker Compose (на одном сервере)

| Сервис | Домен | Образ |
|--------|-------|-------|
| Web (Next.js) | balloo.su | balloo-web |
| Admin Panel | admin.balloo.su | balloo-web (тот же образ, другой маршрут) |
| Command Portal | command.balloo.su | balloo-web (тот же образ, другой маршрут) |
| Features Portal | features.balloo.su | balloo-web (тот же образ, другой маршрут) |
| History Portal | history.balloo.su | balloo-web (тот же образ, другой маршрут) |
| Download Portal | download.balloo.su | balloo-web (тот же образ, другой маршрут) |
| Blog Portal | blog.balloo.su | balloo-web (тот же образ, другой маршрут) |
| docs.balloo.su | docs.balloo.su | balloo-web (Swagger/OpenAPI) |

**WebSocket:** встроен в Next.js (native Node.js WebSocket), не отдельный сервис.

### Инфраструктура

| Сервис | Образ |
|--------|-------|
| PostgreSQL | postgres:16-alpine |
| MinIO | minio/minio |
| SMTP (Maildev) | maildev/maildev |
| Prometheus | prom/prometheus |
| Grafana | grafana/grafana |

### Ingress / Reverse Proxy (nginx)

```nginx
# Единый nginx reverse proxy с TLS (Let's Encrypt)
server {
    listen 443 ssl;
    server_name balloo.su admin.balloo.su command.balloo.su features.balloo.su
                history.balloo.su download.balloo.su blog.balloo.su docs.balloo.su;

    ssl_certificate /etc/letsencrypt/live/balloo.su/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/balloo.su/privkey.pem;

    location / {
        proxy_pass http://balloo-web:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## CI/CD (GitHub Actions)

### Пайплайн (Последовательный запуск)

```yaml
# .github/workflows/ci.yml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # 1. Установка зависимостей
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile

  # 2. Линтинг (последовательно по пакетам)
  lint:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - run: pnpm lint

  # 3. Проверка типов
  type-check:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - run: pnpm type-check

  # 4. Юнит-тесты (Jest + RTL)
  unit-tests:
    needs: type-check
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test

  # 5. E2E тесты (Playwright)
  e2e-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    steps:
      - run: pnpm e2e

  # 6. API тесты (Supertest)
  api-tests:
    needs: e2e-tests
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:api

  # 7. Тесты безопасности (OWASP ZAP)
  security-tests:
    needs: api-tests
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:security

  # 8. Тесты нагрузки (k6)
  load-tests:
    needs: security-tests
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:load

  # 9. Сборка Docker образов
  build-images:
    needs: load-tests
    runs-on: ubuntu-latest
    steps:
      - run: docker build -t balloo-web ./packages/web

  # 10. Деплой через Docker Compose
  deploy:
    needs: build-images
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/balloo
            docker compose pull
            docker compose up -d --force-recreate
```

## Git стратегия: GitHub Flow

```
main (production)
 ├── feature/auth-oauth-yandex
 ├── feature/messaging-websocket
 ├── fix/group-member-limit
 └── hotfix/critical-security-patch
```

- Прямой пуш в `main` запрещён.
- Каждый PR проходит CI (lint → type-check → tests → build).
- Ревью минимум 1 разработчик.
- После merge → автодеплой через Docker Compose.

## Алерты

| Канал | Кому | Когда |
|-------|------|-------|
| Telegram-бот | Всем админам сервиса | Падение сервера, критическая ошибка |
| Email | Всем админам сервиса | Падение БД, исчерпание места, сбой бэкапа |

## Бэкапы

| Что | Частота | Хранение | Где |
|-----|---------|----------|-----|
| PostgreSQL | Ежедневно | 3 дня | MinIO (`balloo-backups`) |

## Логи (Retention)

| Тип | Хранение |
|-----|----------|
| Общие логи | 30 дней (с ротацией) |
| Логи ошибок | 30 дней (с ротацией) |
| **Не логировать** содержимое сообщений |

## Сидирование (Seed data)

- Node.js скрипты (`packages/server/src/seed/`)
- Скрипт: `pnpm seed`
- Создаёт: тестовых пользователей, чаты, группы, сообщения

---

## 🆕 Service Status — мониторинг узлов (v1 — дополнение)

### Health-check воркеры (cron)
- Воркер на стороне сервера периодически (каждые 30–60 сек) опрашивает узлы экосистемы (`balloo`, `admin`, `command`, `features`, `history`, `download`, `docs`, `blog`).
- Для каждого узла записывается time-series снимок в `service_status_snapshots`: `status` (`up`/`degraded`/`down`), `latencyMs`, `checkedAt`.
- Cron: node-cron в `packages/server` (health-check воркер).
- Деградация определяется по порогам latency / HTTP-коду / таймауту.

### Real-time мониторинг (WebSocket `status.update`)
- Открытый WebSocket-канал `status.update` транслирует изменения статуса узлов всем подключённым клиентам (дашборд статуса в admin, баннер в приложении при `degraded`/`down`).
- Payload: `{nodeId, status, latencyMs}`.
- Дашборд в admin (`ServiceStatusDashboard`, экран `1_02_26`) подписан на канал и отображает текущий статус + историю (графики из `service_status_snapshots`).

### Инциденты (создание/закрытие через admin)
- Админ создаёт инцидент (`POST /admin/status/incidents`): `severity` (`minor`/`major`/`critical`), `affectedNodes`, `startsAt`, `createdByAdminId`.
- Жизненный цикл статуса: `investigating` → `identified` → `monitoring` → `resolved`.
- При `resolved` фиксируется `endsAt`; инцидент остаётся в истории.
- Критические инциденты (`critical`) могут автоматически создаваться воркером при падении узла (с последующим подтверждением админом).
- WebSocket `status.update` также рассылает обновления инцидентов подписчикам.

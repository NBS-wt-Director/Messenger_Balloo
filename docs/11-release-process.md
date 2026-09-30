# 🚀 Release Process — Balloo Messenger

> **Версия:** 1.0 | **Дата:** 2026-09-30
> Порядок релиза, отката и ведения changelog.

---

## 1. SemVer

Формат `MAJOR.MINOR.PATCH`:

| Часть | Когда | Пример |
|---|---|---|
| `MAJOR` | Несовместимые изменения API/БД | `1.0.0` → `2.0.0` |
| `MINOR` | Новая функциональность, обратно совместимая | `1.0.0` → `1.1.0` |
| `PATCH` | Исправления ошибок, обратно совместимые | `1.0.0` → `1.0.1` |

Версия хранится в `package.json` в корне репозитория.

---

## 2. Ветвление

**GitHub Flow** — одна долговременная ветка `main`:

```
main (production)
 ├── feature/auth-oauth-yandex
 ├── feature/messaging-websocket
 ├── fix/group-member-limit
 └── hotfix/critical-security-patch
```

- `main` — всегда деплоеспособна.
- `feature/*` — новые фичи.
- `fix/*` — исправления.
- `hotfix/*` — срочные исправления прода.

### Правила
- Прямой пуш в `main` запрещён (в CI: `if: github.ref == 'refs/heads/main'`).
- Каждый PR проходит CI (lint → type-check → tests → build).
- Мержится только после зелёного CI.

---

## 3. Процесс релиза

### Шаг 1 — Подготовка

1. Убедиться, что `main` в `origin/main` зелёная (CI passed).
2. Обновить `package.json` — версия.
3. Обновить `CHANGELOG.md` — раздел с новой версией.
4. Создать PR: `chore: release v1.0.0`.

### Шаг 2 — Сборка

CI собирает Docker-образы при пуше в `main`:

```bash
# Локально (для проверки):
cd packages/web && npx --yes vite build
cd packages/server && npx --yes tsc --noEmit
```

### Шаг 3 — Тег

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Шаг 4 — Деплой

**Деплой — батчи от владельца (см. AGENTS.md «Команда Деплой»).**

Базовая команда (на сервере):

```bash
cd /home/cfr_balloo/balloo
git fetch origin
git checkout -B main origin/main
git merge --ff-only origin/main

# Сборка образов (явные сервисы, НЕ голый up -d):
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production build web server

# Запуск (только web и server, БД не трогать):
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production up -d web server
```

**Порядок:** сначала API (`server`), затем `web` (CSP `connect-src` и CORS отдаёт API).

### Шаг 5 — Проверка

```bash
# Здоровье API:
curl -s https://api.balloo.su/health -w "\n%{http_code}"

# Здоровье web:
curl -sI https://balloo.su | head -5

# Веб-аудит (с рабочей машины):
node scripts/p37-prod-check.cjs
```

---

## 4. Откат

### Откат web (простой)

```bash
# На сервере:
cd /home/cfr_balloo/balloo
git checkout v1.0.0  # предыдущий стабильный тег
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production build web
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production up -d web
```

### Откат API (осторожно)

Откат API — **только вместе с web**, если менялись `COOKIE_DOMAIN` / `CORS_ORIGIN` (смена домена cookie ломает авторизацию у уже выданных сессий).

```bash
# На сервере:
cd /home/cfr_balloo/balloo
git checkout v1.0.0
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production build web server
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production up -d web server
```

### Откатная точка образа

Перед деплоем можно сохранить текущий образ:

```bash
docker tag balloo/web:latest balloo/web:rollback-$(date +%Y%m%d)
docker tag balloo/server:latest balloo/server:rollback-$(date +%Y%m%d)
```

---

## 5. CHANGELOG.md

Формат: [Keep a Changelog](https://keepachangelog.com/), версия — в начале файла.

```markdown
## [1.0.0] — 2026-09-30

### Added
- Новая фича X (#123)
- API endpoint `/api/foo` (#124)

### Changed
- Обновлена зависимость Y до v2 (#125)

### Fixed
- Исправлен баг Z (#126)

### Removed
- Удалён устаревший модуль W (#127)
```

---

## 6. CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

При пуше в `main`:
1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm type-check`
4. `pnpm test:all`
5. `pnpm build`

При теге `v*`:
- Сборка Docker-образов
- Публикация в registry (опционально)

### GitHub Pages (`.github/workflows/pages.yml`)

Автопубликация статических сайтов `mockups/` на GitHub Pages.

---

## 7. Стратегия миграций БД

**Аддитивная дисциплина** (см. `docs/03-database-schema.md` «Дисциплина миграций»):

- Только `CREATE TABLE`, `ALTER TABLE ADD COLUMN` (nullable/default), новые enum-значения.
- **Запрещены:** `DROP TABLE`, `DROP COLUMN`, `RENAME`, смена типов.
- Перед миграцией: SQL читается глазами + свежий `pg_dump`.

---

## 8. Чек-лист релиза

- [ ] `package.json` — версия обновлена
- [ ] `CHANGELOG.md` — раздел добавлен
- [ ] CI зелёный
- [ ] `git tag v<версия>` запушен
- [ ] Батч деплоя выполнен (батч от владельца)
- [ ] `/health` API — 200
- [ ] `/health` web — 200
- [ ] `scripts/p37-prod-check.cjs` — аудит пройден
- [ ] Откатная точка образа сохранена

---

*Документ создан 2026-09-30.*

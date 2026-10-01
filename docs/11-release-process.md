# 🚀 Release Process — Balloo Messenger

> **Версия:** 1.1 | **Дата:** 2026-10-01 (актуализация: секции 2, 4, 6 сверены с
> фактическими `.github/workflows/{ci,cd}.yml` и `AGENTS.md`)
> Порядок релиза, отката и ведения changelog.

---

## 1. SemVer

Формат `MAJOR.MINOR.PATCH`:

| Часть | Когда | Пример |
|---|---|---|
| `MAJOR` | Несовместимые изменения API/БД | `1.0.0` → `2.0.0` |
| `MINOR` | Новая функциональность, обратно совместимая | `1.0.0` → `1.1.0` |
| `PATCH` | Исправления ошибок, обратно совместимые | `1.0.0` → `1.0.1` |

Версия хранится в `package.json` в корне репозитория (сейчас `1.0.0`).

---

## 2. Ветвление

**GitHub Flow** — одна долговременная ветка `main`:

```
main (production)
  ├── feature/<имя>
  ├── fix/<имя>
  └── hotfix/<имя>
```

- `main` — всегда деплоеспособна.
- CI (`ci.yml`) триггерится на push/PR в `main`, `dev`, `develop`.

⚠️ **Факт по практике этого репозитория:** коммиты идут в `main` напрямую
(`docs(tickets): …`, `feat(server): …` — история 140+ коммитов); правило
«прямой пуш в `main` запрещён, только через PR» в CI **не реализовано**
(branch-защиты не настроены) и в работе команды из двух человек не применяется.
PR-процесс — целевая модель на случай роста команды, не текущая практика.

---

## 3. Процесс релиза

### Шаг 1 — Подготовка

1. Убедиться, что `main` зелёная локально: `pnpm build` и `pnpm test` (код 0;
   `pnpm lint` проверкой не является — в server/web/ui/desktop это заглушки
   `echo "No linter configured yet"`).
2. Обновить `package.json` — версия.
3. Обновить `CHANGELOG.md` — раздел с новой версией.

### Шаг 2 — Сборка

CI на каждый push в `main` (`.github/workflows/ci.yml`, 22 шага):
Checkout → Setup pnpm → Setup Node 22 → Install (frozen-lockfile) → Prisma
generate → migrate deploy → seed → Build shared → TypeScript check (server,
web, desktop) → Lint (shared, server, web) → Test (shared, server, web) →
Build (shared, server, …).

Сборка образов по тегу: `.github/workflows/cd.yml` собирает и публикует
`balloo/server` и `balloo/web` в GitHub Container Registry (ghcr).

### Шаг 3 — Тег

⚠️ Решение владельца 29.09: тег `v1.0.0` ставится **перед деплоем**, по отдельной
команде (до этого тег не ставится).

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Шаг 4 — Деплой

**Деплой — батчи от владельца (см. AGENTS.md «Команда Деплой»), не через CI.**

Этапы: `git fetch origin` → `git checkout -B main origin/main` →
`git merge --ff-only` → тег откатной точки (`docker tag balloo/web:local
balloo/web:rollback-<дата>`) → `build web` → `up -d --no-deps --force-recreate web`
(`--force-recreate` обязателен: имя образа не меняется). Порядок: **сначала API
(`server`), затем `web`** (CSP `connect-src` и CORS отдаёт API).

Батчи C→G и стоп-условия — в `AGENTS.md` «Команда Деплой» §4; запрещённые
команды (down/network prune/systemctl restart) — §4 там же.

### Шаг 5 — Проверка

```bash
# Здоровье API (на проде /health закрыт auth_basic — 401 без учёток = норма):
curl -sI https://api.balloo.su/health | head -3

# Здоровье web:
curl -sI https://balloo.su | head -5

# Веб-аудит (с рабочей машины, живой браузер):
node scripts/p37-prod-check.cjs
```

Финальное подтверждение деплоя — вывод сервера (батч G: HEAD, imageid, маркер
нового кода, хэш бандля) **и** ручной чек-лист владельца (`AGENTS.md` §5.2).

---

## 4. Откат

### Откат web через откатной тег образа (основной способ)

```bash
# На сервере (до деплоя тег создаётся — этап E «Команды Деплой»):
docker tag balloo/web:rollback-20261001 balloo/web:local
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production up -d --no-deps --force-recreate web
```

### Откат кодом (если образа-тега нет)

```bash
cd /home/cfr_balloo/balloo
git fetch origin
git checkout <откатной-коммит>          # не переписывать origin/main!
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production build web
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production up -d --no-deps --force-recreate web
```

⚠️ Никогда не использовать `git reset --hard` / `git clean` / force-push:
сервер обновляется только `--ff-only`.

### Откат API (осторожно)

Откат API — **только вместе с web**, если менялись `COOKIE_DOMAIN` / `CORS_ORIGIN`
(смена домена cookie ломает авторизацию у уже выданных сессий). При откате API
сеть, тома, postgres, redis, minio и `.env` не трогать.

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

### GitHub Actions `.github/workflows/ci.yml` (факт)

Триггер: push/PR в `main`, `dev`, `develop`. Один job `test` (Node 22,
PostgreSQL/Redis-сервисы, timeout 30 мин), шаги:

1. Checkout, Setup pnpm, Setup Node (cache pnpm)
2. Install dependencies (`--frozen-lockfile`)
3. Prisma generate → migrate deploy → seed
4. Build shared (до typecheck — иначе TS2307)
5. TypeScript check ×3 (server, web, desktop)
6. Lint ×3 (shared, server, web)
7. Test shared / Test server / Test web
8. Build shared / Build server / Build web

### GitHub Actions `.github/workflows/cd.yml` (факт)

Триггер: тег `v*`. Сборка и публикация `balloo/server` и `balloo/web`
в ghcr (`docker/build-push-action`, Buildx). Деплой на сервер CD **не делает** —
выкатка всегда руками владельца батчами (§3 Шаг 4).

### GitHub Pages

`.github/workflows/pages.yml` не существует — автопубликации макетов нет.

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
- [ ] Локально: `pnpm build` exit 0, `pnpm test` зелёные (счётчики записаны)
- [ ] `git tag v<версия>` запушен (по решению владельца)
- [ ] Этап A «Деплоя»: незакоммиченных трекаемых файлов нет (`git status --porcelain`)
- [ ] Батчи C→G выполнены, вывод сервера соответствует ожиданиям (`AGENTS.md` §4)
- [ ] Батч G: HEAD = хэш пуша, маркер нового кода ≥1, хэш бандля изменился
- [ ] Ручной чек-лист владельца пройден (`AGENTS.md` §5.2)
- [ ] Откатная точка образа `balloo/web:rollback-<дата>` существует
- [ ] Тикет деплоя в `tickets/Done/<дата>/` содержит 8 обязательных артефактов

---

*Документ создан 2026-09-30, актуализирован 2026-10-01.*

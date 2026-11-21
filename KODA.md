# KODA.md — инструкционный контекст проекта Balloo

> Файл-справка для AI-ассистента (Koda). Содержит проверенные факты о структуре,
> сборке, запуске и правилах работы в этом монорепо. Дополняет `AGENTS.md`
> (там — ролевые и процессные правила) и `CONTRIBUTING.md`.
>
> Обновлено: 20.11.2026.

---

## 1. Обзор проекта

**Balloo Messenger** — российский мессенджер: чаты, каналы, истории, опросы,
корпоративный блог, админ-панель и портал сотрудников в одном монорепо.

| Параметр | Значение |
|---|---|
| Название пакета | `balloo-messenger` |
| Версия | `0.0.5` (pre-release) |
| Лицензия | MIT |
| Тип | Монорепо (pnpm workspaces) |
| Прод | `https://balloo.su` (API — `https://api.balloo.su`) |
| Менеджер пакетов | pnpm `11.17.0` (corepack), поле `packageManager` |
| Node.js | `>=20` (на прод-сервере 22.23.1; docker-образ пинит `node:22.19-slim`) |

---

## 2. Стек технологий

| Слой | Технологии |
|---|---|
| База данных | PostgreSQL 16, Redis 7 |
| ORM | Prisma (схема и миграции в `packages/shared/prisma`) |
| Бэкенд | Express.js, TypeScript, WebSocket (`ws`) |
| Фронтенд | React 18, Vite, TypeScript, Zustand, React Router v6 (hash-роутер) |
| Мобильное | Expo, React Native, TypeScript |
| Десктоп | Electron, Vite, TypeScript |
| Доставка | Nginx (reverse proxy), CDN — MinIO (self-hosted S3) |
| Мониторинг | Prometheus + Grafana (docker-профиль monitoring) |
| Тесты | vitest (shared, web), jest (server), Cypress (e2e) |

---

## 3. Структура монорепо

```
balloo/
├── AGENTS.md              ← постоянная инструкция AI-ассистента (роль, правила, деплой)
├── KODA.md                ← этот файл (справка по проекту)
├── CONTRIBUTING.md        ← правила вклада, стиль коммитов, «что такое проверка»
├── README.md              ← общее описание, быстрый старт, домены, статус
├── package.json           ← корневые скрипты (pnpm -r)
├── pnpm-workspace.yaml    ← workspaces = packages/*, allowBuilds
│
├── mockups/               ← ИСТОЧНИК ПРАВДЫ по макетам (index.html, index_ecrans.*)
├── docs/                  ← документация «под капотом» (пронумерованные файлы)
├── tickets/               ← active/ , Done/ , archive/ , deferred/
│   └── active/with_lord/  ← блокирующие задачи владельца (сервер, ключи, приёмка)
├── docker/
│   ├── Dockerfile.server  ← образ бэкенда
│   ├── Dockerfile.web     ← builder + стадии web/features/web_admin/web_history/web_download
│   ├── nginx.conf         ← конфиг nginx внутри web-образов
│   ├── entrypoint.server.sh
│   └── prod/              ← прод-конфиги (compose, .env.production, nginx, certbot)
├── packages/              ← код приложения
│   ├── shared/            ← типы, утилиты, i18n, Prisma schema + migrations + seed
│   ├── ui/                ← общий UI-пакет (эко-меню, chrome.css)
│   ├── server/            ← Express API + WebSocket
│   ├── web/               ← React + Vite (основной клиент)
│   ├── web-admin/         ← админ-панель (отдельный vite-билд)
│   ├── web-features/      ← витрина фич (features.balloo.su)
│   ├── web-history/       ← история версий (history.balloo.su)
│   ├── web-download/      ← страница загрузок (download.balloo.su)
│   ├── desktop/           ← Electron (main + React renderer)
│   ├── mobile-android/    ← Expo + React Native (Android)
│   ├── mobile-ios/        ← Expo-конфиг (вне MVP1)
│   └── downloads/         ← артефакты сборок для скачивания
├── scripts/               ← вспомогательные скрипты (прод-проверки, факты)
└── deploy/                ← скрипты деплоя
```

---

## 4. Сборка, запуск, тестирование

### Установка

```bash
pnpm install
```

### Разработка

```bash
pnpm dev              # все dev-серверы параллельно
pnpm dev:server       # server → http://localhost:3100
pnpm dev:web          # web → http://localhost:5173 (прокси /api, /ws → 3100)
pnpm dev:desktop      # Electron
pnpm dev:mobile-android
```

### Сборка

```bash
pnpm build            # последовательно все пакеты (включает tsc-проверку типов)
pnpm build:server     # только сервер
pnpm build:web        # только web (tsc && vite build)
pnpm build:shared
```

### Тесты

```bash
pnpm test             # все тесты монорепо (последовательно!)
pnpm test:server      # jest
pnpm test:web         # vitest
pnpm test:shared      # vitest
pnpm test:e2e         # cypress (web)
```

> ⚠️ **`pnpm test` и пакетные прогоны запускать только последовательно.** Параллельные
> процессы делят одну тестовую БД `balloo` и лимит Postgres `max_connections=100` →
> падение ws-тестов с `● Timeout`, хотя поодиночке они зелёные.

### Проверка типов

Отдельного скрипта `typecheck` в репозитории **нет** (`pnpm typecheck` → script not found).
Типы проверяются внутри `build` (`tsc` без `--noEmit`) либо явно:

```bash
pnpm --filter @balloo/web exec tsc --noEmit
pnpm --filter @balloo/server exec tsc --noEmit
pnpm --filter @balloo/shared exec tsc --noEmit
```

### Работа с БД (Prisma)

```bash
pnpm db:generate      # prisma generate
pnpm db:migrate       # prisma migrate deploy
pnpm db:seed          # prisma db seed
pnpm db:push          # prisma db push
pnpm db:studio        # prisma studio
```

> Миграции лежат в **`packages/shared/prisma/migrations`** (не в `packages/server/prisma`).

### Линтинг

```bash
pnpm lint
```

> ⚠️ **`pnpm lint` НЕ является проверкой.** В `shared` скрипта нет; в
> `server`/`web`/`ui`/`desktop` это `echo "No linter configured yet"`. Зелёный
> `pnpm lint` ничего не доказывает. Настоящая проверка = `tsc --noEmit` + тесты + `vite build`.

### Docker (локально)

```bash
pnpm docker:up        # docker compose up -d
pnpm docker:down
pnpm docker:build
pnpm docker:logs
```

---

## 5. Правила разработки

- **Язык:** рассуждения и тикеты — русский; комментарии в коде — английский
  (если в файле нет русских комментариев).
- **Стиль коммитов:** `type(scope): описание`, где `type` ∈
  `feat | fix | docs | test | chore | refactor | perf`.
- **«Проверено» = команда запущена и вывод приложен.** Четыре уровня проверки:
  синтаксис (`tsc --noEmit` exit 0) → логика (тесты 0 failed) → сборка
  (`vite build` exit 0) → продукт (живой браузер/скриншот/прод-проверка).
- **Запрет на выдумки в отчётах:** нельзя объявлять выполненным непроверенное;
  любое утверждение о результате сопровождается доказательством (вывод команды,
  артефакт, diff). Нет доказательства — нет утверждения.
- **Тикеты обязательны:** задача разбивается на мелкие шаги, каждый пишется в
  `tickets/active/<unix>.md` **до** первой правки; выполненные шаги помечаются
  `[x]`/`[~]`/`[!]` по ходу; закрытый тикет переносится в `tickets/Done/<дата>/`.
- **Порядок проектирования:** функция → узел → пользовательская ситуация → экраны →
  эндпоинты+компоненты → сущности данных. Никогда не начинать с данных/эндпоинтов.
- **Макеты (`mockups/`) — единственный источник правды.** Документация и код —
  производные от макетов.
- **Границы воркспейса:** все операции только внутри корня проекта; без явной
  команды ничего не трогать вне него.
- **Git:** коммиты делаются свободно (отдельный коммит на завершённый тикет);
  `git commit`/`push`/`reset`/`rebase` — только по явной команде владельца в
  рамках команды «Деплой».

---

## 6. Деплой (кратко)

Деплой — **только батчами, команды выполняет владелец** (у ассистента SSH-доступа нет).

**Параметры прода:**

| Предмет | Значение |
|---|---|
| Хост / пользователь | `aedgar` / `cfr_balloo` |
| Публичный IP | `188.73.176.34` |
| Репозиторий на сервере | `/data/balloo/repo` |
| Compose | `cd /data/balloo/repo/docker/prod` → `docker compose -f docker-compose.local.yml --env-file .env.production` |
| Дампы БД | `/data/balloo/backups` (symlink `LATEST.sql`) |
| Порты | web `127.0.0.1:8090`, server `127.0.0.1:3100` |
| Nginx на хосте | `/etc/nginx/sites-enabled/balloo-docker.conf` |

**Порядок (батчи):** C (read-only факты) → D (`git checkout -B main origin/main`)
→ E (откатные теги + бэкап БД) → F (сборка + `up -d --no-deps --force-recreate`)
→ G (доказательства) → H (браузерная приёмка владельца).

**Запрещено:** `docker compose down`/`rm`/`network prune`; `up -d --build` на весь
стек; `systemctl restart docker`; `git clean -fd`/`reset --hard`; `docker builder
prune -a`; миграции/`prisma db push` «на всякий случай».

**Подтверждение деплоя = вывод сервера (батч G) + ручная приёмка владельца.**
Без обоих — статус «не подтверждено».

---

## 7. Прод-домены

| Домен | Назначение |
|---|---|
| `balloo.su` | SPA-фронт (роутер hash: `https://balloo.su/#/…`) |
| `api.balloo.su` | API (REST + WebSocket `wss://api.balloo.su/ws/`) |
| `admin.balloo.su` | Админ-панель |
| `command.balloo.su` | Портал сотрудников |
| `features.balloo.su` | Витрина фич-реквестов |
| `history.balloo.su` | История версий |
| `download.balloo.su` | Страница загрузок |
| `docs.balloo.su` | API-документация |
| `blog.balloo.su` | Корпоративный блог |

Порядок деплоя: **сначала API, затем web**.

---

## 8. Конфигурация и секреты

| Файл | Что содержит | В git? |
|---|---|---|
| `docker/prod/.env.production` | переменные продакшена (домены, `DATABASE_URL`, `REDIS_URL`, SMTP, OAuth, `VAPID_*`, ключи) | ❌ (секретный, на сервере) |
| `.env.production.example` | список ключей с пустыми значениями и комментариями «где взять» | ✅ |
| `.env.example` | пример ENV для разработки | ✅ |

Секреты генерируются на сервере, не хранятся в репозитории и не передаются в чат.

---

## 9. Полезные факты

- Точка входа API — `packages/server/src`; WS-сервер на `/ws/`.
- Entrypoint `server`-контейнера применяет `prisma migrate deploy` при старте
  (`RUN_MIGRATIONS`, дефолт = 1) и идемпотентный seed.
- `docker/nginx.conf` копируется в каждый web-образ; на проде TLS терминирует
  хостовый `balloo-docker.conf`.
- Хешированные ассеты отдаются с `immutable`, `index.html`/`sw.js` — no-cache
  (после фикса `791f283`).
- Локальная сборка/тесты ≠ прод: состояние прода доказывается только обращением
  к проду (read-only `curl`, `scripts/p37-prod-check.cjs`) или выводом сервера.

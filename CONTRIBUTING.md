# 🤝 Contributing to Balloo Messenger

> Правила участия в разработке. Прочитать перед отправкой PR.

---

## 📋 Стек

| Слой | Технологии |
|---|---|
| **Бэкенд** | Express.js, TypeScript, WebSocket (ws), Prisma |
| **Фронтенд** | React 18, Vite, TypeScript, Zustand, React Router v6 |
| **БД** | PostgreSQL 16, Redis 7 |
| **Инфраструктура** | Docker, Nginx, Prometheus, Grafana |
| **Пакетный менеджер** | pnpm 10.12.4 (corepack) |
| **Node.js** | 20+ (на сервере 22.23.1) |

---

## 🏗 Монорепо

```
balloo/
├── packages/
│   ├── shared/     ← общие типы, утилиты, Prisma, i18n
│   ├── server/     ← Express API + WebSocket
│   ├── web/        ← React + Vite (веб-клиент)
│   ├── desktop/    ← Electron
│   ├── mobile-android/
│   └── mobile-ios/
├── docker/prod/    ← прод-контейнеры, nginx, compose
├── docs/           ← документация (пронумерована)
├── mockups/        ← ИСТОЧНИК ПРАВДЫ по макетам
├── tickets/        ← тикеты/задачи
└── scripts/        ← вспомогательные скрипты
```

---

## ⚙️ pnpm-команды

```bash
pnpm install              # установка зависимостей
pnpm dev                  # все dev-серверы одновременно
pnpm dev:server           # только сервер (http://localhost:3100)
pnpm dev:web              # только web (http://localhost:5173, прокси /api → 3100)
pnpm build                # сборка всех пакетов
pnpm build:server         # сборка сервера
pnpm build:web            # сборка web
pnpm test:all             # все тесты
```

### Проверка типов

```bash
# Web:
pnpm --filter @balloo/web exec tsc --noEmit

# Server:
pnpm --filter @balloo/server exec tsc --noEmit

# Shared:
pnpm --filter @balloo/shared exec tsc --noEmit
```

### Тесты

```bash
# Все тесты:
pnpm test:all

# Только web (vitest):
pnpm --filter @balloo/web exec vitest run

# Только server (jest):
pnpm --filter @balloo/server exec jest
```

### Линтинг

```bash
pnpm lint
```

> ⚠️ **`pnpm lint` НЕ является проверкой.** В этом репо `pnpm lint` не конфигурирован корректно — он может проходить при сломанном коде. **Настоящая проверка:** `tsc --noEmit` (типы) + `vitest run` (тесты) + `vite build` (сборка).

---

## 📝 Правила тикетов

### Формат имени файла
`tickets/active/<unix-время>-<NN>.md`

Где `<NN>` — порядковый номер подзадачи (двухзначный).

### Обязательные разделы
```markdown
# Тикет <id>-<NN> — <Заголовок>
**Создан:** <дата> (unix <число>)
**Статус:** <готов к работе | в работе | готов к приёмке | ЗАКРЫТ>
**Цель:** <1–2 предложения>

## Что нужно сделать
## Подзадачи
- [ ] 1. ...
## Критерии готовности
## Проблемы и решения
## Результат
```

### Статусы
- `готов к работе` — можно начинать
- `в работе` — выполняется
- `готов к приёмке` — сделано, ждёт владельца
- `ЗАКРЫТ` — владелец подтвердил

---

## ✅ Что такое «проверка»

В этом проекте **«проверено» означает — команда запущена, вывод приложен**.

| Уровень | Что это | Как выглядит доказательство |
|---|---|---|
| **Синтаксис** | Код собирается | `tsc --noEmit` exit 0 |
| **Логика** | Тесты проходят | `vitest run` / `jest` — 0 failed |
| **Сборка** | Бандль собирается | `vite build` exit 0 |
| **Продукт** | Работает в браузере | Скриншот или вывод `scripts/p37-prod-check.cjs` |

**`pnpm lint` не относится ни к одному уровню.**

---

## 💬 Стиль коммитов

Формат: `type(scope): описание`

```
feat(server): add OAuth Yandex callback
fix(web): fix dark theme contrast on /privacy
docs: update 06-devops-infrastructure.md
chore: bump version to 1.1.0
test(server): add unit tests for auth middleware
```

### Типы
| Тип | Когда |
|---|---|
| `feat` | новая функциональность |
| `fix` | исправление ошибки |
| `docs` | документация |
| `test` | тесты |
| `chore` | сборка, зависимости, версия |
| `refactor` | рефакторинг без изменения поведения |
| `perf` | оптимизация |

---

## 🌐 Продакшен-домены

| Домен | Назначение |
|---|---|
| `balloo.su` | SPA-фронт |
| `api.balloo.su` | API (REST + WebSocket) |
| `admin.balloo.su` | Админ-панель |
| `command.balloo.su` | Портал сотрудников |

Порядок деплоя: **сначала API, затем web** (CSP `connect-src` и CORS отдаёт API).

---

## 🔑 Правила деплоя

**Деплой — только батчами от владельца.** Команды деплоя — в `AGENTS.md` «Команда Деплой».

Кратко:
```bash
# На сервере:
cd /home/cfr_balloo/balloo
git fetch origin
git checkout -B main origin/main
git merge --ff-only origin/main
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production build web server
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production up -d web server
```

**НЕЛЬЗЯ:** `docker compose down`, `docker network prune`, `systemctl restart balloo` (не деплой).

---

*Документ создан 2026-09-30.*

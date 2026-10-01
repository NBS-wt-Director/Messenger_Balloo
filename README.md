# 🎈 Balloo Messenger

**Российский мессенджер нового поколения** — чаты, каналы, истории, блог, админ-панель и портал сотрудников в одном монорепо.

**Версия:** 1.0.0
**Статус:** 🟢 Production-ready (deployed to balloo.su)
**Лицензия:** MIT

---

## 📋 Описание

Balloo — это полнофункциональный мессенджер с поддержкой:

- 💬 **Личные и групповые чаты** с реальным временем (WebSocket)
- 📢 **Каналы** с подписчиками и админами
- 📸 **Истории** с просмотрами и реакциями
- 📊 **Опросы** (5 типов: опрос, квиз, активный/пассивный список, персоналия)
- 📝 **Корпоративный блог** с каналами и категориями
- 🛡️ **Админ-панель** с аналитикой, банами, модерацией
- 🏢 **Портал сотрудников** (HR, вакансии, база знаний, задачи)
- 💡 **Фич-реквесты** с голосованием и комментариями
- 📜 **История версий** с changelog
- ⬇️ **Страница загрузок** для всех платформ
- 🎧 **Экран техподдержки** (`/support`, чат с админами)

### Ключевые особенности

- **20 языков**: русский + 14 языков народов РФ + китайский, хинди, белорусский, английский, французский
- **3 темы**: dark (по умолчанию), light, russian (флаг РФ + драгметаллы)
- **Multi-platform**: Web, Desktop (Electron), Mobile (React Native + Expo)
- **Безопасность**: 2FA (TOTP), OAuth (Yandex, VK, Mail.ru), JWT (access 15 мин / refresh 30 дней)
- **Платежи**: донаты через ЮKassa (сейчас в режиме anonymous — ЮKassa-ключи не введены, решение №4)
- **CDN**: MinIO (self-hosted, S3)
- **Push**: Self-hosted Web Push (VAPID)
- **Мониторинг**: Prometheus + Grafana (в docker-стеке, профиль monitoring)

---

## 🛠 Стек технологий

| Слой | Технологии |
|---|---|
| **База данных** | PostgreSQL 16, Redis 7 |
| **ORM** | Prisma |
| **Бэкенд** | Express.js, TypeScript, WebSocket (ws) |
| **Фронтенд** | React 18, Vite, TypeScript, Zustand, React Router v6 |
| **Мобильное** | Expo, React Native, TypeScript |
| **Десктоп** | Electron, Vite, TypeScript |
| **Доставка** | Nginx (reverse proxy) |
| **CDN** | MinIO (self-hosted, S3) |

---

## 📁 Структура монорепо

```
balloo/
├── README.md                    ← Этот файл
├── AGENTS.md                    ← Инструкция для AI-ассистента
├── package.json                 ← Корневой package.json (pnpm workspaces)
├── pnpm-workspace.yaml          ← Конфиг pnpm workspaces
├── .env.example                 ← Пример ENV-переменных
├── .gitignore
│
├── mockups/                     ← ИСТОЧНИК ПРАВДЫ (макеты экранов)
│   ├── index.html               ← Интерактивный каталог макетов
│   ├── index_ecrans.json        ← Метаданные (JSON)
│   ├── index_ecrans.md          ← Метаданные (Markdown)
│   ├── assets/                  ← CSS/JS дизайн-системы
│   ├── shared/                  ← Общие экраны (ошибки, офлайн)
│   ├── balloo-su/               ← 41 экран (мессенджер)
│   ├── admin-balloo-su/         ← 25 экранов (админ-панель)
│   ├── command-balloo-su/       ← 26 экранов (портал сотрудников)
│   ├── features-balloo-su/      ← 5 экранов (фич-реквесты)
│   ├── history-balloo-su/       ← 3 экрана (changelog)
│   ├── download-balloo-su/      ← 2 экрана (загрузки)
│   ├── docs-balloo-su/          ← 1 экран (API docs)
│   ├── blog-balloo-su/          ← 6 экранов (корпоративный блог)
│   ├── mobile/                  ← 23 экрана (мобильные макеты)
│   ├── desktop/                 ← 23 экрана (desktop обёртки)
│   ├── specifity-balloo-su/     ← 7 экранов (спецификация)
│   ├── data_schema.json         ← Схема данных (81 таблица)
│   └── pre_filled_data.json     ← Seed-данные
│
├── packages/                    ← Код приложения
│   ├── shared/                  ← Общие типы, утилиты, Prisma, i18n
│   │   ├── src/types/           ← TypeScript типы
│   │   ├── src/utils/           ← Утилиты
│   │   ├── src/constants/       ← Константы
│   │   ├── src/i18n/            ← Переводы
│   │   └── prisma/              ← Prisma schema + seed
│   ├── server/                  ← Express API + WebSocket
│   │   └── src/                 ← Контроллеры, сервисы, маршруты
│   ├── web/                     ← React + Vite (web-клиент)
│   │   └── src/                 ← Компоненты, экраны, сторы
│   ├── desktop/                 ← Electron-приложение
│   │   └── src/                 ← Main process + React renderer
│   ├── mobile-android/          ← Expo + React Native (Android)
│   │   └── src/                 ← Экраны, компоненты
│   └── mobile-ios/              ← Expo + React Native (iOS)
│       └── src/                 ← Экраны, компоненты
│
├── docs/                        ← Документация проекта
│   ├── 00-master-build-guide.md       ← Гайд по сборке
│   ├── 01-architecture-decisions.md   ← Архитектурные решения
│   ├── 02-requirements-checklist.md   ← Чеклист требований
│   ├── 03-database-schema.md          ← Prisma схема БД
│   ├── 04-api-websocket-spec.md       ← REST API + WebSocket
│   ├── 05-frontend-spec.md            ← Фронтенд спецификация
│   ├── 06-devops-infrastructure.md    ← DevOps инфраструктура
│   ├── 10-operations-manual.md        ← Operations Manual
│   ├── 11-release-process.md          ← Процесс релиза
│   ├── 12-frontend-architecture.md    ← Frontend архитектура
│   ├── 13-backend-architecture.md     ← Backend архитектура
│   ├── 14-business-processes.md       ← Бизнес-процессы
│   └── 12-security-audit.md           ← Аудит безопасности
├── CONTRIBUTING.md              ← Правила вклада в проект
├── tickets/                   ← Мультитикеты (план реализации)
│   ├── active/                ← Активные задачи
│   ├── Done/                  ← Закрытые задачи
│   ├── archive/               ← Архив
│   └── deferred/              ← Отложенные
├── .old/docs/                 ← Архив промежуточных документов
│   ├── analysis/
│   ├── drafts/
│   └── archive-index.md
│
└── docker/                    ← Docker-контейнеры
    ├── docker-compose.yml
    ├── Dockerfile.server
    ├── Dockerfile.web
    └── nginx.conf
```

---

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 20+
- pnpm 8+
- PostgreSQL 16
- Redis 7
- Docker (опционально, для инфраструктуры)

### Установка

```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd balloo

# 2. Установить pnpm
npm install -g pnpm

# 3. Установить зависимости
pnpm install

# 4. Настроить окружение
cp .env.example .env
# Отредактировать .env (базовая конфигурация)

# 5. Настроить базу данных (через install-страницу или вручную)
# a) Автоматически: открыть admin.balloo.su/install и пройти мастер настройки
# b) Вручную (dev):
cd packages/shared
npx prisma migrate deploy   # применяет существующие миграции (на непустой БД:
                            # сначала `prisma migrate resolve --applied <id>` для базирования)
npx prisma db seed
cd ../../

# c) Вручную (production):
cd packages/shared
npx prisma migrate deploy
npx prisma db seed
cd ../../
```

### Запуск в режиме разработки

```bash
# Запустить ВСЕ сервисы одновременно:
pnpm dev

# Или каждый отдельно:
pnpm dev:server     # Server: http://localhost:3100
pnpm dev:web        # Web:    http://localhost:5173 (прокси /api и /ws → 3100)
pnpm dev:desktop    # Desktop: Electron app

# Если порт 3100 занят (например, поднят локальный docker-стек balloo-server):
SERVER_PORT=3200 pnpm dev:server   # сервер на 3200; vite-прокси остаётся на 3100 —
                                   # тогда API-запросы web будут идти в контейнер.
                                   # Для полной пары на 3200 правьте vite.config.ts.
```

### Сборка

```bash
# Собрать всё:
pnpm build

# Собрать отдельные пакеты:
pnpm build:server
pnpm build:web
pnpm build:desktop
```

### Тестирование

```bash
pnpm test:all
```

---

## 📦 Скрипты монорепо

| Команда | Описание |
|---|---|
| `pnpm dev` | Запуск всех dev-серверов (server + web) |
| `pnpm dev:server` | Запуск сервера Express |
| `pnpm dev:web` | Запуск Vite dev-сервера |
| `pnpm build` | Сборка всех пакетов |
| `pnpm build:server` | Сборка сервера |
| `pnpm build:web` | Сборка web-клиента |
| `pnpm test:all` | Запуск всех тестов |
| `pnpm lint` | Линтинг всего проекта |
| `pnpm docker:up` | Запуск Docker-инфраструктуры |
| `pnpm docker:down` | Остановка Docker-инфраструктуры |

---

## 🌐 Продакшен-домены (мультитикета)

Продакшен использует схему поддоменов: API живёт только на `api.balloo.su`,
веб-клиент обращается к нему по абсолютному URL (`VITE_API_URL`), WebSocket —
`wss://api.balloo.su/ws/`.

| Переменная | Значение (факт `docker/prod/.env.production`) | Где задаётся |
|---|---|---|
| `VITE_API_URL` | `https://api.balloo.su` | build-arg web-образа (запекается в бандль) |
| `CORS_ORIGIN` | `https://balloo.su,https://admin.balloo.su,https://command.balloo.su,https://features.balloo.su,https://blog.balloo.su,https://history.balloo.su,https://download.balloo.su,https://docs.balloo.su` | env server-контейнера (список через запятую, 8 origin) |
| `APP_URL` | `https://balloo.su` (один URL, не список — возврат OAuth, ссылки писем, возврат платежей) | env server-контейнера |
| Cookie | host-only на `api.balloo.su` (`setAuthCookies`, `middleware/auth.ts:176`: access SameSite=Strict 15 мин, refresh SameSite=Lax 30 дней; `domain` не задаётся) | код |

⚠️ Cookie сейчас **host-only** (без `domain=.balloo.su`) — сессия не переносится
между поддоменами автоматически; перенос входа между поддоменами — задача
пакетов поддоменов (`1790480787-04…-06`).

Порядок деплоя: **сначала API, затем web** (CSP `connect-src` и CORS отдаёт API; новый web-бандль
ожидает, что API уже принимает кросс-origin-запросы).

Откат web — предыдущим тегом образа (`balloo/web:rollback-<дата>`). Откат API — только вместе с web, если менялись
cookie-параметры/`CORS_ORIGIN` (смена домена cookie ломает авторизацию у уже выданных сессий).

---

## 📚 Документация

- **Сборка и запуск**: [docs/00-master-build-guide.md](docs/00-master-build-guide.md)
- **Архитектурные решения**: [docs/01-architecture-decisions.md](docs/01-architecture-decisions.md)
- **Чеклист требований**: [docs/02-requirements-checklist.md](docs/02-requirements-checklist.md)
- **Схема БД**: [docs/03-database-schema.md](docs/03-database-schema.md)
- **REST API + WebSocket**: [docs/04-api-websocket-spec.md](docs/04-api-websocket-spec.md)
- **Фронтенд-спецификация**: [docs/05-frontend-spec.md](docs/05-frontend-spec.md)
- **DevOps и инфраструктура**: [docs/06-devops-infrastructure.md](docs/06-devops-infrastructure.md)
- **Operations Manual**: [docs/10-operations-manual.md](docs/10-operations-manual.md)
- **Процесс релиза**: [docs/11-release-process.md](docs/11-release-process.md)
- **Frontend Architecture**: [docs/12-frontend-architecture.md](docs/12-frontend-architecture.md)
- **Backend Architecture**: [docs/13-backend-architecture.md](docs/13-backend-architecture.md)
- **Бизнес-процессы**: [docs/14-business-processes.md](docs/14-business-processes.md)
- **Аудит безопасности**: [docs/12-security-audit.md](docs/12-security-audit.md)
- **CONTRIBUTING**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Каталог тикетов**: [tickets/catalog.md](tickets/catalog.md)
- **Макеты**: [mockups/index.html](mockups/index.html)

### Архив

- [`.old/docs/archive-index.md`](.old/docs/archive-index.md) — указатель архива

---

## 📊 Статус проекта

| Компонент | Статус | Примечание |
|---|---|---|
| Макеты (все узлы) | ⚠️ Спроектировано | 172 экрана в реестре (12 узлов); приёмка владельцем — 79 в статусе «Просмотрен» (В-1…В-76) |
| Документация | ✅ Задокументировано | 14 файлов docs/ + CONTRIBUTING.md |
| Shared-пакет | ✅ Реализовано | Типы, утилиты, Prisma, i18n |
| База данных (Prisma) | ✅ Схема готова | 1059 строк schema.prisma, 3 миграции |
| Server (API + WebSocket) | ✅ Реализовано | Express, 205 маршрутов, WS `/ws/` |
| Web (React + Vite) | ✅ Реализовано | 119 экранов, hash-роутер |
| Desktop (Electron) | ✅ Каркас | Обёртка над web, работает |
| Mobile (Expo) | ⚠️ Частично | Android ~30%, iOS не начат |
| Docker | ✅ Реализовано | docker-compose (prod: 5 сервисов + мониторинг), прод-образы |
| CI/CD | ⚠️ Частично | GitHub Actions: локальная репродукция 21/21 наборов зелёная; CI-прогон падает на Test server — нужен лог владельца (`1790479490-07`) |
| Тесты | ✅ 607 зелёных | shared 76, server 347, web 204 |
| **Деплой** | **🟢 balloo.su** | **Прод работает (P37-1 принят выводом сервера 25.09); P38+/support — ждёт команды «Деплой» (В-105)** |

---

## 📄 Лицензия

MIT © 2026 Balloo

---

## 📞 Контакты

- **Email**: o8eryuhtin@yandex.ru
- **Документация**: [docs.balloo.su](https://docs.balloo.su)
- **Сообщество**: [t.me/kodacommunity](https://t.me/kodacommunity)

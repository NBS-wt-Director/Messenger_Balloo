# 🎈 Balloo Messenger

**Российский мессенджер нового поколения** — чаты, звонки, каналы, истории, блог, админ-панель и портал сотрудников в одном монорепо.

**Версия:** 1.0.0  
**Статус:** 🟡 Staging-ready (server + web)  
**Лицензия:** MIT

---

## 📋 Описание

Balloo — это полнофункциональный мессенджер с поддержкой:

- 💬 **Личные и групповые чаты** с реальным временем (WebSocket)
- 📞 **Голосовые и видеозвонки** (WebRTC)
- 📢 **Каналы** с подписчиками и админами
- 📸 **Истории** с просмотрами и реакциями
- 📊 **Опросы** (5 типов: опрос, квиз, активный/пассивный список, персоналия)
- 📝 **Корпоративный блог** с каналами и категориями
- 🛡️ **Админ-панель** с аналитикой, банами, модерацией
- 🏢 **Портал сотрудников** (HR, вакансии, база знаний, задачи)
- 💡 **Фич-реквесты** с голосованием пользователей
- 📜 **История версий** с changelog
- ⬇️ **Страница загрузок** для всех платформ

### Ключевые особенности

- **20 языков**: русский + 14 языков народов РФ + китайский, хинди, белорусский, английский, французский
- **3 темы**: dark (по умолчанию), light, russian (флаг РФ + драгметаллы)
- **Multi-platform**: Web, Desktop (Electron), Mobile (React Native + Expo), Android, iOS
- **Безопасность**: 2FA (TOTP), OAuth (Yandex, VK, Mail.ru), JWT tokens
- **Платежи**: ЮMoney (РФ)
- **CDN**: Yandex Object Storage / MinIO (self-hosted)
- **Push**: Self-hosted Web Push (VAPID)
- **Мониторинг**: Prometheus + Grafana (self-hosted)

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
| **CDN** | Yandex Object Storage / MinIO |

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
│   └── 06-devops-infrastructure.md    ← DevOps инфраструктура
│
├── tickets/                   ← Мультитикеты (план реализации)
│   └── balloo-implementation.md
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
npx prisma migrate dev    # создаст миграции если нет
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
pnpm dev:web        # Web:    http://localhost:5173
pnpm dev:desktop    # Desktop: Electron app
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

## 📚 Документация

- **Макеты экранов**: [mockups/index.html](mockups/index.html) — интерактивный каталог всех экранов
- **Метаданные макетов**: [mockups/index_ecrans.json](mockups/index_ecrans.json), [mockups/index_ecrans.md](mockups/index_ecrans.md)
- **Схема данных**: [mockups/data_schema.json](mockups/data_schema.json), [docs/03-database-schema.md](docs/03-database-schema.md)
- **API спецификация**: [docs/04-api-websocket-spec.md](docs/04-api-websocket-spec.md)
- **Архитектура**: [docs/01-architecture-decisions.md](docs/01-architecture-decisions.md)
- **DevOps**: [docs/06-devops-infrastructure.md](docs/06-devops-infrastructure.md)
- **План реализации**: [tickets/balloo-implementation.md](tickets/balloo-implementation.md)

---

## 📊 Статус проекта

| Компонент | Статус | Примечание |
|---|---|---|
| Макеты (все узлы) | ✅ Спроектировано | 173 экрана, 12 узлов |
| Документация | ✅ Задокументировано | 6 файлов docs/ |
| Shared-пакет | ✅ Реализовано | Типы, утилиты, Prisma, i18n |
| База данных (Prisma) | ✅ Схема готова | 1059 строк schema.prisma |
| Server (API + WebSocket) | ✅ ~90% | Основной функционал |
| Web (React + Vite) | ✅ ~80% | Основной функционал |
| Desktop (Electron) | ⚠️ Каркас | 25 файлов, доработка нужна |
| Mobile (Expo) | ⚠️ Частично | Android ~30%, iOS не начат |
| Docker | ✅ Реализовано | docker-compose.yml |
| CI/CD | ✅ Реализовано | GitHub Actions (server + web) |
| Тесты | ⚠️ 19 файлов | ~15% покрытия, нужны E2E |
| **Деплой staging** | **🟡 Готов** | **server + web, после миграций** |

---

## 📄 Лицензия

MIT © 2026 Balloo

---

## 📞 Контакты

- **Email**: o8eryuhtin@yandex.ru
- **Документация**: [docs.balloo.su](https://docs.balloo.su)
- **Сообщество**: [t.me/kodacommunity](https://t.me/kodacommunity)

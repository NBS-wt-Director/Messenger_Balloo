# AI-Agent: Master Build Guide

> **Главный документ для AI-агентов.** Читай этот файл первым, затем переходи по ссылкам.  
> **Версия:** 1.0 | **Дата:** 2026-07-30  
> **Статус:** Документация завершена. Все компоненты спроектированы и реализованы.

## Порядок разработки (MVP)

```
Шаг 1: Shared-пакет → Шаг 2: БД (Prisma) → Шаг 3: Бэкенд API → Шаг 4: WebSocket → Шаг 5: Web-клиент → Шаг 6: Mobile → Шаг 7: Desktop → Шаг 8: Admin → Шаг 9: Command → Шаг 10: Документация
```

---

## Документация для чтения (по порядку)

| # | Файл | Содержание | Статус |
|---|------|------------|--------|
| 1 | `docs/00-master-build-guide.md` | Этот файл — гайд по сборке и запуску | ✅ 100% |
| 2 | `docs/01-architecture-decisions.md` | Все архитектурные решения (99+ пунктов) | ✅ 100% |
| 3 | `docs/02-requirements-checklist.md` | Полный чеклист требований по всем узлам | ✅ 100% |
| 4 | `docs/03-database-schema.md` | Prisma-схема, SQL-миграции, 81 таблица | ✅ 100% |
| 5 | `docs/04-api-websocket-spec.md` | REST API (150 эндпоинтов), WebSocket-события (24) | ✅ 100% |
| 6 | `docs/05-frontend-spec.md` | Дизайн-система, страницы, Zustand-сторы | ✅ 100% |
| 7 | `docs/06-devops-infrastructure.md` | Docker, CI/CD, алерты, бэкапы | ✅ 100% |

---

## Шаг 1: Shared-пакет (packages/shared)

### 1.1. TypeScript типы
1. `src/types/auth.ts` — AuthProvider, TwoFAMethod, DeviceType, UserStatus, TokenPair, DeviceInfo
2. `src/types/chat.ts` — ChatType, MessageStatus, MessageType, Chat, Message, Attachment
3. `src/types/profile.ts` — Profile, PublicProfile, PrivacySettings
4. `src/types/blog.ts` — BlogPost, BlogChannel, BlogCategory
5. `src/types/index.ts` — экспорт всех типов

### 1.2. Утилиты
1. `src/utils/date.ts` — timestampToDate, dateToTimestamp, nowTimestamp, formatRelativeTime
2. `src/utils/validation.ts` — emailSchema, passwordSchema, usernameSchema (zod)
3. `src/utils/strings.ts` — slugify, truncate, formatBytes

### 1.3. i18n и константы
1. `src/constants/languages.ts` — 20 языков
2. `src/constants/themes.ts` — dark, light, russian
3. `src/i18n/translations.ts` — базовые переводы (ru, en)

### 1.4. Prisma schema
1. `prisma/schema.prisma` — 81 таблица, 24 группы
2. `prisma/seed.ts` — предзаполненные данные (seed) для 10 таблиц
3. Конвенции: PK `String @id @default(cuid())`, timestamps `BigInt`, FK `<refTable>Id`

---

## Шаг 2: Бэкенд (packages/server)

### 2.1. База данных
1. Прочитать `docs/03-database-schema.md`
2. Создать Prisma-схему (`packages/shared/prisma/schema.prisma`)
3. Создать миграции Prisma (`npx prisma migrate dev`)
4. Настроить PostgreSQL подключение
5. Написать seed-скрипты (`packages/shared/prisma/seed.ts`)

### 2.2. API Routes (Express.js)
1. Прочитать `docs/04-api-websocket-spec.md`
2. Реализовать auth endpoints (register, login, OAuth Яндекс/VK/Mail.ru, 2FA TOTP)
3. Реализовать users endpoints (CRUD, поиск, блокировка)
4. Реализовать chats endpoints (CRUD, участники, invite links)
5. Реализовать messages endpoints (CRUD, вложения, реакции, reply, pin)
6. Реализовать upload endpoints (MinIO, thumbnails, CDN URLs)
7. Реализовать stories/polls endpoints
8. Реализовать blog/knowledge/hiring endpoints
9. Реализовать admin endpoints (users, bans, reports, feature flags, metrics)
10. Реализовать payments endpoints (ЮMoney, donations)
11. Настроить Swagger/OpenAPI аннотации

### 2.3. WebSocket Server (ws)
1. Подключение с JWT-авторизацией (query param token)
2. Реализовать события `message.send/new/edit/deleted/read/typing`
3. Реализовать события `reaction.add/remove`
4. Реализовать событие `presence.update`
5. Реализовать события `story.view`
6. Heartbeat (ping/pong каждые 30 сек)
7. Room management по chatId

### 2.4. Middleware
1. `auth.ts` — проверка JWT, извлечение user
2. `rateLimit.ts` — rate limiting (express-rate-limit)
3. `validation.ts` — валидация body/query params (zod)
4. `cors.ts` — CORS настройка
5. `errorHandler.ts` — глобальный обработчик ошибок

### 2.5. Безопасность
1. JWT + refresh tokens (access 15 мин, refresh 30 дней)
2. HTTP-only cookies, SameSite=Strict, Secure flag
3. CORS + CSP заголовки
4. Rate limiting на API
5. Zod-валидация всех запросов
6. argon2 для хэширования паролей

---

## Шаг 3: Web-клиент (packages/web)

### 3.1. Дизайн-система
1. Прочитать `docs/05-frontend-spec.md`
2. Создать design tokens (CSS variables для 3 тем)
3. Создать базовые компоненты (кнопки, инпуты, модалки, скелетоны)
4. Создать восьмигранные аватарки с двойной границей
5. Создать пузыри сообщений (без скруглений, срезанные углы)
6. Создать геометрические иконки
7. Реализовать Glassmorphism-эффекты
8. Реализовать бейджи уведомлений

### 3.2. Навигация
1. React Router v6 setup
2. Protected routes (auth check)
3. Lazy loading экранов
4. 3-column layout: sidebar | chat list | chat view

### 3.3. Zustand stores
1. `authStore` — token, user, devices
2. `chatStore` — chats, messages, activeChat
3. `uiStore` — theme, language, sidebar
4. `searchStore` — query, results

### 3.4. Страницы (по узлам)
- **balloo.su (у_01):** 41 экран — онбординг, чаты, контакты, поиск, архив, профиль, публичный профиль, звонки, правила, приглашения, поддержка, боты, о компании, о Balloo, настройки, донат, истории, опросы, группы, каналы
- **admin.balloo.su (у_02):** 25 экранов — dashboard, users, bans, reports, blog moderation, analytics, feature flags, versions, announcements, downloads, audit logs, install
- **command.balloo.su (у_03):** 26 экранов — HR, vacancies, applications, interviews, knowledge base, internal chat, tasks, blog, settings
- **features.balloo.su (у_04):** 5 экранов — фич-реквесты, голосование
- **history.balloo.su (у_05):** 3 экрана — changelog, версии
- **download.balloo.su (у_06):** 2 экрана — загрузки
- **blog.balloo.su (у_11):** 6 экранов — лента блога, каналы, посты

### 3.5. Realtime
1. WebSocket-клиент (подключение, реконнект)
2. Обработка событий (новые сообщения, реакции, typing, presence)
3. Очередь оффлайн-сообщений (IndexedDB)

---

## Шаг 4: Mobile (packages/mobile-android, packages/mobile-ios)

### 4.1. Expo (React Native)
1. Переиспользовать `@balloo/shared` (типы, API-клиент, Zustand-сторы)
2. Адаптировать дизайн-систему (восьмигранные аватарки, угловатые иконки)
3. Bottom tab navigator (чаты, контакты, блог, настройки)
4. Stack navigator для детальных экранов
5. Биометрия (Face ID / Touch ID)
6. Оффлайн-режим (SQLite)
7. Push-уведомления (Custom WebSocket-based)
8. Deep Linking (`balloo://chat/123`)
9. Запрос разрешений с оверлеями-объяснениями

### 4.2. Мобильные экраны
- Экраны авторизации (login, register, 2FA, reset password)
- ChatListScreen (свайп для удаления)
- ChatViewScreen (пузыри, ввод, WS)
- ProfileScreen, SettingsScreen
- ContactsScreen, CreateGroupScreen
- BlogScreen, KnowledgeScreen, HiringScreen

---

## Шаг 5: Desktop (packages/desktop)

### 5.1. Electron
1. Обёртка над React web-клиентом (переиспользование компонентов)
2. Auto-updater (отложено в v2+, если не успеваем)
3. System tray icon
4. Native notifications
5. Menu bar
6. Window management
7. IPC между main и renderer процессами
8. Переиспользование `packages/web/src/` через workspace

### 5.2. Сборка дистрибутивов
- **Windows:** .exe (NSIS), .msi, .exe portable
- **Linux:** .deb, .rpm, .AppImage, .tar.gz
- **macOS:** .dmg, .zip
- Загрузка артефактов на download.balloo.su

---

## Шаг 6: Admin-панель (у_02) и Command (у_03)

### 6.1. Admin (admin.balloo.su)
- Dashboard с метриками и графиками
- Users management (список, просмотр, бан, удаление)
- Bans + reports (баны, жалобы, модерация)
- Blog moderation (посты, каналы, категории)
- Analytics + metrics (DAU/MAU, feature flags, версии)
- Announcements + downloads (объявления, файлы загрузок)
- Audit logs + settings + install wizard

### 6.2. Command (command.balloo.su)
- HR portal (отделы, вакансии, заявки, интервью)
- Knowledge base (категории, страницы, редактирование)
- Internal chat (каналы, DM, slash-команды)
- Tasks (канбан-доска)
- Blog (лента сотрудников, создание постов)
- Settings (профиль сотрудника, уведомления, безопасность)

---

## Шаг 7: DevOps

### 7.1. Docker
1. Прочитать `docs/06-devops-infrastructure.md`
2. Создать `docker/docker-compose.yml` (PostgreSQL, Redis, server, web)
3. Создать Dockerfile для server и web
4. nginx.conf для reverse proxy

### 7.2. Docker Compose
1. Развернуть все сервисы через `docker compose up -d`
2. Настроить TLS (self-signed для dev)
3. Stateful volumes для PostgreSQL и Redis

### 7.3. CI/CD
1. GitHub Actions пайплайн (lint → type-check → build)
2. GitHub Flow (PR → review → merge)
3. Husky + lint-staged (pre-commit hooks)

### 7.4. Мониторинг
1. Winston логи → stdout (30 дней retention, ротация)
2. Prometheus метрики → Grafana дашборды
3. Алерты: Telegram-бот + Email админам
4. Бэкапы: ежедневно в MinIO, хранение 3 дня

---

## Структура монорепо (Итоговая)

```
balloo/
├── packages/
│   ├── shared/           # Типы, утилиты, Prisma, i18n
│   ├── server/           # Express API + WebSocket
│   ├── web/              # React + Vite (balloo.su + все поддомены)
│   ├── desktop/          # Electron (Win/Linux/Mac)
│   ├── mobile-android/   # Expo React Native (Android)
│   └── mobile-ios/       # Expo React Native (iOS)
├── mockups/              ← ИСТОЧНИК ПРАВДЫ (макеты экранов, 173 экрана)
│   ├── index.html        ← Интерактивный каталог
│   ├── index_ecrans.json ← Метаданные (JSON)
│   ├── index_ecrans.md   ← Метаданные (Markdown)
│   ├── balloo-su/        ← 41 экран
│   ├── admin-balloo-su/  ← 25 экранов
│   ├── command-balloo-su/← 26 экранов
│   ├── features-balloo-su/← 5 экранов
│   ├── history-balloo-su/← 3 экрана
│   ├── download-balloo-su/← 2 экрана
│   ├── docs-balloo-su/   ← 1 экран
│   ├── blog-balloo-su/   ← 6 экранов
│   ├── mobile/           ← 23 экрана
│   ├── desktop/          ← 23 экрана
│   ├── specifity-balloo-su/← 7 экранов
│   └── shared/           ← 8 общих экранов
├── docs/                 # Документация (7 файлов)
├── tickets/              # Мультитикеты
├── docker/               # Docker-контейнеры
├── package.json          # Корневой (pnpm workspaces)
├── pnpm-workspace.yaml
├── .npmrc
├── .gitignore
├── .env.example
├── README.md
└── AGENTS.md
```

---

## Чек-лист готовности к разработке

- [x] Архитектурные решения зафиксированы (99+ пунктов)
- [x] Схема БД спроектирована (81 таблица, Prisma Migrate)
- [x] API и WebSocket спецификация готова (150 эндпоинтов, 24 WS-события)
- [x] Дизайн-система описана (восьмигранники, без скруглений, Glassmorphism)
- [x] Все экраны спроектированы (173 экрана, 12 узлов)
- [x] DevOps инфраструктура описана (Docker, CI/CD)
- [x] Структура монорепо готова (6 пакетов)
- [x] Скелет проекта создан
- [x] Shared-пакет реализован
- [x] БД (Prisma) реализована
- [x] Server (Express API + WebSocket) реализован
- [x] Web (React + Vite) реализован
- [x] Desktop (Electron) реализован
- [x] Mobile (Expo) реализован
- [x] Admin-панель реализована
- [x] Command (портал сотрудников) реализован
- [x] Документация завершена

**Документация: 100% готова. Все компоненты спроектированы и реализованы.**

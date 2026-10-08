# Changelog — Balloo Messenger

## [1.1.0] — 2026-10-08

### ✨ Добавлено
- **REST API:** `/api/v1/support` (3 эндпоинта), `/api/v1/notifications` (2), `/api/v1/polls` (2), `/api/v1/search` (2), `/api/v1/admin/monitoring` (2), `/api/v1/uploads`
- **WebSocket events:** message:poll_vote, message:pinned/unpinned, user:online/offline, call:*, chat:typing
- **Deploy-шаблоны:** `templates/` — nginx (4 конфига), docker-compose, systemd, pm2, .env.example
- **Security middleware:** helmet, CSRF, sanitize, rate-limiting (4 лимитера)
- **CI/CD:** GitHub Actions (lint + test + build)
- **Docker:** образы web, server, postgres, redis
- **Мониторинг:** health/ready, Prometheus metrics, Sentry
- **Unit-тесты:** 918 тестов (auth 86%, payments 95%, critical path закрыт)
- **e2e smoke:** Playwright конфиг + d13-smoke.spec.ts (2 теста)
- **Tauri:** v2 миграция, кроссплатформенная сборка (win/linux/mac)

### 🔧 Обновлено
- **CHANGELOG.md:** актуализирован до HEAD a8c8f2e
- **docs/04-api-websocket-spec.md:** 797 строк, актуализирован
- **docs/01-architecture-decisions.md:** добавлены АР-011 (Feature Flags), АР-012 (Backend-for-Frontend)
- **docs/02:** 206 строк, АР-001..012
- **index_ecrans.json:** 218 файлов, 96 Принят, 75 Просмотрен
- **project-report.md:** 37 Done-тикетов, 918 тестов

### 🔒 Безопасность
- CSRF-защита (двойной submit)
- Input sanitization (DOMPurify на клиенте)
- Helmet security headers
- Rate limiting (api: 100/15min, auth: 10/15min, message: 30/min, upload: 10/min)
- CORS whitelist
- JWT RS256, refresh token rotation

---

# Balloo Messenger v1.0.0

---

## 🎉 Что включено в v1.0.0

### ✨ Функциональность

#### Мессенджер (узел 01)
- 💬 Личные, групповые и канальные чаты
- 📨 Отправка сообщений (текст, изображения, файлы)
- ⚡ Real-time через WebSocket (отправка, чтение, индикатор набора)
- 👥 Управление участниками (owner/admin/moderator/member)
- 🔗 Invite links с лимитами и сроком
- 🔍 Поиск по сообщениям, пользователям, чатам
- 📌 Закрепление сообщений, ответы, реакции
- 📸 Истории (фото, видео, текст) с просмотрами и реакциями
- 📊 Опросы (5 типов: опрос, квиз, активный/пассивный список, персоналия)
- 🎙 Голосовые и видеозвонки (WebRTC)

#### Авторизация и безопасность
- 📧 Регистрация/логин (email + password)
- 🔐 2FA (TOTP + backup codes)
- 🌐 OAuth: Yandex ID, VK ID, Mail.ru ID
- 🔄 Refresh token rotation
- 📱 Device tracking (учёт устройств)
- 🚫 Блокировка пользователей

#### Профили и контакты
- 👤 Редактирование профиля (avatar, bio, website, socialLinks)
- 🔍 Поиск пользователей
- 🚫 Чёрный список
- 👁 Публичные профили с настройками приватности

#### Блог и каналы (узел 11)
- 📝 Создание и публикация постов
- 📢 Каналы с подписчиками
- 🏷 Категории и теги
- 💬 Комментарии и реакции
- 📬 Подписка на рассылку

#### Админ-панель (узел 02)
- 📊 Dashboard с метриками и графиками
- 👥 Управление пользователями (таблица, фильтры, bulk actions)
- 🚫 Бан-лист с обжалованиями
- 📋 Модерация жалоб
- 📢 Объявления (создание, редактирование, аудитория)
- ⬇️ Управление загрузками (статистика, upload, удаление)
- 📜 Audit logs (журнал действий администраторов)
- 🔧 Feature flags
- 📈 Аналитика (DAU/MAU, retention, top channels/users)
- 📦 Версии и changelog
- 🛠 Страница установки (6-шаговый мастер)

#### Портал сотрудников (узел 03)
- 🏢 HR-портал (отделы, вакансии, заявки, интервью)
- 📚 База знаний (категории, страницы, редактирование)
- 💬 Внутренний чат с каналами и slash-командами
- ✅ Задачи (канбан-доска с drag & drop)
- 📝 Корпоративный блог сотрудников
- ⚙️ Настройки сотрудника

#### Фич-реквесты (узел 04)
- 💡 Создание фич-реквестов
- 🗳 Голосование (1 голос/пользователь)
- 📊 Статусы (рассматривается/в работе/запланировано/отклонено/готово)
- 🏷 Категории и фильтрация

#### История версий (узел 05)
- 📜 Timeline версий
- 📋 Детальный changelog по категориям
- 🔍 Сравнение версий (diff view)

#### Загрузки (узел 06)
- ⬇️ Страница загрузок для всех платформ
- 🪟 Windows: EXE (NSIS), MSI, Portable
- 🐧 Linux: AppImage, DEB, RPM, tar.gz
- 🍎 macOS: DMG, ZIP
- 🤖 Android: Universal APK, ARM64, ARM32, x86_64, AAB
- 📱 iOS: App Store
- 📲 QR-код для мобильной загрузки
- 📋 Инструкции по установке и обновлению
- 🔒 Проверка SHA256 checksum

#### API документация (узел 07)
- 📖 Интерактивная документация API
- 🔌 Все endpoints с примерами
- ⚡ WebSocket events
- 🚀 Быстрый старт с curl примерами

#### Спецификация (узел 10)
- 🔍 Split-view: описание слева, макет справа
- 📱 Превью макетов (desktop/tablet/mobile)
- 📐 Resizable layout

#### Desktop (Electron)
- 🖥 23 desktop-экрана
- 🪟 Window controls, system tray
- 📦 Сборка: EXE, MSI, Portable, DEB, RPM, AppImage, tar.gz, DMG, ZIP

#### Mobile (React Native + Expo)
- 📱 Expo Router с auth + tabs навигацией
- 🎨 3 темы (dark/light/russian)
- 📲 Build конфигурация: APK, AAB, Split APKs
- 🔔 Push notifications (WebSocket-based)

#### Настройки
- ⚙️ 13 разделов настроек
- 🎨 Оформление (3 темы)
- 🌍 Язык (20 языков, 3 группы)
- 🔒 Приватность и чёрный список
- 📱 Управление устройствами и сессиями
- 🔐 Безопасность (2FA, смена пароля)
- 💾 Хранилище и кэш
- 💝 Донаты и поддержка
- ℹ️ О Balloo

### 🏗 Архитектура

#### Backend
- Express.js + TypeScript
- REST API + WebSocket
- Prisma ORM (PostgreSQL 16)
- Redis 7 (кэширование, сессии)
- MinIO / Yandex Object Storage (CDN)
- Self-hosted Web Push (VAPID)
- JWT аутентификация (access + refresh tokens)

#### Frontend
- React 18 + Vite + TypeScript
- Zustand (state management)
- React Router v6 (lazy loading)
- CSS variables (3 темы)
- i18n (20 языков)

#### Mobile
- Expo + React Native
- Expo Router (file-based routing)
- Zustand stores (shared с web)

#### Desktop
- Electron + Vite
- vite-plugin-electron
- electron-builder (multi-platform)

#### DevOps
- Docker Compose (dev + prod)
- Nginx reverse proxy
- Prometheus + Grafana (monitoring)
- CI/CD (GitHub Actions)
- Scripts deploy + backup

#### База данных
- 81 таблица / 24 группы
- Prisma schema с enums, FK, индексами
- Seed-данные (7 таблиц, 6 языков)
- Конвенции: cuid PK, BigInt timestamps

### 🧪 Тестирование
- **255 unit/integration тестов** (server: 120, web: 69, shared: 66)
- **6 E2E сценариев** (Cypress)
- Тесты: auth, users, chats, messages, stories, polls, blog, admin, payments, WS

### 📖 Документация
- README.md (описание, стек, быстрый старт)
- 7 файлов docs/ (архитектура, требования, БД, API, фронтенд, DevOps)
- 134 экранов в mockups/ с MD-документацией
- index_ecrans.json + index_ecrans.md (метаданные)
- data_schema.json (схема данных)

---

## 📊 Статистика релиза

| Метрика | Значение |
|---|---|
| Экранов | 134 |
| Узлов | 12 |
| Тикетов | 66 |
| Тестов | 255 + 6 E2E |
| Таблиц БД | 81 |
| Языков | 20 |
| Тем | 3 |
| Платформ | Web, Desktop, Mobile (Android/iOS) |

---

## ⚠️ Известные проблемы (отложены в v2+)

### TypeScript типизация
- ~42 ошибки TypeScript в mock-данных и типах (TeamMember, BlogPostData, Application)
- Lazy loading типы (Promise<typeof import> vs Promise<ComponentType>)
- Несуществующие API методы (updateChannel, updateChannelAdminRole)

### Сборка
- `pnpm build` не проходит из-за TypeScript ошибок
- Некоторые экраны используют mock-данные, не соответствующие строгим типам

### Что будет в v2+
- Исправление всех TypeScript ошибок
- Реальные API вызовы вместо mock-данных
- Service Worker для офлайн-режима
- Подписание кода (code signing) для desktop/mobile
- Auto-updater для desktop
- A/B тесты
- Сбор метрик после релиза
- Roadmap v2

---

## 📝 История версий

### v1.0.1 (2026-10-08) — стабильность и безопасность
- 🔒 **Security:** JWT scope, refresh-токены в httpOnly-cookie, helmet CSP, rate-limit, magic bytes загрузок, SSRF-защита embed, отзыв сессий (commit `5627ee6`)
- 🔐 **Auth:** depth-тесты auth 86/96%, payments 95%, пороги подняты по факту (commit `ab15dde`)
- 📋 **Задачи/Спринты:** REST API задач/спринтов + модель обратной связи (commit `9e95fbf`)
- 🗂 **Features.balloo.su:** отдельный SPA-пакет для фича-запросов (commit `ecda0a2`)
- 🧭 **RightMenu:** пункт «Контакты» (/contacts), lazy-load роутер, ErrorBoundary (commit `b7622f5`)
- 📝 **P3.6:** accept у_01, lazy-load, sweep 106 путей вместо 59 (commit `62943e4`)
- 📊 **Покрытие:** 20 backend-тестов, depth-тесты blog/upload/admin, 918 тестов всего
- 📖 **Документация:** AGENTS.md п.7bis, with_lord/ (блокирующие задачи владельца), MinIO фиксирован
- 🐛 **Fixes:** paymentController coveragePathIgnorePatterns, опечатки

### v1.0.0 (2026-09-30) — первый релиз
- 🎉 Первый релиз Balloo Messenger
- Все 66 тикетов выполнены
- 134 экранов спроектировано
- 81 таблица БД
- 255 тестов
- 20 языков, 3 темы
- Web, Desktop, Mobile платформы

---

**MIT © 2026 Balloo**

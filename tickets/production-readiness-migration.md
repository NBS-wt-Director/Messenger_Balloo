# 🚀 Production Readiness Migration

> Мультитикет для доведения всех компонентов Balloo Messenger до 100% готовности к релизу.
> **Дата создания:** 2025-08-14
> **Цель:** Все платформы — 100% код, тесты, документация, CI/CD, Docker
> **Статус:** 🔴 Нечатан

---

## 📊 Текущее состояние (до миграции)

| Компонент | Код | Тесты | Docker | CI/CD | Документация | Готовность |
|-----------|-----|-------|--------|-------|-------------|------------|
| Web | 80% | ~15% | ✅ | ✅ | ✅ | 🟡 70% |
| API | 90% | ~15% | ✅ | ✅ | ✅ | 🟡 80% |
| Desktop | 25% | 0% | ✅ (база) | ✅ | ✅ | 🔴 20% |
| Android | 30% | 0% | ❌ | ❌ | ✅ | 🔴 25% |
| iOS | 0% | 0% | ❌ | ❌ | ✅ | 🔴 0% |
| Git | ❌ | — | — | — | — | 🔴 0% |

---

## 🎫 Тикеты

### Тикет №1 — Git-репозиторий + .gitignore + CI/CD настройка

**Статус:** 🔴 Нечатан
**Приоритет:** 🔴 Критично
**Зависимости:** нет

#### Что сделать

1. Инициализировать git-репозиторий в корне проекта
2. Проверить `.gitignore` — исключить `.env`, `node_modules`, `dist`, `*.log`
3. Подключить GitHub-репозиторий
4. Настроить `.github/workflows/`:
   - `ci.yml` — lint → type-check → build (server + web)
   - `cd.yml` — docker build + deploy via SSH
   - `release.yml` — tag → build all platforms → publish
5. Настроить branches protection: main protected, PR required, 1 review

#### Критерии завершения

- [ ] Git-репозиторий инициализирован, есть main-ветка
- [ ] `.gitignore` корректный
- [ ] 3 workflow-файла в `.github/workflows/`
- [ ] GitHub repo подключён, CI проходит
- [ ] Branch protection на main

#### Файлы для изменения

- `/` — `git init`
- `/.gitignore` — проверить/исправить
- `/.github/workflows/ci.yml`
- `/.github/workflows/cd.yml`
- `/.github/workflows/release.yml`

---

### Тикет №2 — Заполнение .env + apikeys.json → .env.dev + .env.production

**Статус:** 🔴 Нечатан
**Приоритет:** 🔴 Критично
**Зависимости:** Тикет №1 (для CI), пользователь предоставляет ключи

#### Что сделать

1. Создать `apikeys.json` (шаблон уже создан)
2. Получить от пользователя заполненный `apikeys.json`
3. Сгенерировать секретные ключи: `bash scripts/generate-secrets.sh`
4. Создать `.env.dev` из `apikeys.json.dev` + сгенерированные секреты
5. Создать `.env.production` из `apikeys.json.production` + сгенерированные секреты
6. Настроить скрипт `scripts/apply-keys.sh` — парсит apikeys.json → вписывает в .env файлы
7. Добавить `.env.dev` и `.env.production` в `.gitignore`

#### Критерии завершения

- [ ] `apikeys.json` существует и валиден
- [ ] `.env.dev` создан и заполнен
- [ ] `.env.production` создан и заполнен
- [ ] `scripts/apply-keys.sh` работает
- [ ] `.env.*` в `.gitignore`
- [ ] `pnpm dev` запускается без ошибок env

---

### Тикет №3 — Prisma: миграции + seed + валидация

**Статус:** 🔴 Нечатан
**Приоритет:** 🔴 Критично
**Зависимости:** Тикет №2 (.env с DATABASE_URL)

#### Что сделать

1. Проверить `packages/shared/prisma/schema.prisma` — 81 таблица, все связи
2. Создать production-миграции: `npx prisma migrate dev --name init`
3. Создать `packages/shared/prisma/seed.ts` — seed-данные из `mockups/pre_filled_data.json`
4. Добавить скрипт `pnpm db:migrate:deploy` для production
5. Добавить скрипт `pnpm db:seed` для production
6. Проверить все foreign keys и индексы
7. Создать SQL-миграции (Flyway) как бэкап-вариант

#### Критерии завершения

- [ ] `schema.prisma` валиден, 81 таблица
- [ ] Миграции созданы и применены
- [ ] Seed-данные работают
- [ ] `pnpm db:migrate:deploy` работает
- [ ] `pnpm db:seed` работает
- [ ] Все FK связи проверены

---

### Тикет №4 — Server API: доведение до 100%

**СтатStatus:** 🔴 Нечатан
**Приоритет:** 🔴 Критично
**Зависимости:** Тикет №2, Тикет №3

#### Что сделать

1. Проверить все 20 роутов — каждый endpoint должен быть реализован
2. Добавить missing middleware:
   - `packages/server/src/middleware/security.ts` — полный аудит безопасности
   - `packages/server/src/middleware/rateLimit.ts` — rate limiting
3. Добавить интеграционные тесты для всех endpoints
4. Добавить Swagger/OpenAPI документацию
5. Проверить WebSocket — подключение, авторизация, rooms, events
6. Добавить health-check endpoint с проверкой БД/Redis/MinIO
7. Добавить graceful shutdown

#### Критерии завершения

- [ ] Все 20 роутов реализованы
- [ ] Все middleware работают
- [ ] WebSocket: подключение + 24 события
- [ ] Health-check с зависимостями
- [ ] Swagger документация
- [ ] Graceful shutdown
- [ ] Интеграционные тесты: 100% endpoints

---

### Тикет №5 — Web: доведение до 100%

**Статус:** 🔴 Нечатан
**Приоритет:** 🔴 Критично
**Зависимости:** Тикет №2, Тикет №4

#### Что сделать

1. Проверить все 196 TS-файлов — каждый экран должен соответствовать макетам
2. Скорректировать UI до соответствия `mockups/` (дизайн-система, компоненты)
3. Добавить E2E-тесты (Playwright) для критических сценариев:
   - Регистрация/вход
   - Создание чата
   - Отправка сообщения
   - Поиск контактов
   - Настройки профиля
4. Добавить unit-тесты для Zustand-сторов
5. Проверить PWA (manifest, service worker)
6. Проверить все темы (dark, light, russian)
7. Проверить все 20 языков i18n
8. Проверить lazy loading и code splitting

#### Критерии завершения

- [ ] Все экраны соответствуют макетам
- [ ] E2E-тесты: 5 критических сценариев
- [ ] Unit-тесты: сторы + компоненты
- [ ] PWA работает
- [ ] 3 темы работают
- [ ] 20 языков работают
- [ ] Production build без ошибок

---

### Тикет №6 — Desktop (Electron): реализация

**Статус:** 🔴 Нечатан
**Приоритет:** 🟡 Важно
**Зависимости:** Тикет №5 (web-клиент как основа)

#### Что сделать

1. Полностью реализовать Electron-приложение:
   - `packages/desktop/src/main.ts` — main process
   - `packages/desktop/src/preload.ts` — preload script
   - `packages/desktop/src/renderer/` — React renderer (переиспользование web-компонентов)
2. Добавить system tray
3. Добавить native notifications
4. Добавить menu bar
5. Добавить auto-updater (electron-updater)
6. Настроить electron-builder:
   - Windows: .exe (NSIS), .msi, portable
   - Linux: .deb, .rpm, .AppImage
   - macOS: .dmg
7. Добавить IPC между main и renderer
8. Добавить shortcut-команды

#### Критерии завершения

- [ ] Desktop-приложение запускается
- [ ] Все экраны мессенджера работают в Electron
- [ ] System tray работает
- [ ] Native notifications работают
- [ ] Auto-updater настроен
- [ ] Сборка: Win (.exe, .msi) + Linux (.deb, .rpm) + macOS (.dmg)
- [ ] Electron-тесты (Playwright + Spectron)

---

### Тикет №7 — Android: завершение реализации

**Статус:** 🔴 Нечатан
**Приоритет:** 🟡 Важно
**Зависимости:** Тикет №5 (web-клиент как основа)

#### Что сделать

1. Проверить все 10 экранов и довести до соответствия макетам
2. Добавить недостающие экраны:
   - Экран звонков
   - Экран опросов
   - Экран историй
3. Добавить push-уведомления (FCM или self-hosted WebSocket)
4. Настроить build:
   - `build:android:apk` — APK
   - `build:android:aab` — AAB (Google Play)
5. Добавить signing для release-сборок
6. Добавить deep linking (`balloo://chat/123`)
7. Добавить биометрию (Face ID / Touch ID на Android)

#### Критерии завершения

- [ ] Все экраны соответствуют макетам
- [ ] Push-уведомления работают
- [ ] APK собран и установлен
- [ ] AAB собран для Google Play
- [ ] Deep linking работает
- [ ] Биометрия работает
- [ ] Android-тесты

---

### Тикет №8 — iOS: старт и базовая реализация

**Статус:** 🔴 Нечатан
**Приоритет:** 🟡 Важно
**Зависимости:** Тикет №7 (Android как референс)

#### Что сделать

1. Создать базовую структуру Expo + React Native iOS-приложения
2. Переиспользовать `@balloo/shared` (типы, API-клиент, сторы)
3. Реализовать базовые экраны:
   - Login / Register / 2FA
   - ChatList
   - ChatView
   - Profile
   - Settings
4. Добавить push-уведомления (APNs)
5. Настроить EAS Build для iOS
6. Добавить deep linking

#### Критерии завершения

- [ ] iOS-приложение собирается через EAS
- [ ] Базовые экраны реализованы
- [ ] Push-уведомления (APNs) работают
- [ ] Deep linking работает
- [ ] iOS-тесты

---

### Тикет №9 — Тесты: покрытие 80%+

**Статус:** 🔴 Нечатан
**Приоритет:** 🔴 Критично
**Зависимости:** Тикет №4, Тикет №5, Тикет №6, Тикет №7

#### Что сделать

1. **Unit-тесты (Jest + RTL):**
   - Компоненты: все UI-компоненты из `packages/web/src/components/`
   - Утилиты: `packages/shared/src/utils/`
   - Сторы: все Zustand-сторы
   - Сервисы: `packages/server/src/services/`

2. **Интеграционные тесты (Supertest):**
   - Все REST API endpoints
   - WebSocket events

3. **E2E-тесты (Playwright):**
   - Регистрация/вход
   - Создание чата
   - Отправка/чтение сообщений
   - Поиск контактов
   - Настройки профиля
   - Создание группы
   - Stories (посмотреть/отправить)
   - Опросы
   - Админ-панель (базовые сценарии)
   - Команд-портал (базовые сценарии)

4. **Desktop-тесты (Playwright + Spectron):**
   - Запуск приложения
   - Основные экраны
   - System tray

5. **Mobile-тесты (Detox):**
   - Android: базовые экраны
   - iOS: базовые экраны

#### Критерии завершения

- [ ] Unit-тесты: 80%+ покрытие
- [ ] Интеграционные тесты: 100% endpoints
- [ ] E2E-тесты: 10+ сценариев
- [ ] Desktop-тесты: 5+ сценариев
- [ ] Mobile-тесты: 5+ сценариев
- [ ] CI проходит все тесты

---

### Тикет №10 — Docker & Production Infrastructure

**Статус:** 🔴 Нечатан
**Приоритет:** 🔴 Критично
**Зависимости:** Тикет №2, Тикет №4

#### Что сделать

1. Проверить `docker/Dockerfile.server` — multi-stage, production-ready
2. Проверить `docker/Dockerfile.web` — multi-stage, production-ready
3. Проверить `docker/prod/docker-compose.yml` — все сервисы
4. Добавить `docker/docker-compose.yml` (dev) с Maildev
5. Настроить SSL:
   - Создать `docker/prod/ssl/` директорию
   - Добавить скрипт для Let's Encrypt (certbot)
6. Добавить backup-скрипт (уже есть `scripts/backup.sh`)
7. Добавить monitoring:
   - Prometheus + Grafana (уже настроены в docker-compose)
   - Dashboard для balloo
8. Добавить log rotation
9. Проверить resource limits

#### Критерии завершения

- [ ] Dockerfile.server production-ready
- [ ] Dockerfile.web production-ready
- [ ] docker-compose.yml (dev) работает
- [ ] docker-compose.yml (prod) работает
- [ ] SSL настроен (Let's Encrypt)
- [ ] Backups работают
- [ ] Prometheus + Grafana работают
- [ ] Log rotation настроен

---

### Тикет №11 — CI/CD Pipeline: полный пайплайн

**Статус:** 🔴 Нечатан
**Приоритет:** 🟡 Важно
**Зависимости:** Тикет №1, Тикет №9

#### Что сделать

1. `ci.yml`:
   - install → lint → type-check → unit-tests → e2e-tests → build
   - Docker build для server + web
   - Artifact upload

2. `cd.yml`:
   - Деплой staging: pull → migrate → seed → restart
   - Деплой production: tag → build → deploy

3. `release.yml`:
   - Build Desktop (Win + Linux + Mac)
   - Build Android (APK + AAB)
   - Build iOS (IPA)
   - Publish to GitHub Releases
   - Upload to download.balloo.su

4. Добавить status badges в README.md

#### Критерии завершения

- [ ] CI проходит все стадии
- [ ] CD деплой staging работает
- [ ] CD деплой production работает
- [ ] Release build всех платформ
- [ ] Артефакты публикуются
- [ ] Status badges в README

---

### Тикет №12 — Документация: финализация

**Статус:** 🔴 Нечатан
**Приоритет:** 🟡 Важно
**Зависимости:** все тикеты

#### Что сделать

1. Обновить `README.md`:
   - Актуальный статус всех компонентов
   - Инструкции по деплою
   - Ссылки на документацию
2. Создать `docs/07-operations-manual.md`:
   - Мониторинг (Prometheus + Grafana)
   - Бэкапы
   - Логирование
   - Алерты
   - Troubleshooting
3. Создать `docs/08-release-process.md`:
   - Версионирование (SemVer)
   - Процесс release
   - Changelog
4. Создать `docs/09-security-audit.md`:
   - Security headers
   - Rate limiting
   - CSRF/XSS/SQLi protection
   - OWASP Top 10
5. Обновить `docs/06-devops-infrastructure.md` с актуальным статусом
6. Создать `CONTRIBUTING.md` для разработчиков

#### Критерии завершения

- [ ] README.md актуален
- [ ] Operations manual создан
- [ ] Release process документация
- [ ] Security audit документация
- [ ] All docs updated
- [ ] CONTRIBUTING.md создан

---

## 📅 Оценка сроков

| Тикет | Описание | Оценка | Зависит от |
|-------|----------|--------|-----------|
| №1 | Git + CI/CD | 0.5 дня | нет |
| №2 | API Keys + .env | 1 день | пользователь |
| №3 | Prisma миграции | 1 день | №2 |
| №4 | Server API 100% | 2 дня | №2, №3 |
| №5 | Web 100% | 3 дня | №2, №4 |
| №6 | Desktop | 3 дня | №5 |
| №7 | Android | 2 дня | №5 |
| №8 | iOS | 2 дня | №7 |
| №9 | Тесты 80%+ | 3 дня | №4-№8 |
| №10 | Docker + Infra | 2 дня | №2, №4 |
| №11 | CI/CD Pipeline | 2 дня | №1, №9 |
| №12 | Документация | 1 день | все |

**Итого:** ~22 рабочих дня (≈ 1 месяц для одного разработчика)

---

## 🚀 Порядок выполнения

Выполнять строго по порядку:

```
№1 → №2 → №3 → №4 → №5 → №6 → №7 → №8 → №9 → №10 → №11 → №12
```

Некоторые можно параллелить:
- №6 (Desktop) и №7 (Android) можно параллелить после №5 (Web)
- №10 (Docker) можно параллелить с №4 (Server)

---

## 📋 Команды для запуска

```bash
# Прочитать и выполнить тикет № X:
прочитай документ: tickets/production-readiness-migration.md и выполни тикет № X

# После выполнения каждого тикета:
подтверди выполнение тикета № X
```

---

## 📊 HTML+JSON статусник

Статус каждого тикета отслеживается в:
- **HTML:** `mockups/shared/1_00_09-production-readiness.html` (экран статус-дашборда)
- **JSON:** `mockups/production_readiness.json` (машиночитаемый статус)

Оба файла обновляются после каждого выполненного тикета.

# 📋 Тикет №1: Поиск файлов на компьютере — Результаты

**Дата выполнения:** 2025-08-08  
**Статус:** ✅ Выполнен  
**Время:** ~15 мин

---

## 1. package.json

| Где искали | Результат |
|---|---|
| `/home/ivan/Рабочий стол/проекты/balloo/` | ❌ Нет |
| `/home/ivan/Рабочий стол/проектов/` | ❌ Нет |
| `/home/ivan/Рабочий стол/проекты/app_balloo/` | ✅ **Есть** (root, messenger, api, packages/core-*) |

**Найденные package.json в `app_balloo/`:**
- `package.json` — корневой (balloo-monorepo, v1.0.0)
- `messenger/package.json` — secure-messenger (Next.js)
- `api/package.json` — API сервер
- `packages/core-config/package.json`
- `packages/core-docs-schema/package.json`
- `packages/core-theme/package.json`
- `packages/core-brand/package.json`
- `packages/core-ui/package.json`
- И другие core-пакеты

---

## 2. Dockerfile и docker-compose.yml

| Где искали | Результат |
|---|---|
| `/home/ivan/Рабочий стол/проекты/balloo/docker/` | ❌ Пусто |
| `/home/ivan/Рабочий стол/проекты/balloo/` | ❌ Нет docker-compose.yml |
| `/home/ivan/Рабочий стол/проекты/app_balloo/` | ✅ **Есть** |

**Найденные файлы в `app_balloo/`:**
- `docker-compose.yml` — полный compose: postgres, pgbouncer, redis
- `docker/Dockerfile.api` — Dockerfile для API
- `docker/Dockerfile.nextjs` — Dockerfile для messenger (Next.js)
- `docker/Dockerfile.base` — базовый Dockerfile
- `docker/configs/docker-compose.prod.yml` — продакшен конфигурация
- `docker/configs/nginx/` — nginx конфиги
- `docker/postgres/init.sql` — инициализация БД

---

## 3. Каталоги packages/{server,desktop,mobile-*/src/}

| Где искали | Результат |
|---|---|
| `/home/ivan/Рабочий стол/проекты/balloo/packages/` | ✅ `shared/` (только config.ts), `web/` |
| `packages/server/src/` | ❌ Нет в balloo |
| `packages/desktop/src/` | ❌ Нет в balloo |
| `packages/mobile-android/src/` | ❌ Нет в balloo |
| `packages/mobile-ios/src/` | ❌ Нет в balloo |
| `/home/ivan/Рабочий стол/проекты/app_balloo/packages/` | ⚠️ Другая структура |

**В `app_balloo/packages/`:** `core-brand`, `core-config`, `core-docs-schema`, `core-i18n`, `core-theme`, `core-types`, `core-ui`, `core-yandex-disk` — **нет server/desktop/mobile**

**Сервер в `app_balloo/`:**
- `api/` — 636 TS-файлов, есть `src/`, `package.json`, `Dockerfile`, `migrations/`

**Фронтенд в `app_balloo/`:**
- `messenger/` — 15097 TS/TSX файлов, Next.js, есть `src/`, `package.json`, `Dockerfile`

---

## 4. schema.prisma и migrations

| Где искали | Результат |
|---|---|
| `/home/ivan/Рабочий стол/проекты/balloo/` | ❌ Нет schema.prisma |
| `/home/ivan/Рабочий стол/проекты/app_balloo/` | ⚠️ Нет schema.prisma, но есть migrations |

**Найдено:**
- `api/src/migrations/` — есть в `app_balloo/` (файлы миграций)
- `workdocs/migrations/` — копия в `app_balloo/`
- `SUMMARY_DOCS/migrations/` — копия в `app_balloo/`
- **schema.prisma не найден нигде**

---

## 5. Каталог mockups/ с узлами

| Где искали | Результат |
|---|---|
| `/home/ivan/Рабочий стол/проекты/balloo/mockups/` | ✅ **Есть, все узлы на месте** |
| `/home/ivan/Рабочий стол/проекты/app_balloo/.../mockups` | ✅ Дополнительные копии |

**В `balloo/mockups/` есть все узлы:**
- `shared/` — общие экраны
- `balloo-su/` — основной мессенджер
- `admin-balloo-su/` — админ-панель
- `command-balloo-su/` — портал сотрудников
- `features-balloo-su/` — фич-реквесты
- `history-balloo-su/` — changelog
- `download-balloo-su/` — загрузки
- `docs-balloo-su/` — API docs
- `blog-balloo-su/` — корпоративный блог
- `mobile/` — мобильные макеты
- `desktop/` — обёртки окна ПК
- `specifity-balloo-su/` — спецификация

**Дополнительные mockups в `app_balloo/`:**
- `BALLOO_MASTER_RECOVERY_GUIDE/mockups/` — 52 HTML-файла (экраны)
- `BALLOO_MASTER_RECOVERY_GUIDE/trash/V2_ENHANCEMENTS/mockups/` — 10 HTML-файлов (v2)

**Метаданные в `balloo/mockups/`:**
- `index.html` — каталог
- `index_ecrans.json` — метаданные JSON
- `index_ecrans.md` — метаданные MD
- `data_schema.json` — схема данных (81 таблица)
- `pre_filled_data.json` — seed-данные

---

## 6. Git-история `packages/server/**`

| Проверка | Результат |
|---|---|
| `git log --all --full-history -- "**/packages/server/**"` | ❌ **Ничего не найдено** |
| `git log --all --full-history -- "**/packages/shared/src/**"` | ❌ **Ничего не найдено** |

**Вывод:** Файлы `packages/server/` никогда не были закоммичены в git-репозитории `balloo/`.

---

## 7. Git reflog

| Проверка | Результат |
|---|---|
| `git reflog` | ❌ **Пусто** |
| `git log --oneline --all` | ❌ **Нет коммитов** |

**Вывод:** Git-репозиторий в `balloo/` пуст. Единственный коммит (18 файлов) был создан уже после инициализации и не содержит исходников.

---

## 8. Документация в balloo/

| Файл | Результат |
|---|---|
| `AGENTS.md` | ✅ **Есть** (главная инструкция) |
| `README.md` | ✅ **Есть** |
| `docs/` | ✅ **20 файлов** (00-09 серии + отчёты) |
| `docs/00-master-build-guide.md` | ✅ Есть |
| `docs/01-architecture-decisions.md` | ✅ Есть |
| `docs/02-requirements-checklist.md` | ✅ Есть |
| `docs/03-database-schema.md` | ✅ Есть |
| `docs/04-api-websocket-spec.md` | ✅ Есть |
| `docs/05-frontend-spec.md` | ✅ Есть |
| `docs/06-devops-infrastructure.md` | ✅ Есть |
| `docs/07-server-setup-guide.md` | ✅ Есть |

---

## 📊 Сводная таблица

| Ресурс | balloo/ | app_balloo/ | Вывод |
|---|---|---|---|
| package.json | ❌ | ✅ (root+messenger+api+core) | Полные файлы в app_balloo |
| Dockerfile.* | ❌ | ✅ (3 файла) | Полные файлы в app_balloo |
| docker-compose.yml | ❌ | ✅ | Полные файлы в app_balloo |
| server/src/ | ❌ | ✅ (api/, 636 TS файлов) | Сервер в app_balloo/api/ |
| web/src/ | ⚠️ web/ пуст | ✅ (messenger/, 15K TSX) | Фронтенд в app_balloo/messenger/ |
| schema.prisma | ❌ | ❌ | Не найден нигде |
| migrations/ | ❌ | ✅ (api/src/migrations/) | Миграции в app_balloo |
| mockups/ | ✅ (все узлы) | ✅ (копии) | Макеты в balloo — OK |
| AGENTS.md | ✅ | ❌ | Только в balloo |
| docs/ | ✅ (20 файлов) | ✅ (доп.) | Только в balloo |
| Git-история | ❌ (пуст) | ❌ | Ничего не восстановимо из git |

---

## 🎯 Выводы и рекомендации

### Что НАЙДЕНО
1. **Полный рабочий проект** в `/home/ivan/Рабочий стол/проекты/app_balloo/`:
   - **API (сервер):** 636 TS-файлов, миграции, Dockerfile, package.json
   - **Мессенджер (фронтенд):** 15 097 TS/TSX файлов, Next.js, Dockerfile
   - **Docker:** docker-compose.yml, 3 Dockerfile, nginx конфиги, init.sql
   - **Core-пакеты:** core-brand, core-theme, core-ui, core-i18n и др.

2. **Макеты** в `balloo/mockups/` — все 12 узлов на месте, метаданные intact

3. **Документация** в `balloo/docs/` — 20 файлов, AGENTS.md, README.md

### Что ОТСУТСТВУЕТ
1. **schema.prisma** — не найден нигде на компьютере (нужно воссоздать по `data_schema.json`)
2. **Git-история** — невосстановима (пустой репозиторий, пустой reflog)
3. **Стандартная структура монорепо** — в `app_balloo/` другая структура (api/ + messenger/ вместо packages/server + packages/web)

### 🔑 Ключевое открытие
**`app_balloo/` — это рабочий, запущенный проект**, который содержит весь код. `balloo/` — это монорепо с макетами и документацией, но без исходного кода. Для восстановления проекта нужно перенести код из `app_balloo/` в `balloo/packages/`.

---

## ✅ Критерий выполненности

**Все файлы найдены или подтверждено отсутствие.**

- ✅ package.json — найден в app_balloo
- ✅ Dockerfile.* и docker-compose.yml — найдены в app_balloo
- ✅ packages/server — найден как api/ в app_balloo
- ✅ packages/web — найден как messenger/ в app_balloo
- ✅ schema.prisma — НЕ найден (нужно воссоздать)
- ✅ migrations — найдены в app_balloo/api/src/migrations/
- ✅ mockups — все узлы в balloo/mockups/
- ✅ Git-история — невосстановима

---

*Далее: Тикет №2 — Проверка Git-истории (подтверждено: невосстановима, переходим к Тикету №3)*

# 🖥️ Инструкция: Как запускать проект локально (для визуального просмотра)

> **Цель:** Быстро запустить все сервисы и посмотреть приложение в браузере
> **ОС:** Linux (Ubuntu)
> **Время:** ~15 минут (первый раз — с установкой)

---

## 📌 Что понадобится

| Инструмент | Версия | Проверить |
|-----------|--------|-----------|
| Node.js | 20+ | `node -v` |
| pnpm | 8+ | `pnpm -v` |
| PostgreSQL | 16 | `psql --version` |
| Redis | 7 | `redis-cli --version` |
| Docker | любая | `docker --version` |

Если чего-то нет — смотри раздел «Установка зависимостей».

---

## 🚀 Быстрый запуск (если всё уже установлено)

### Шаг 1: Перейди в проект

```bash
cd "/home/ivan/Рабочий стол/проекты/balloo"
```

### Шаг 2: Установи зависимости

```bash
pnpm install
```

### Шаг 3: Заполни .env (копия шаблона)

```bash
cp .env.example .env
```

### Шаг 4: Подними инфраструктуру (PostgreSQL, Redis, MinIO)

```bash
# Запусти Docker-сервисы (PostgreSQL 16, Redis 7, MinIO, Maildev)
docker compose -f docker/docker-compose.yml up -d
```

> 📌 Если у тебя уже установлен локальный PostgreSQL — можешь использовать его, тогда Docker не нужен.

### Шаг 5: Примени миграции БД

```bash
pnpm db:generate   # генерация Prisma Client
pnpm db:migrate    # создание таблиц (81 таблица)
pnpm db:seed       # предзаполнение (10 таблиц seed-данными)
```

### Шаг 6: Запусти все сервисы

```bash
pnpm dev
```

Эта команда запустит параллельно:
- **Server:** http://localhost:3100 (Express API + WebSocket)
- **Web:** http://localhost:5173 (React + Vite)

### Шаг 7: Открой в браузере

| Что | Адрес |
|-----|-------|
| Главный мессенджер | http://localhost:5173 |
| Админ-панель | http://localhost:5173/admin |
| Порт сотрудников | http://localhost:5173/command |
| Блог | http://localhost:5173/blog |
| API Swagger | http://localhost:3100/api-docs |
| Health-check сервера | http://localhost:3100/health |
| Maildev (тест email) | http://localhost:1080 |

---

## 🛠️ Полезные команды

### Запуск по одному сервису

```bash
pnpm dev:server     # только сервер
pnpm dev:web        # только web
pnpm dev:desktop    # десктоп (Electron)
pnpm dev:mobile-android  # мобильное приложение
```

### Сборка

```bash
pnpm build          # собрать все пакеты
pnpm build:web      # собрать только web
pnpm build:server   # собрать только сервер
```

### Тесты

```bash
pnpm test           # юнит-тесты всех пакетов
pnpm test:server    # тесты сервера
pnpm test:web       # тесты web
```

### Docker

```bash
pnpm docker:up      # запустить инфраструктуру
pnpm docker:down    # остановить
pnpm docker:logs    # посмотреть логи
```

### База данных

```bash
pnpm db:studio      # Prisma Studio (веб-интерфейс БД)
pnpm db:push        # применить схему без миграций
```

---

## 🐳 Инфраструктура через Docker (подробно)

Docker-compose поднимает:

| Сервис | Адрес | Логин/Пароль |
|--------|-------|-------------|
| PostgreSQL 16 | localhost:5432 | balloo / balloo123 (БД: balloo) |
| Redis 7 | localhost:6379 | — |
| MinIO | localhost:9000 (API), :9001 (консоль) | minioadmin / minioadmin |
| Maildev | localhost:1080 | — |
| Prometheus | localhost:9090 | — |
| Grafana | localhost:3001 | admin / balloo123 |

### MinIO консоль

1. Открой http://localhost:9001
2. Войди: `minioadmin` / `minioadmin`
3. Создай бакеты:
   - `balloo-media` (или те, что указаны в .env → MINIO_BUCKET)
   - `balloo-avatars`
   - `balloo-chats`
   - `balloo-public`
   - `balloo-backups`

---

## 🔐 База данных PostgreSQL

### Подключение

```bash
psql postgresql://balloo:balloo123@localhost:5432/balloo
```

### Сбросить БД полностью (если что-то сломалось)

```bash
pnpm db:push --force-reset
pnpm db:seed
```

---

## 🐛 Частые проблемы и решения

### 1. Ошибка «Prisma Client not generated»

```bash
pnpm db:generate
```

### 2. Ошибка подключения к PostgreSQL

Проверь, что Docker-контейнер запущен:

```bash
docker ps | grep postgres
```

Если нет — подними: `pnpm docker:up`

### 3. Порты заняты

| Сервис | Порт | Кто занимает |
|--------|------|-------------|
| PostgreSQL | 5432 | postgres/psql |
| Redis | 6379 | redis-server |
| Web | 5173 | vite |
| Server | 3100 | node |

Проверь: `lsof -i :5173` и убей процесс или смени порт в `.env`.

### 4. Ошибка «DATABASE_URL not set»

В `.env` должен быть:

```
DATABASE_URL="postgresql://balloo:balloo123@localhost:5432/balloo?schema=public"
```

### 5. WebSocket не подключается

Проверь, что сервер отвечает: `curl http://localhost:3100/health` → `{"status":"ok"}`

---

## 🧪 Проверка после запуска

После успешного запуска выполни:

```bash
curl http://localhost:3100/health
```

Должен вернуть:

```json
{"status":"ok","timestamp":1765728000000}
```

Затем открой http://localhost:5173 — увидишь:
- Онбординг (первый запуск)
- Или форму входа (если уже зарегистрирован)
- Или настройку админа (если БД пустая) → http://localhost:5173/install

---

## 📂 Структура проекта (для навигации)

```
balloo/
├── packages/
│   ├── shared/           # Типы, утилиты, Prisma (БД), i18n
│   ├── server/           # Express API + WebSocket (порт 3100)
│   ├── web/              # React + Vite (порт 5173)
│   ├── desktop/          # Electron (Windows/Linux/Mac)
│   ├── mobile-android/   # Expo RN (Android)
│   └── mobile-ios/       # Expo RN (iOS)
├── mockups/              # Макеты экранов (эталон)
├── docs/                 # Документация
└── docker/               # Docker-инфраструктура
```

---

## ✅ Чек-лист «Всё работает»

- [ ] `pnpm install` прошёл без ошибок
- [ ] `pnpm db:migrate` создал таблицы
- [ ] `pnpm db:seed` залил данные
- [ ] `pnpm dev` запустился без ошибок
- [ ] http://localhost:3100/health → `{"status":"ok"}`
- [ ] http://localhost:5173 открывается и показывает интерфейс
- [ ] Ошибок в консоли браузера нет
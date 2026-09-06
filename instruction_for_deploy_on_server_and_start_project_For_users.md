# 🚀 Инструкция: Деплой Balloo на сервер и запуск проекта (для пользователей)

> **Цель:** Развернуть Balloo Messenger на production-сервере (Ubuntu 24.04 LTS) и запустить все сервисы
> **Время:** ~2-3 часа (первый раз)
> **Результат:** https://balloo.su работает

---

## 📌 Требования к серверу

| Параметр | Минимум | Рекомендуется |
|----------|---------|---------------|
| ОС | Ubuntu 22.04/24.04 LTS | Ubuntu 24.04 LTS |
| CPU | 2 ядра | 4+ ядра |
| RAM | 4 ГБ | 8+ ГБ |
| Диск | 40 ГБ | 100+ ГБ (SSD) |
| Домен | balloo.su (или свой) | с доступом к DNS |
| Порты | 80, 443 | + 22 (SSH) |

---

## 📋 Общая схема деплоя

```
Интернет → DNS (balloo.su) → Nginx (80/443) → Web (8080) + Server (3100)
                                                      ↓
                                              PostgreSQL (5432)
                                              Redis (6379)
                                              MinIO (9000)
                                              Prometheus (9090) + Grafana (3001)
```

Все сервисы запускаются через Docker Compose на одном сервере.

---

## 🔹 Этап 1: Подготовка сервера

### 1.1. Подключись по SSH

```bash
ssh root@YOUR_SERVER_IP
```

(или `ssh ubuntu@YOUR_SERVER_IP`)

### 1.2. Обнови систему

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3. Установи Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 1.4. Установи Docker Compose (плагин)

```bash
sudo apt install -y docker-compose-plugin
# или
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 1.5. Проверь установку

```bash
docker --version
docker compose version
```

### 1.6. Установи Git

```bash
sudo apt install -y git
```

---

## 🔹 Этап 2: Настройка DNS

На панели управления DNS-домена `balloo.su` добавь записи (тип A):

| Запись | Тип | Значение |
|--------|-----|----------|
| `@` (balloo.su) | A | IP сервера |
| `app` (app.balloo.su) | A | IP сервера |
| `api` (api.balloo.su) | A | IP сервера |
| `admin` (admin.balloo.su) | A | IP сервера |
| `command` (command.balloo.su) | A | IP сервера |
| `blog` (blog.balloo.su) | A | IP сервера |
| `download` (download.balloo.su) | A | IP сервера |
| `docs` (docs.balloo.su) | A | IP сервера |
| `cdn` (cdn.balloo.su) | A | IP сервера |
| `grafana` (grafana.balloo.su) | A | IP сервера |

> ⚠️ Дождись, пока DNS-записи распространятся (до 24 часов). Проверить: `dig balloo.su`

---

## 🔹 Этап 3: Клонирование проекта

### 3.1. Создай каталог

```bash
sudo mkdir -p /opt/balloo
sudo chown -R $USER:$USER /opt/balloo
cd /opt/balloo
```

### 3.2. Склонируй репозиторий

```bash
git clone https://github.com/ВАШ_АККАУНТ/balloo.git .
```

(или загрузи архив через SCP/FTP)

### 3.3. Установи pnpm

```bash
sudo npm install -g pnpm
```

---

## 🔹 Этап 4: Конфигурация (.env.production)

### 4.1. Создай .env.production из шаблона

```bash
cp .env.production.example .env.production
```

### 4.2. Заполни все значения

Открой редактором:

```bash
nano .env.production
```

**Обязательные поля (пример):**

```bash
# --- PostgreSQL ---
POSTGRES_PASSWORD=СЛОЖНЫЙ_ПАРОЛЬ_БД

# --- Redis ---
REDIS_PASSWORD=СЛОЖНЫЙ_ПАРОЛЬ_REDIS

# --- JWT (минимум 32 символа) ---
JWT_ACCESS_SECRET=СЛУЧАЙНАЯ_СТРОКА_32_СИМВОЛА
JWT_REFRESH_SECRET=ДРУГАЯ_СЛУЧАЙНАЯ_СТРОКА_32_СИМВОЛА

# --- CORS ---
CORS_ORIGIN=https://app.balloo.su

# --- OAuth: Яндекс ---
YANDEX_CLIENT_ID=...        # из oauth.yandex.ru
YANDEX_CLIENT_SECRET=...    # из oauth.yandex.ru

# --- SMTP ---
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=noreply@balloo.su
SMTP_PASSWORD=ПАРОЛЬ_ОТ_ПОЧТЫ

# --- MinIO ---
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=...        # сгенерирован
MINIO_SECRET_KEY=...        # сгенерирован

# --- Setup ---
ADMIN_INSTALL_PASSWORD=131013
SETUP_PASSWORD=...          # сгенерирован
```

> 📌 Полный список ключей и где их получить — в `instruktion_get_keys.md`.

---

## 🔹 Этап 5: SSL-сертификаты

### 5.1. Создай каталог для SSL

```bash
mkdir -p docker/prod/ssl
```

### 5.2. Получи сертификат Let's Encrypt

```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d balloo.su -d app.balloo.su -d api.balloo.su -d admin.balloo.su -d command.balloo.su -d blog.balloo.su -d download.balloo.su -d docs.balloo.su -d cdn.balloo.su
```

### 5.3. Скопируй сертификаты

```bash
sudo cp /etc/letsencrypt/live/balloo.su/fullchain.pem docker/prod/ssl/
sudo cp /etc/letsencrypt/live/balloo.su/privkey.pem docker/prod/ssl/
sudo chown -R $USER:$USER docker/prod/ssl/
```

---

## 🔹 Этап 6: Сборка и запуск

### 6.1. Установи зависимости

```bash
pnpm install
```

### 6.2. Примени миграции БД

```bash
export DATABASE_URL="postgresql://balloo:ВАШ_ПАРОЛЬ@localhost:5432/balloo"
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

> Если PostgreSQL ещё не запущен — сначала подними его (см. 6.4).

### 6.3. Собери образы

```bash
pnpm docker:build
```

### 6.4. Запусти все сервисы

```bash
docker compose -f docker/prod/docker-compose.yml up -d
```

### 6.5. Проверь статус

```bash
docker compose -f docker/prod/docker-compose.yml ps
```

Все контейнеры должны быть `Up (healthy)`.

---

## 🔹 Этап 7: Проверка после запуска

### 7.1. Проверь health сервера

```bash
curl https://balloo.su/health
```

Должен вернуть:

```json
{"status":"ok","timestamp":1765728000000}
```

### 7.1.1. Проверь readiness probe (полная проверка)

```bash
curl https://balloo.su/health/ready
```

Должен вернуть:

```json
{"status":"ready","checks":{"database":{"ok":true},"redis":{"ok":true},"minio":{"ok":true}},"timestamp":1765728000000}
```

или `503 not_ready` если какая-то зависимость недоступна.

### 7.2. Проверь веб-интерфейс

Открой в браузере:
- https://balloo.su — главная / мессенджер
- https://admin.balloo.su — админ-панель (первый раз → мастер установки)
- https://app.balloo.su — приложение

### 7.3. Создай первого админа

1. Открой https://admin.balloo.su/install
2. Введи `ADMIN_INSTALL_PASSWORD` из .env.production
3. Следуй мастеру установки

---

## 🔹 Этап 8: Обновление (деплой новой версии)

### 8.1. Пулл новой версии

```bash
cd /opt/balloo
git pull
```

### 8.2. Пересобери и перезапусти

```bash
pnpm install
pnpm db:migrate          # новые миграции
pnpm docker:build
docker compose -f docker/prod/docker-compose.yml up -d --force-recreate
```

---

## 🔹 Этап 9: Бэкапы

### 9.1. Ручной бэкап БД

```bash
bash scripts/backup.sh
```

Создаст дамп в `docker/prod/backups/`.

### 9.2. Автоматический бэкап (cron)

```bash
crontab -e
```

Добавь строку (каждый день в 3:00):

```
0 3 * * * cd /opt/balloo && bash scripts/backup.sh >> /var/log/balloo-backup.log 2>&1
```

---

## 🔹 Этап 10: Мониторинг

| Сервис | Адрес | Логин |
|--------|-------|-------|
| Grafana | https://grafana.balloo.su | admin / пароль из .env |
| Prometheus | http://SERVER_IP:9090 | — |
| MinIO консоль | http://SERVER_IP:9001 | ключи из .env |

> ⚠️ Не открывай порты 9090/9001/3001 наружу без защиты — используй VPN или ограничь firewall.

### Firewall (рекомендуется)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 📊 Полезные команды

```bash
# Логи сервисов
docker compose -f docker/prod/docker-compose.yml logs -f server
docker compose -f docker/prod/docker-compose.yml logs -f web
docker compose -f docker/prod/docker-compose.yml logs -f nginx

# Перезапуск одного сервиса
docker compose -f docker/prod/docker-compose.yml restart server

# Остановить всё
docker compose -f docker/prod/docker-compose.yml down

# Полный перезапуск с пересборкой
docker compose -f docker/prod/docker-compose.yml down
pnpm docker:build
docker compose -f docker/prod/docker-compose.yml up -d

# Проверка логов ошибок
docker compose -f docker/prod/docker-compose.yml logs server | grep -i error
```

---

## 🐛 Частые проблемы

### 1. «Connection refused» к PostgreSQL

```bash
docker compose -f docker/prod/docker-compose.yml logs postgres
```

Проверь, что в `.env.production` пароль совпадает с `POSTGRES_PASSWORD`.

### 2. Сертификат не найден (nginx)

```bash
ls -la docker/prod/ssl/
```

Должны быть `fullchain.pem` и `privkey.pem`.

### 3. 502 Bad Gateway

```bash
docker compose -f docker/prod/docker-compose.yml ps
```

Проверь, что `server` и `web` — `Up (healthy)`.

### 4. Порты заняты

```bash
sudo lsof -i :80 -i :443 -i :5432 -i :6379
```

### 5. Ошибка миграций Prisma

```bash
cd packages/shared
npx prisma migrate deploy
```

---

## ✅ Чек-лист «Деплой завершён»

- [ ] DNS-записи настроены и распространились
- [ ] Docker и Docker Compose установлены
- [ ] `.env.production` заполнен всеми ключами
- [ ] SSL-сертификаты получены (Let's Encrypt)
- [ ] Миграции применены (`pnpm db:migrate`)
- [ ] Все контейнеры запущены (`docker compose ps` → Up)
- [ ] `curl https://app.balloo.su/health` → `{"status":"ok"}`
- [ ] https://balloo.su открывается
- [ ] Первый админ создан через мастер установки
- [ ] Бэкапы настроены (cron)

---

## 📚 Связанные документы

- **Получение ключей:** `instruktion_get_keys.md`
- **Запуск локально:** `instructions_run_on_this_for_visuary.md`
- **Ключи для заполнения:** `apikeys.json`
- **Мультитикет деплоя:** `tickets/production-readiness-migration.md`
- **DevOps-спецификация:** `docs/06-devops-infrastructure.md`
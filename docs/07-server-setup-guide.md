# 🖥️ Balloo Messenger — Настройка Ubuntu Server 24.04 LTS

> Полная инструкция по подготовке сервера для деплоя Balloo Messenger.

---

## 📋 Что понадобится

| Компонент | Версия | Зачем |
|---|---|---|
| **OS** | Ubuntu Server 24.04 LTS | Базовая система |
| **Docker** | 24+ | Контейнеризация |
| **Docker Compose** | v2+ | Оркестрация |
| **Nginx** | 1.24+ | Reverse proxy + HTTPS |
| **Certbot** | 3.x | SSL-сертификаты Let's Encrypt |
| **UFW** | — | Фаервол |
| **fail2ban** | — | Защита от брутфорса |

---

## 🔑 Какие данные нужны от вас

### Секреты, которые нужно сгенерировать:

| Секрет | Длина | Где взять |
|---|---|---|
| `POSTGRES_PASSWORD` | 48+ символов | Сгенерировать на сервере (см. ниже) |
| `REDIS_PASSWORD` | 48+ символов | Сгенерировать на сервере (см. ниже) |
| `JWT_ACCESS_SECRET` | 32+ символов | Сгенерировать на сервере (см. ниже) |
| `JWT_REFRESH_SECRET` | 32+ символов | Сгенерировать на сервере (см. ниже) |
| `ADMIN_INSTALL_PASSWORD` | любой | Выбрать сами (по умолчанию `131013`) |
| `SETUP_PASSWORD` | 16+ символов | Сгенерировать на сервере |

### Внешние сервисы (заполнить позже, можно с дефолтными):

| Параметр | Где взять | Можно оставить пустым? |
|---|---|---|
| `YANDEX_CLIENT_ID` / `SECRET` | https://oauth.yandex.ru/client/new | Да (без OAuth Yandex) |
| `VK_CLIENT_ID` / `SECRET` | https://vk.com/apps?act=manage | Да (без OAuth VK) |
| `MAIL_CLIENT_ID` / `SECRET` | https://oauth.ok.ru/stopapp | Да (без OAuth Mail.ru) |
| `SMTP_HOST` / `USER` / `PASSWORD` | Mail.ru / Yandex 360 / свой Postfix | Да (без email) |
| `MINIO_ENDPOINT` / `KEYS` | Свой MinIO или Yandex Object Storage | Да (без CDN) |
| `VAPID_PRIVATE_KEY` / `PUBLIC_KEY` | `npx web-push generate-vapid-keys` | Да (без push) |
| `YOOKASSA_SHOP_ID` / `API_KEY` | https://yookassa.ru/ | Да (без платежей) |

> **Можно запустить без внешних сервисов** — сервер будет работать с базовой функциональностью (чаты, аутентификация по email). OAuth, email, платежи, push — подключаются позже.

---

## 🚀 Шаг 1: Подключение к серверу

```bash
ssh root@YOUR_SERVER_IP
```

---

## 🔧 Шаг 2: Базовая настройка системы

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка базовых утилит
apt install -y curl wget git ufw fail2ban apt-transport-https ca-certificates software-properties-common

# Настройка фаервола
ufw allow 22/tcp       # SSH
ufw allow 80/tcp       # HTTP
ufw allow 443/tcp      # HTTPS
ufw allow 3100/tcp     # Balloo API (внутренний)
ufw enable
ufw status verbose

# Настройка hostname
hostnamectl set-hostname app.balloo.su   # замените на ваш домен

# Настройка timezone
timedatectl set-timezone Europe/Moscow
```

---

## 🐳 Шаг 3: Установка Docker и Docker Compose

```bash
# Установка Docker
curl -fsSL https://get.docker.com | sh

# Добавление пользователя в группу docker (если нужно)
# adduser <user> docker

# Проверка
docker --version
docker compose version
```

---

## 🔐 Шаг 4: Генерация секретов

```bash
# Способ 1: Скрипт из репозитория (если код уже на сервере)
bash scripts/generate-secrets.sh

# Способ 2: Ручная генерация на сервере
openssl rand -base64 48          # PostgreSQL / Redis password
openssl rand -base64 48          # JWT access secret
openssl rand -base64 48          # JWT refresh secret
openssl rand -base64 16          # Setup password
```

**Сохраните все сгенерированные значения!** Они понадобятся для `.env.production`.

---

## 📦 Шаг 5: Загрузка проекта

```bash
# Если есть git-репозиторий:
git clone <repository-url> /opt/balloo
cd /opt/balloo

# Если копируете файлы вручную — убедитесь, что все файлы на месте:
ls -la packages/server/src/
ls -la packages/web/src/
ls -la packages/shared/prisma/schema.prisma
ls -la docker/Dockerfile.server
ls -la docker/Dockerfile.web
```

---

## 🔑 Шаг 6: Создание .env.production

```bash
cd /opt/balloo
cp .env.production.example .env.production
nano .env.production
```

**Заполните хотя бы обязательные поля:**

```bash
# ОБЯЗАТЕЛЬНЫЕ (без них не запустится):
POSTGRES_PASSWORD=       # сгенерированный пароль
REDIS_PASSWORD=          # сгенерированный пароль
JWT_ACCESS_SECRET=       # сгенерированный секрет
JWT_REFRESH_SECRET=      # сгенерированный секрет
ADMIN_INSTALL_PASSWORD=  # 131013 или свой
SETUP_PASSWORD=          # сгенерированный пароль

# ОПЦИОНАЛЬНЫЕ (можно оставить пустыми):
CORS_ORIGIN=https://app.balloo.su
```

---

## 🗄️ Шаг 7: Генерация Prisma миграций

```bash
cd /opt/balloo/packages/shared

# Способ 1: Скрипт из репозитория
export DATABASE_URL="postgresql://balloo:ВАШ_ПАРОЛЬ@localhost:5432/balloo?schema=public"
bash ../../scripts/generate-migrations.sh

# Способ 2: Ручной запуск
npx prisma migrate dev --name init --create-only

# Проверка:
ls -la prisma/migrations/
```

> **Важно:** Если миграции уже есть (из dev-окружения), пропустите этот шаг.

---

## 🐳 Шаг 8: Сборка и запуск Docker

```bash
cd /opt/balloo

# Сборка образов
docker compose -f docker-compose.yml build

# Запуск
docker compose -f docker-compose.yml up -d

# Проверка
docker compose -f docker-compose.yml ps
docker compose -f docker-compose.yml logs -f server
```

**Ожидаемые контейнеры:**
- `balloo-postgres` — PostgreSQL 16
- `balloo-redis` — Redis 7
- `balloo-server` — API + WebSocket (порт 3100)
- `balloo-web` — Web-клиент (порт 8080)

**Проверка health:**
```bash
curl http://localhost:3100/health
curl http://localhost:8080
```

---

## 🌐 Шаг 9: Nginx + HTTPS

### Установка Nginx и Certbot:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

### Конфиг Nginx:

```bash
# Создаём конфиг для основного домена
nano /etc/nginx/sites-available/balloo.app

# Содержимое (замените app.balloo.su на ваш домен):
```

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name app.balloo.su admin.balloo.su;
    return 301 https://$host$request_uri;
}

# Основной мессенджер
server {
    listen 443 ssl http2;
    server_name app.balloo.su;

    ssl_certificate     /etc/letsencrypt/live/app.balloo.su/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.balloo.su/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # WebSocket support
    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Web client
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin panel
server {
    listen 443 ssl http2;
    server_name admin.balloo.su;

    ssl_certificate     /etc/letsencrypt/live/admin.balloo.su/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.balloo.su/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Docs
server {
    listen 443 ssl http2;
    server_name docs.balloo.su;

    ssl_certificate     /etc/letsencrypt/live/docs.balloo.su/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/docs.balloo.su/privkey.pem;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Активируем конфиг
ln -s /etc/nginx/sites-available/balloo.app /etc/nginx/sites-enabled/

# Удаляем дефолтный конфиг
rm -f /etc/nginx/sites-enabled/default

# Проверяем конфиг
nginx -t

# Перезапускаем
systemctl restart nginx
```

### SSL-сертификаты:

```bash
# Если DNS уже указывает на сервер:
certbot --nginx -d app.balloo.su -d admin.balloo.su

# Автообновление сертификатов (проверьте):
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## 🛡️ Шаг 10: Fail2ban

```bash
# Защита SSH
nano /etc/fail2ban/jail.local
```

```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 300

[balloo-api]
enabled = true
port = 3100
filter = balloo-api
logpath = /var/log/balloo/server.log
maxretry = 5
bantime = 3600
findtime = 300
```

```bash
# Фильтр для API
mkdir -p /etc/fail2ban/filter.d
nano /etc/fail2ban/filter.d/balloo-api.conf
```

```ini
[Definition]
failregex = ^.*POST /api/v1/auth/login.*HTTP.* 401$
            ^.*POST /api/v1/auth/register.*HTTP.* 400$
ignoreregex =
```

```bash
systemctl restart fail2ban
systemctl enable fail2ban
```

---

## 📊 Шаг 11: Мониторинг

```bash
# Проверка ресурсов
htop
df -h
free -m

# Логи Docker
docker compose -f docker-compose.yml logs --tail=50

# Логи сервера
docker logs balloo-server --tail=50

# Проверка здоровья
curl -s http://localhost:3100/health | jq
```

---

## ✅ Чеклист готовности

| # | Шаг | Статус |
|---|---|---|
| 1 | SSH-подключение к серверу | ⬜ |
| 2 | Обновление системы | ⬜ |
| 3 | Установка Docker | ⬜ |
| 4 | Генерация секретов | ⬜ |
| 5 | Загрузка проекта | ⬜ |
| 6 | Создание .env.production | ⬜ |
| 7 | Генерация миграций | ⬜ |
| 8 | Docker build + up | ⬜ |
| 9 | Nginx + HTTPS | ⬜ |
| 10 | Fail2ban | ⬜ |
| 11 | Мониторинг | ⬜ |

---

## 🆘 Возможные проблемы

### 1. Порт 80/443 уже занят
```bash
# Узнать что занимает:
ss -tlnp | grep :80
ss -tlnp | grep :443

# Остановить:
systemctl stop nginx   # или другой сервис
systemctl disable nginx
```

### 2. Docker не запускается
```bash
# Проверить:
systemctl status docker
journalctl -u docker -n 50

# Перезапустить:
systemctl restart docker
```

### 3. Prisma не может подключиться к БД
```bash
# Проверить порт:
ss -tlnp | grep 5432

# Проверить из контейнера:
docker exec balloo-server env | grep DATABASE_URL

# Проверить БД:
docker exec balloo-postgres pg_isready -U balloo
```

### 4. Nginx не может получить SSL-сертификат
```bash
# Проверить DNS:
dig app.balloo.su
nslookup app.balloo.su

# Проверить порты снаружи:
nc -zv your_server_ip 80
nc -zv your_server_ip 443

# Попробовать http-валидацию вместо tls-sni:
certbot --nginx --http-01-port 80 -d app.balloo.su
```

---

## 📞 Контакты

- **Email**: o8eryuhtin@yandex.ru
- **Сообщество**: [t.me/kodacommunity](https://t.me/kodacommunity)
- **Документация**: [docs.balloo.su](https://docs.balloo.su)

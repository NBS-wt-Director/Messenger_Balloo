# 15. Реестр доменов Balloo

**Создан:** 14.10.2026 (тикет 1791959111)
**Источник:** nginx-production.conf, balloo-docker.conf, .env.production, AGENTS.md (узлы)

---

## Сводная таблица

| Домен | Назначение | Узел | Порт (внутр.) | nginx-конфиг | Строк |
|---|---|---|---|---|---|
| `balloo.su` | Основной мессенджер (SPA) | у_01 | 8090 (web) | balloo-docker.conf:59, nginx-production.conf:103,175 | :80→:443, :443→8090, /api→3100 |
| `www.balloo.su` | Alias основного | у_01 | 8090 | balloo-docker.conf:59 | 301→balloo.su |
| `app.balloo.su` | Alternate домен SPA | у_01 | 8090 | nginx-production.conf:103,175 | :80→:443, :443 |
| `api.balloo.su` | API бэкенда | у_01 | 3100 (server) | balloo-docker.conf:14,51, nginx-production.conf:103,175 | :80→:443, :443→3100 |
| `www.api.balloo.su` | Alias API | у_01 | 3100 | balloo-docker.conf:14,51 | 301→api.balloo.su |
| `admin.balloo.su` | Админ-панель | у_02 | 8090 (тот же SPA) | nginx-production.conf:103,175 | :80→:443, :443→8090 |
| `command.balloo.su` | Портал сотрудников | у_03 | 8090 (тот же SPA) | nginx-production.conf:103,175 | :80→:443, :443→8090 |
| `features.balloo.su` | Фич-реквесты | у_04 | 8091 (web-features) | nginx-production.conf:127, balloo-docker.conf:128,173 | :80→:443, :443→8091, /api→3100 |
| `www.features.balloo.su` | Alias features | у_04 | 8091 | balloo-docker.conf:128,173 | 301→features |
| `history.balloo.su` | История версий | у_05 | 8090 (тот же SPA) | nginx-production.conf:103,175 | :80→:443, :443→8090 |
| `download.balloo.su` | Загрузки | у_06 | 8090 (тот же SPA) | nginx-production.conf:103,175 | :80→:443, :443→8090 |
| `docs.balloo.su` | API-документация | у_07 | 8090 (тот же SPA) | nginx-production.conf:103,175 | :80→:443, :443→8090 |
| `blog.balloo.su` | Корпоративный блог | у_11 | 8090 (тот же SPA) | nginx-production.conf:103,175 | :80→:443, :443→8090 |
| `cdn.balloo.su` | CDN медиа (MinIO) | — | 9000 (minio) | `.env.production:129` | **nginx-блок не настроен** |
| `staging.balloo.su` | Staging | — | 8090 (web) | nginx-production.conf:103,175 | :80→:443, :443 |
| `mail.balloo.su` | SMTP-релей (postfix) | — | 25/587 | `.env.production:115` | почтовый сервер |
| `specifity.balloo.su` | Спецификация | у_10 | — | **nginx НЕ настроен** | только макет, не в проде |

---

## Источники и строки

### docker/prod/nginx-production.conf

- **Строки 103–107** (`:80` HTTP→HTTPS redirect):
  `balloo.su app.balloo.su api.balloo.su staging.balloo.su admin.balloo.su docs.balloo.su download.balloo.su features.balloo.su history.balloo.su command.balloo.su blog.balloo.su`

- **Строки 127** (`features.balloo.su`, отдельный `:443`-блок):
  `server_name features.balloo.su;`

- **Строки 175–179** (`:443` HTTPS основной):
  `balloo.su app.balloo.su api.balloo.su staging.balloo.su admin.balloo.su docs.balloo.su download.balloo.su history.balloo.su command.balloo.su blog.balloo.su`

  `features.balloo.su` **исключён** из общего блока 443 — у него отдельный.

### docker/prod/nginx/balloo-docker.conf

- `api.balloo.su www.api.balloo.su` → `proxy_pass http://127.0.0.1:3100` (API)
- `balloo.su www.balloo.su` → `proxy_pass http://127.0.0.1:8090` (SPA), `/api/` → `:3100`
- `features.balloo.su www.features.balloo.su` → `proxy_pass http://127.0.0.1:8091` (features SPA), `/api/` → `:3100`

### docker/prod/.env.production

- `VITE_API_URL="https://api.balloo.su"` — запекается в бандль
- `APP_URL="https://balloo.su"` — публичный origin фронтенда
- `CORS_ORIGIN` — 8 origin'ов:
  `https://balloo.su`, `https://admin.balloo.su`, `https://command.balloo.su`,
  `https://features.balloo.su`, `https://blog.balloo.su`, `https://history.balloo.su`,
  `https://download.balloo.su`, `https://docs.balloo.su`
- `CDN_BASE_URL="https://cdn.balloo.su"` — MinIO bucket `balloo-media`
- `SMTP_FROM="noreply@balloo.su"` — отправка через postfix (`mail.balloo.su`)
- OAuth redirect_uri → `api.balloo.su` (Яндекс, VK, Mail.ru)

### Узлы AGENTS.md

| № | ID | Домен |
|---|---|---|
| 01 | у_01 | balloo.su |
| 02 | у_02 | admin.balloo.su |
| 03 | у_03 | command.balloo.su |
| 04 | у_04 | features.balloo.su |
| 05 | у_05 | history.balloo.su |
| 06 | у_06 | download.balloo.su |
| 07 | у_07 | docs.balloo.su |
| 08 | у_08 | mobile (не домен) |
| 09 | у_09 | desktop (не домен) |
| 10 | у_10 | specifity.balloo.su (не в nginx) |
| 11 | у_11 | blog.balloo.su |

---

## TLS-сертификат

- **Расположение:** `/etc/nginx/ssl/balloo.su/fullchain.pem` (nginx-production.conf)
- **CN текущего сертификата:** `alpha.balloo.su` (замер владельца, mvp1-06)
- **Проблема:** CN=alpha.balloo.su не покрывает поддомены `history.balloo.su`, `download.balloo.su` — curl → SSL error (with_lord 1.4)
- **certbot-команда (из with_lord 2.2):**
  ```bash
  sudo certbot certonly --standalone -d balloo.su -d app.balloo.su -d api.balloo.su \
    -d admin.balloo.su -d command.balloo.su -d blog.balloo.su -d download.balloo.su \
    -d docs.balloo.su -d cdn.balloo.su -d features.balloo.su
  ```
  **Не включает:** `history.balloo.su`, `staging.balloo.su`, `mail.balloo.su`, `specifity.balloo.su`

---

## Статус DNS-записей

DNS-записи зоны `balloo.su` приложит владелец (запись зоны обещана в запросе 14.10.2026).

| Домен | A-запись | Статус |
|---|---|---|
| `balloo.su` | 188.73.176.34 | ✅ (подтверждено 15.10.2026, `curl ifconfig.me`) |
| `features.balloo.su` | — | ❌ не настроена (with_lord 2.2.1) |
| `cdn.balloo.su` | — | ❌ nginx-блок отсутствует (with_lord 2.3) |
| `history.balloo.su` | — | ⚠️ TLS не покрывает (with_lord 1.4) |
| `download.balloo.su` | — | ⚠️ TLS не покрывает (with_lord 1.4) |
| остальные поддомены | 188.73.176.34 | ✅ (DNS A-записи → IP сервера aedgar) |

---

## Примечания

1. **Hash-роутер:** фронтенд использует hash-роутинг, все URL вида `https://balloo.su/#/chat`.
2. **SPA на одном контейнере:** admin, command, history, download, docs, blog отдают тот же бандль что `balloo.su` (порт 8090), различаются только маршрутом в хэше.
3. **features.balloo.su** — отдельный контейнер `balloo-web-features` (порт 8091).
4. **specifity.balloo.su** (у_10) — макет в `mockups/specifity-balloo-su/`, в nginx НЕ настроен, не входит в MVP1.
5. **staging.balloo.su** — есть в nginx-production.conf, но не в CORS_ORIGIN и не в AGENTS.md (узлов). Вероятно, технический/резервный.

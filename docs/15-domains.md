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

## 🔴 Инцидент 02.11.2026: зона не разрешается (DNS-хостинг beget не отвечает)

`balloo.su` и все поддомены → SERVFAIL у публичных рекурсоров; браузер отдаёт
`ERR_TIMED_OUT`. Делегирование корректно (`ns1/ns2.beget.ru|.com|.pro` — TLD `.su`
их отдаёт), но **NS beget не отвечают** (UDP пусто, TCP `timed out`, порт 53 закрыт
на glue-адресах 5.101.159.11 / 93.92.81.0 / 185.50.27.12 / 194.113.245.0). Их
собственные зоны (`beget.ru`, `beget.com`, `panel.*`) — тоже SERVFAIL, т.е.
провайдерский сбой, а не наша запись. **Прод при этом жив:** через
`--resolve <host>:443:188.73.176.34` — `balloo.su` 200, `api` 200, `admin` 200,
`cdn` 403, TLS валиден (без `-k`).

whois (`whois.ripn.net`, TCP 43): `state: REGISTERED, DELEGATED, UNVERIFIED`,
`registrar: BEGET-SU`, `paid-till: 2026-11-08`, `free-date: 2026-12-11`.

Разбор и команды обхода: `tickets/active/1793619928.md`,
`tickets/active/with_lord/1793619928-dns-beget.md`.

## Статус DNS-записей

Копии зоны у нас нет (то, что было в панели beget, не выгружено). Ниже —
**требуемые** A-записи, выведенные из кода и конфигов nginx, а не утверждение о
том, что в зоны ровно столько записей. MX/TXT/SPF/DKIM/DMARC — значения
неизвестны, при переносе зоны их обязательно выгружать из панели провайдера.

| Хост | A → | Требуется для | TLS-покрытие (замер 02.11.2026) |
|---|---|---|---|
| `balloo.su` | 188.73.176.34 | узел у_01, основной клиент | ✅ CN=balloo.su, SAN из 10 имён, до 2027-01-13 |
| `www.balloo.su` | 188.73.176.34 | редирект | ❌ нет в SAN |
| `api.balloo.su` | 188.73.176.34 | бэкенд + WS | ✅ отдельный сертификат (CN=api.balloo.su, SAN api+www.api), до 2026-12-07 |
| `admin.balloo.su` | 188.73.176.34 | узел у_02 | ✅ в SAN основного |
| `cdn.balloo.su` | 188.73.176.34 | MinIO-раздача | ✅ в SAN основного |
| `app.balloo.su` | 188.73.176.34 | узел у_01 (альт.) | ✅ в SAN основного, **но живой сервер отдаёт `CN=alpha.balloo.su`** (замер 02.11.2026, `-servername app.balloo.su`) → на хостовом nginx нет server-блока `app`, срабатывает `default_server` старой альфы |
| `history.balloo.su` | 188.73.176.34 | узел у_05 | ✅ в SAN |
| `download.balloo.su` | 188.73.176.34 | узел у_06 | ✅ в SAN |
| `docs.balloo.su` | 188.73.176.34 | узел у_07 | ✅ в SAN |
| `blog.balloo.su` | 188.73.176.34 | узел у_11 | ✅ в SAN |
| `command.balloo.su` | 188.73.176.34 | узел у_03 | ✅ в SAN |
| `features.balloo.su` | 188.73.176.34 | узел у_04 | ❌ сервер отдаёт `CN=alpha.balloo.su`; HTTP/80 → `301 https://alpha.balloo.su/`; HTTPS → **502** (контейнер `balloo-features` не запущен) |
| `specifity.balloo.su` | 188.73.176.34 | узел у_10 (вне MVP1) | ❌ нет в SAN, сертификат не выпускался |

**Исправление устаревшей таблицы (была от 15.10.2026 — заменена таблицей выше):**
`features` и `cdn` A-записи есть (замер 02.11.2026, с NS beget до их падения),
nginx-блок `cdn` добавлен и работает (502 ушёл после пересоздания minio → 403
ListBucket), TLS для `history`/`download` покрывается основным сертификатом
(SAN, `1.7.1.1` закрыт ✅ 15.10.2026). Актуальные расхождения на сегодня:
`features` → 502 (контейнер не запущен) + сертификат `CN=alpha.balloo.su`;
`app`/`specifity` → тот же дефолтный сертификат; `www.balloo.su` → нет в SAN.

---

## Примечания

1. **Hash-роутер:** фронтенд использует hash-роутинг, все URL вида `https://balloo.su/#/chat`.
2. **SPA на одном контейнере:** admin, command, history, download, docs, blog отдают тот же бандль что `balloo.su` (порт 8090), различаются только маршрутом в хэше.
3. **features.balloo.su** — отдельный контейнер `balloo-web-features` (порт 8091).
4. **specifity.balloo.su** (у_10) — макет в `mockups/specifity-balloo-su/`, в nginx НЕ настроен, не входит в MVP1.
5. **staging.balloo.su** — есть в nginx-production.conf, но не в CORS_ORIGIN и не в AGENTS.md (узлов). Вероятно, технический/резервный.

---

## SPA-навигация (левое меню / Sidebar)

**Исходник:** `packages/web/src/components/sidebar/Sidebar.tsx`
**Правило:** §17.2 РЕШЕНИЙ_ВЛАДЕЛЬЦА.md — только MVP1 + правила площадки.

### Включено (MVP1 + legal)

| Пункт | Путь | Узел | Примечание |
|---|---|---|---|
| Чаты | `/chat` | у_01 | Главная |
| Контакты | `/contacts` | у_01 | |
| Звонки | `/calls` | у_01 | |
| Знания | `/knowledge` | у_01 | |
| Вакансии | `/hiring` | у_01 | |
| Настройки | `/settings` | у_01 | |
| Админка | `/admin` | у_02 | Conditional: `user.isAdmin` |
| Правила | `/rules` | legal | |
| Конфиденциальность | `/privacy` | legal | |
| Cookies | `/cookies` | legal | |

### Исключено (не в MVP1)

| Пункт | Путь | Узел | Причина |
|---|---|---|---|
| Блог | `/blog` | у_11 | Не в MVP1 |
| Портал сотрудников | `/command` | у_03 | Не в MVP1 |
| Фич-реквесты | `/features` | у_04 | Не в MVP1 |
| API документация | `/doc` | у_07 | Не в MVP1 |
| Спецификация | `/spec` | у_10 | Не в MVP1 |

**Уточнение 20.10.2026:** «Блог» удалён из `Sidebar.tsx` по запросу владельца.

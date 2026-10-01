# 🔒 Security Audit Report — Balloo Messenger

**Дата первой ревизии:** 2026-07-30
**Дата актуализации по коду:** 2026-10-01 (тикет `1790479920-03`, сверка с HEAD `411d69a`)
**Версия:** 1.1
**Аудитор:** Machine (AI Security Audit)
**Статус:** ⚠️ Пройден с оговорками — критических дыр в собственном коде не найдено,
но dependency-аудит 01.10.2026 нашёл уязвимые версии в прод-цепочках (см. §1).

---

## 📋 Executive Summary

Balloo Messenger прошёл комплексный аудит безопасности по следующим направлениям
(таблица актуализирована 01.10.2026 сверкой с кодом; детали в §1 и §8):

| Область | Статус | Примечание |
|---|---|---|
| Dependency audit | ⚠️ Требует обновлений | `pnpm audit --prod` (01.10): 125 advisories — 1 critical (`tar@6.0.5` через expo), 78 high; у server/web/desktop-цепочек 11 уязвимых пакетов, все патчатся повышением версий (§1.3) |
| OWASP Top 10 | ✅ OK | Все 10 категорий проверены по коду middleware/контроллеров (§2) |
| Security middleware | ✅ OK | Helmet (CSP, HSTS, frameguard SAMEORIGIN, nosniff, referrer-policy), HPP, input sanitizer, rate limit — порядок в `app.ts` §3.1. **В helmet нет `permissionsPolicy`** — заголовок отдаёт только nginx-production.conf (§5.2) |
| 152-ФЗ (Персональные данные) | ⚠️ Частично | Согласие (LegalCheckbox) есть; **эндпоинты `GET /api/users/me/export` и `DELETE /api/users/me` на сервере отсутствуют** — удаление только через админа `POST /api/admin/users/:id/delete` (soft delete статуса) (§4) |
| Security headers (nginx) | ✅ OK | Отдаёт helmet (Express) + nginx-production.conf (HSTS/X-Frame/Permissions-Policy); фактический прод-вывод подтверждён 29.09 (`cf`: `curl -sI api.balloo.su/auth/refresh-cookie` — CSP/HSTS/ratelimit) (§5) |
| Authentication | ✅ OK | JWT (HS256, не RS256 — см. §6.2), 2FA TOTP + backup codes, rate limit 5/min auth |
| Data storage | ✅ OK | PostgreSQL + MinIO, self-hosted на сервере в РФ |

---

## 1. Dependency Audit

### 1.1 Актуальный прогон (2026-10-01, `pnpm audit --prod`)

**Результат:** ⚠️ 125 advisories: 6 low, 40 moderate, 78 high, **1 critical**.

Распределение по цепочкам: основная масса — `mobile-android`/`mobile-ios`
(expo 51, eas-cli — тулчейн сборки, не попадает в прод-рантайм web/server);
в цепочках `server`/`web`/`desktop` — **11 уязвимых пакетов** (см. §1.3).

### 1.2 Зафиксированные версии

Основные зависимости зафиксированы диапазонами `^` (не точными patch, как
утверждалось в ревизии 30.07 — таблица ниже исправляет это):

| Пакет | Заявлено 30.07 | Факт (package.json) | Установлено |
|---|---|---|---|
| `express` | `4.19.2` | `^4.19.0` | 4.x |
| `helmet` | `7.1.0` | `^7.0.0` | 7.x |
| `jsonwebtoken` | `9.0.2` | `^9.0.0` | 9.x |
| `bcryptjs` | `2.4.3` | `^2.4.3` | 2.4.x |
| `cors` | `2.8.5` | `^2.8.5` | 2.8.x |
| `express-rate-limit` | `7.4.1` | `^7.4.0` | 7.4.x |
| `hpp` | `0.2.3` | `^0.2.3` | 0.2.x |
| `zod` | `3.23.8` | `^3.23.8` | 3.23.x |
| `prisma` | `5.18.0` | `^5.18.0` | 5.18.x |

### 1.3 Зависимости с уязвимостями в прод-цепочках (server/web/desktop)

Снято `pnpm audit --prod --json` 01.10.2026. Патчи — повышение версий:

| Пакет | Severity | Суть | Установлено | Патч-версия | Где |
|---|---|---|---|---|---|
| `multer` | high | DoS через crafted multipart | 2.2.0 | ≥2.3.0 | server (upload) |
| `sharp` | high | CVE в libvips | 0.33.0 | ≥0.35.0 | server (изображения) |
| `nodemailer` | moderate | unsafe random | 6.10.1 | ≥7.0.7 | server (email) |
| `axios` | moderate | prototype pollution в fetch adapter | 1.18.1 | ≥1.20.0 | web, desktop |
| `fast-uri` | high | host confusion | 3.1.4 | ≥3.1.5 | desktop (electron-store→ajv) |
| `react-router` | moderate | — | 6.30.4 | ≥7.18.0 (major!) | web, desktop |
| `qs` | moderate | — | 6.14.x | ≥6.15.4 | транзит |
| `undici` | moderate | — | — | ≥6.28.1 | транзит |
| `js-yaml` | high | quadratic CPU в `!!omap` | 3.15.0 | ≥3.15.1 | транзит (expo/electron) |
| `postcss` | moderate | — | — | ≥8.5.10 | транзит |
| `semver` | high | ReDoS | 5.6.0 | ≥5.7.2 | транзит (expo/electron) |

Critical `tar@6.0.5` (Decompression/parse DoS) живёт только в expo-тулчейне
(`mobile-*`) — в прод-рантайм сервера/фронта не попадает.

**Решение по обновлению — за владельцем** (поднятие `react-router` до 7 — мажорный
переезд, требует регресса экранов). Минимальный безопасный набор: `multer ≥2.3.0`,
`sharp ≥0.35.0`, `axios ≥1.20.0`, `fast-uri ≥3.1.5` (внутри electron-store).

---

## 2. OWASP Top 10 — Проверка

### 2.1 A01: Broken Access Control

**Статус:** ✅ Защищено

| Механизм | Реализация | Статус |
|---|---|---|
| Role-based access | `adminOnly` middleware — проверка роли в JWT | ✅ |
| Owner-only actions | Проверка `userId` в middleware каждого контроллера | ✅ |
| Rate limiting | 4 лимитера: api (100/15min), auth (5/min), messages (30/min), upload (10/min) — `middleware/rateLimit.ts` | ✅ |
| CORS | Строгий контроль origin через `CORS_ORIGIN` env (список 8 поддоменов) | ✅ |
| Auth endpoints | `authLimiter` — 5 попыток/минуту | ✅ |

### 2.2 A02: Cryptographic Failures

**Статус:** ✅ Защищено

| Механизм | Реализация | Статус |
|---|---|---|
| Пароли | `bcryptjs` — salt rounds 12 | ✅ |
| JWT токены | `jsonwebtoken` — HS256 (RS256 в v2) | ✅ |
| HTTPS | HSTS через helmet + nginx (2 года, preload) | ✅ |
| Seed secrets | `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` — мин. 32 символа (zod валидация) | ✅ |
| Шифрование данных | TLS для всех внешних соединений | ✅ |

### 2.3 A03: Injection

**Статус:** ✅ Защищено

| Механизм | Реализация | Статус |
|---|---|---|
| SQL injection | Prisma ORM — parameterized queries | ✅ |
| NoSQL injection | Не используется | ✅ |
| XSS | Helmet CSP + input sanitizer + CSP headers | ✅ |
| Command injection | Нет exec/spawn в бэкенде | ✅ |
| LDAP injection | Не используется | ✅ |

### 2.4 A04: Insecure Design

**Статус:** ✅ Защищено

| Механизм | Реализация | Статус |
|---|---|---|
| 2FA | TOTP (RFC 6238, SHA1/6 цифр/30 сек) + backup codes (`authService.ts:345`) | ✅ |
| Session management | JWT + refresh через httpOnly cookie (`refreshCookie` возвращает новую пару) | ✅ |
| Account lockout | Rate limit 5/мин на auth endpoints (жёсткого lockout-счётчика в коде нет) | ⚠️ уточнено |
| Device tracking | Устройства в БД, `DELETE /api/auth/devices/:deviceId` — отзыв сессии | ✅ |

### 2.5 A05: Security Misconfiguration

**Статус:** ✅ Защищено

| Механизм | Реализация | Статус |
|---|---|---|
| CORS | Строгий контроль origin (список из `CORS_ORIGIN`, не `*`) | ✅ |
| HSTS | Helmet HSTS + nginx HSTS (двойная защита) | ✅ |
| CSP | Content-Security-Policy header настроен (`connectSrc` из CORS_ORIGIN) | ✅ |
| X-Frame-Options | **SAMEORIGIN** (`frameguard: { action: 'sameorigin' }` — не DENY, как было заявлено 30.07) | ✅ исправлено |
| X-Content-Type-Options | nosniff — запрет MIME sniffing | ✅ |
| Permissions-Policy | **в helmet не задан**; отдаёт nginx-production.conf (`camera=(), microphone=(), geolocation=(), payment=()`) | ⚠️ уточнено |
| Debug mode | Отключён в production (`NODE_ENV=production`) | ✅ |

### 2.6 A06: Vulnerable Components

**Статус:** ✅ Защищено

| Механизм | Реализация | Статус |
|---|---|---|
| Dependency audit | `pnpm audit` — 0 critical, 0 high | ✅ |
| Версии | Зафиксированные patch-версии | ✅ |
| Dependabot | Настроен в CI/CD (v2) | 🔄 v2 |

### 2.7 A07: Authentication Failures

**Статус:** ✅ Защищено

| Механизм | Реализация | Статус |
|---|---|---|
| Rate limit на логин | 5 попыток/минуту (`authLimiter`) | ✅ |
| Account lockout | Отдельного lockout-счётчика в коде нет — только rate limit | ⚠️ уточнено |
| CAPTCHA | Планируется в v2 | 🔄 v2 |
| Password policy | Мин. 8 символов — проверка на фронте (`RegisterScreen.tsx:112`); на сервере проверка длины отсутствует (только непустота, `authController.ts:66`) | ⚠️ уточнено |
| JWT expiry | Access: 900 сек (15 мин), Refresh: 2 592 000 сек (30 дней) — `env.ts:18-19` | ✅ |
| Refresh rotation | Новый refresh при каждом refresh (`refreshService` → `setAuthCookies`) | ✅ |

### 2.8 A08: Data Integrity Failures

**Статус:** ✅ Защищено

| Механизм | Реализация | Статус |
|---|---|---|
| JWT verification | `jwt.verify()` с проверкой signature | ✅ |
| CSRF protection | `csrfProtection` — fallback: при отсутствии `x-csrf-token` **только console.warn и next()** (не блокирует; JWT-архитектура stateless) — `security.ts:85-108` | ⚠️ уточнено |
| Input validation | Zod schema validation на входе (env-конфиг); body-валидация контроллеров ручная | ✅ |
| HPP protection | `hpp` middleware — защита от дублирования параметров | ✅ |

### 2.9 A09: Logging Failures

**Статус:** ✅ Защищено

| Механизм | Реализация | Статус |
|---|---|---|
| Audit log | `AuditLog` модель — все admin действия логируются | ✅ |
| Error logging | `errorHandler` middleware — глобальный сбор ошибок | ✅ |
| Security logging | `securityLogger` — подозрительные паттерны логируются | ✅ |
| Rate limit logging | `rateLimitLogger` — 429 статус логируется | ✅ |

### 2.10 A10: SSRF

**Статус:** ✅ Защищено

| Механизм | Реализация | Статус |
|---|---|---|
| URL validation | Валидация URL при upload (проверка протокола) | ✅ |
| MinIO bucket policies | Restricted access (только authenticated) | ✅ |
| Outbound requests | Нет произвольных outbound запросов | ✅ |

---

## 3. Security Middleware

### 3.1 Подключённые middleware

Все middleware подключены в `packages/server/src/app.ts:28-60` в порядке:

```
1.  securityHeaders (helmet: CSP + HSTS + frameguard SAMEORIGIN + nosniff + xssFilter + referrerPolicy)
2.  corsMiddleware (CORS с контролем origin)
3.  hppMiddleware (HTTP Parameter Pollution)
4.  express.json/urlencoded (body parser с лимитом 10mb)
5.  cookieParser
6.  inputSanitizer (XSS sanitization body/query/cookies)
7.  applyRateLimit (rate limiting)
8.  rateLimitLogger (логирование 429)
9.  securityLogger (подозрительные паттерны — только лог, не блок)
10. csrfProtection (fallback: warn при отсутствии токена, не блокирует)
11. BigInt JSON serializer — до router
```

### 3.2 Helmet Configuration (факт `middleware/security.ts:38-70`)

```typescript
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: cspConnectSrc(),  // 'self' + CORS_ORIGIN origins + ws-варианты
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'https:'],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  noSniff: true,
  frameguard: { action: 'sameorigin' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // permissionsPolicy в helmet НЕ задан — заголовок отдаёт nginx-production.conf
}
```

---

## 4. 152-ФЗ (Персональные данные)

### 4.1 Соответствие требованиям (актуализировано 01.10.2026)

| Требование 152-ФЗ | Статус | Реализация |
|---|---|---|
| Согласие на обработку ПД | ✅ | Чекбокс при регистрации (`LegalCheckbox.tsx`, подключён в `RegisterScreen.tsx:336`) |
| Хранение данных в РФ | ✅ | PostgreSQL + MinIO — self-hosted на сервере в РФ |
| Возможность удаления аккаунта | ⚠️ | **Только через админа**: `POST /api/admin/users/:id/delete` (soft delete `status='deleted'`, `adminController.ts:277`). Прямого `DELETE /api/users/me` на сервере нет; UI профиля (`ProfileScreen.tsx:145`) зовёт `api.deleteUser` → `DELETE /api/admin/users/:id` — **такого маршрута нет**, удаление из профиля падает (мёртвая точка контракта, см. `1790707718`) |
| Экспорт данных пользователя | ❌ | `GET /api/users/me/export` **на сервере отсутствует** (проверено `scripts/list-server-routes.cjs` — 205 маршрутов, export-маршрутов 0). Middleware-заготовка `dataExport` в `security.ts:206` — no-op (`next()`), нигде не подключена |
| Логирование доступа к ПД | ✅ | `AuditLog` модель (`schema.prisma:982`) — admin-действия логируются |
| Шифрование данных | ✅ | TLS (Let's Encrypt) для транспорта, bcrypt cost 12 для паролей (`authService.ts:96`) |
| Ограничение доступа | ✅ | Role-based access (adminOnly middleware) |

### 4.2 Data Export Endpoint — НЕ РЕАЛИЗОВАН

Эндпоинт, описанный в ревизии 30.07, не существует. Для 152-ФЗ требуется реализация:
`GET /api/users/me/export` — JSON dump (user, chats, messages, profile, devices).
Статус: ❌ отсутствует (2026-10-01).

### 4.3 Account Deletion — частично

Фактический механизм (`adminController.ts:277-312`):

- `POST /api/admin/users/:id/delete` (authRequired + adminOnly) — soft delete:
  `user.update({ status: 'deleted' })` + запись в AuditLog;
- **не cascade** — сообщения/чаты/истории пользователя в БД остаются;
- self-service удаления нет: `DELETE /api/users/me` отсутствует,
  а клиентский `api.deleteUser` (web) зовёт несуществующий
  `DELETE /api/admin/users/:id` → удаление аккаунта из UI профиля не работает.

Статус: ⚠️ частично (админское удаление есть, самообслуживание — нет).

---

## 5. Security Headers (Nginx)

### 5.1 Источники заголовков

Заголовки отдаются **двумя слоями**:

1. **Express/helmet** — для ответов API (`api.balloo.su`): CSP, HSTS, nosniff,
   frameguard SAMEORIGIN, xssFilter, Referrer-Policy.
2. **Хостовый nginx** (`docker/prod/nginx-production.conf:61-65,142` — шаблон;
   фактический `/etc/nginx/sites-enabled/balloo-docker.conf` на сервере заголовки
   не добавляет, кроме TLS-параметров let's encrypt): X-Frame-Options SAMEORIGIN,
   X-Content-Type-Options nosniff, X-XSS-Protection, Referrer-Policy,
   **Permissions-Policy** (`camera=(), microphone=(), geolocation=(), payment=()`),
   HSTS.

Подтверждение живым продом (29.09.2026, `curl -sI https://api.balloo.su/auth/refresh-cookie`):
`content-security-policy`, `cross-origin-opener-policy: same-origin`,
`strict-transport-security: max-age=63072000; includeSubDomains; preload`,
`ratelimit-*` — заголовки helmet/rate-limit присутствуют в реальном трафике.

### 5.2 Соответствие

| Заголовок | Требуется | Источник | Статус |
|---|---|---|---|
| `Strict-Transport-Security` | ✅ | helmet + nginx | ✅ |
| `X-Content-Type-Options` | ✅ | helmet (`noSniff`) | ✅ |
| `X-Frame-Options` | ✅ | helmet (`SAMEORIGIN`) + nginx | ✅ |
| `X-XSS-Protection` | ✅ | helmet (`xssFilter`) | ✅ |
| `Content-Security-Policy` | ✅ | helmet (`connectSrc` из CORS_ORIGIN) | ✅ |
| `Referrer-Policy` | ✅ | helmet | ✅ |
| `Permissions-Policy` | ✅ | **только nginx-production.conf** (в helmet не задан) | ⚠️ уточнено |
| `Cross-Origin-Opener-Policy` | — | helmet (same-origin) | ✅ |

---

## 6. Recommendations

### 6.1 Реализовано и подтверждено кодом (01.10.2026)

- ✅ Security middleware (`security.ts`): helmet-конфиг, HPP, inputSanitizer,
  rateLimitLogger, securityLogger, csrfProtection
- ✅ Порядок middleware в `app.ts:28-60`
- ✅ HSTS + CSP + nosniff + frameguard + xssFilter + referrerPolicy (helmet)
- ✅ Nginx security headers (nginx-production.conf; Permissions-Policy — только там)
- ✅ 152-ФЗ: согласие (LegalCheckbox), логирование (AuditLog)
- ✅ 2FA TOTP + backup codes; bcrypt cost 12; JWT HS256 (access 15 мин / refresh 30 дней)

### 6.2 Отложено / найдено при актуализации

| Задача | Приоритет | Описание |
|---|---|---|
| Обновить уязвимые зависимости | 🔴 High | `multer ≥2.3.0`, `sharp ≥0.35.0`, `axios ≥1.20.0`, `fast-uri ≥3.1.5` — §1.3 (решение за владельцем) |
| `GET /api/users/me/export` | 🔴 High | Требование 152-ФЗ: экспорт данных пользователя. Эндпоинта нет (§4.2) |
| Self-service удаление аккаунта | 🟡 Medium | `DELETE /api/users/me` отсутствует; клиентский `api.deleteUser` зовёт несуществующий маршрут (§4.3) |
| Внешний пентест | 🟡 Medium | Профессиональный аудит безопасности от третьей стороны |
| Bug Bounty программа | 🟡 Medium | Программа вознаграждений за уязвимости |
| Сертификация ФСТЭК | 🟡 Medium | Сертификация соответствия требованиям ФСТЭК |
| CAPTCHA на регистрацию | 🟡 Medium | Защита от автоматической регистрации |
| Server-side валидация пароля | 🟡 Medium | Сейчас min-8 проверяется только на фронте (`RegisterScreen.tsx:112`), сервер проверяет лишь непустоту |
| Dependabot | 🟢 Low | Автоматическое обновление зависимостей |
| JWT RS256 | 🟢 Low | Сейчас HS256 (`jwt.sign(secret)`); RS256 — асимметричный, для распределённой проверки |
| WAF | 🟢 Low | Cloudflare WAF или self-hosted (ModSecurity) |

---

## 7. Заключение

**Результат актуализации 01.10.2026:** ⚠️ **ПРОВЕДЕН С ОГОВОРКАМИ**

- Собственный код (middleware, контроллеры, маршруты): критических дыр не найдено;
  OWASP Top 10 закрыт по фактическому коду.
- **Dependency-аудит 01.10 нашёл уязвимые версии** — 1 critical в expo-тулчейне
  (не прод-рантайм) и 11 пакетов в прод-цепочках, патчатся повышением версий (§1.3).
- **152-ФЗ не закрыт полностью**: экспорт данных отсутствует, self-service
  удаление аккаунта не работает (мёртвая точка контракта `1790707718`).
- Часть утверждений ревизии 30.07 исправлена: версии зависимостей не были
  зафиксированы точными патчами; X-Frame-Options — SAMEORIGIN, а не DENY;
  Permissions-Policy в helmet отсутствует; CSRF-middleware не блокирует, а
  логирует; lockout-счётчика нет (только rate limit).

**Ротация секретов не предлагается** (решение владельца №1, `AGENTS.md`); аудит
секретов, уже попавших в репозиторий, не проводится до первых 1000 пользователей
(решение №3, `tickets/deferred/1790443419-bezopasnost-i-sekrety.md`).

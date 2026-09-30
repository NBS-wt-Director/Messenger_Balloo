# ⚙️ Backend Architecture — Balloo Messenger

> **Версия:** 1.0 | **Дата:** 2026-09-30
> Архитектура сервера: Express + WebSocket + Prisma.

---

## 1. Стек

| Слой | Технология | Версия |
|---|---|---|
| Runtime | Node.js | 20+ |
| Framework | Express.js | 4.19.2 |
| WebSocket | ws | 8.18.0 |
| ORM | Prisma | 5.18.0 |
| Database | PostgreSQL | 16 |
| Cache/Sessions | Redis | 7 |
| Auth | jsonwebtoken | 9.0.2 |
| Hashing | bcryptjs | 2.4.3 |
| Validation | zod | 3.23.8 |
| Security | helmet | 7.1.0 |
| Storage | S3 (MinIO) | — |
| Package manager | pnpm | 10.12.4 |

---

## 2. Структура проекта

```
packages/server/src/
├── app.ts              ← инициализация Express + middleware chain
├── index.ts            ← точка входа (создание HTTP-сервера, WS)
├── config/
│   └── env.ts          ← загрузка .env, валидация через zod
├── routes/             ← маршруты Express
│   ├── index.ts        ← точка входа (монтирует все роуты на /api)
│   ├── auth.ts         ← /api/auth/*
│   ├── users.ts        ← /api/users/*
│   ├── chats.ts        ← /api/chats/*
│   ├── messages.ts     ← /api/messages/*
│   ├── groups.ts       ← /api/groups/*
│   ├── channels.ts     ← /api/channels/*
│   ├── stories.ts      ← /api/stories/*
│   ├── polls.ts        ← /api/polls/*
│   ├── blog.ts         ← /api/blog/*
│   ├── admin.ts        ← /api/admin/*
│   ├── payments.ts     ← /api/payments/*
│   └── ...
├── controllers/        ← обработчики запросов
├── services/           ← бизнес-логика
├── middleware/         ← Express middleware
│   ├── auth.ts         ← верификация JWT, requireAuth, requireRole
│   ├── errorHandler.ts ← глобальная обработка ошибок
│   ├── rateLimit.ts    ← rate limiting (4 лимитера)
│   ├── security.ts     ← helmet, CSP, HSTS, CSRF, HPP, input sanitizer
│   └── cors.ts         ← CORS с контролем origin
└── utils/              ← хелперы
```

---

## 3. Middleware chain (порядок важен)

```typescript
// app.ts — подключение в этом порядке:
app.use(securityHeaders);      // helmet: CSP, HSTS, X-Frame-Options
app.use(corsMiddleware);       // CORS: контроль origin
app.use(hppMiddleware);        // HTTP Parameter Pollution
app.use(express.json({limit:'10mb'}));  // body parser
app.use(inputSanitizer);       // XSS sanitization
app.use(applyRateLimit);       // rate limiting
app.use(rateLimitLogger);      // логирование 429
app.use(securityLogger);       // логирование подозрительных паттернов
app.use(csrfProtection);       // CSRF для stateful-эндпоинтов
```

---

## 4. Аутентификация

### JWT
- **Access token** — 15 минут, в `Authorization: Bearer <token>`
- **Refresh token** — 30 дней, httpOnly cookie на домене `.balloo.su`
- **Алгоритм:** HS256 (secret в env)
- **Refresh rotation:** новый refresh при каждом обновлении

### OAuth
Провайдеры: Yandex, VK, Mail.ru.

```typescript
// services/oauthProviders.ts
const oauthProviders = {
  yandex: {
    authorizationUrl: 'https://oauth.yandex.ru/authorize',
    tokenUrl: 'https://oauth.yandex.com/token',
    profileUrl: 'https://login.yandex.ru/info',
    clientId: process.env.YANDEX_CLIENT_ID,
    clientSecret: process.env.YANDEX_CLIENT_SECRET,
    redirectUri: process.env.YANDEX_REDIRECT_URI,
  },
  // vk, mailru — аналогично
};
```

### 2FA (TOTP)
- `services/authService.ts` — генерация секретов, верификация кодов
- Backup codes — 10 одноразовых кодов

---

## 5. Rate limiting

| Лимитер | Путь | Лимит |
|---|---|---|
| `authLimiter` | `/api/auth/*` | 5/мин |
| `messageLimiter` | `/api/messages/*` | 30/мин |
| `uploadLimiter` | `/api/upload/*` | 10/мин |
| `apiLimiter` | `/api/*` | 100/15мин |

---

## 6. WebSocket

### Подключение
```typescript
// index.ts
const wss = new WebSocketServer({ server, path: '/ws' });
```

### События
| Событие | Направление | Payload |
|---|---|---|
| `message.new` | server → client | `{chatId, message}` |
| `message.updated` | server → client | `{chatId, messageId, content}` |
| `message.deleted` | server → client | `{chatId, messageId}` |
| `typing` | client → server → client | `{chatId, userId}` |
| `chat.updated` | server → client | `{chatId, lastMessage}` |
| `user.online` | server → client | `{userId}` |
| `user.offline` | server → client | `{userId}` |
| `story.new` | server → client | `{story}` |
| `reaction.added` | server → client | `{messageId, reaction, userId}` |

### Аутентификация WS
- `Authorization: Bearer <token>` при handshake
- Куки (`credentials: 'include'`)

---

## 7. База данных

### Prisma
```prisma
// packages/shared/prisma/schema.prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql", url = env("DATABASE_URL") }

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String?
  createdAt BigInt   @default(0)
  updatedAt BigInt   @default(0)
  // ...
}
```

### Миграции
```bash
# Создание миграции:
cd packages/shared && npx prisma migrate dev --name add_foo_bar

# Применение (prod):
npx prisma migrate deploy

# Базирование (на непустой БД):
npx prisma migrate resolve --applied <migration_id>
```

### Seed
```bash
# Заполнение начальными данными:
npx prisma db seed
```

---

## 8. Безопасность

### OWASP Top 10
| Категория | Механизм |
|---|---|
| A01 Access Control | `requireAuth`, `requireRole`, rate limits |
| A02 Crypto Failures | bcrypt (12 rounds), JWT, HTTPS/HSTS |
| A03 Injection | Prisma (parameterized), input sanitizer |
| A05 Misconfiguration | helmet, CORS strict, no debug in prod |
| A07 Auth Failures | rate limit, refresh rotation, TOTP 2FA |
| A09 Logging | securityLogger, rateLimitLogger, AuditLog |

### CSP
```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    connectSrc: ["'self'", "https://api.balloo.su", "wss://api.balloo.su"],
    imgSrc: ["'self'", 'data:', 'https:'],
  }
}
```

### 152-ФЗ
- `DELETE /api/users/me` — удаление аккаунта (cascade)
- `GET /api/users/me/export` — экспорт данных (JSON)
- `AuditLog` — логирование доступа к ПД

---

## 9. Деплой

### Docker
```dockerfile
# docker/Dockerfile.server
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml .pnpm-store/ ./
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @balloo/server build
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3100
CMD ["node", "dist/index.js"]
```

### Команда запуска (сервер)
```bash
cd /home/cfr_balloo/balloo
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production build server
docker compose -f docker/prod/docker-compose.local.yml \
  --env-file docker/prod/.env.production up -d server
```

---

## 10. Тестирование

```bash
# Запуск всех серверных тестов:
pnpm --filter @balloo/server exec jest

# Запуск конкретного набора:
pnpm --filter @balloo/server exec jest auth.test

# Покрытие:
npx jest --coverage auth.test payments.test
```

---

*Документ создан 2026-09-30.*

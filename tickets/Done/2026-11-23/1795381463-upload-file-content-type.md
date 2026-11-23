# Тикет 1795381463 — POST /api/upload/file → 400: FormData уходит с Content-Type: application/json

**Создан:** 23.11.2026 (unix 1795381463)
**Статус:** в работе
**Источник:** консоль владельца при приёмке H (деплой `65b4606`)

## Симптом

```text
api.ts:69  POST https://api.balloo.su/api/upload/file 400 (Bad Request)
    at uploadFile (api.ts:418)
    at AttachmentPanel.tsx:103
```

Загрузка вложения в чат не работает — сервер отвечает `400`.

## Причина (доказано чтением кода 23.11.2026)

`request()` в `packages/web/src/services/api.ts:51-57` **всегда** кладёт
`'Content-Type': 'application/json'` в базовые заголовки. Upload-методы
(`uploadFile`, `uploadAvatar`, `uploadChatAvatar`, `createStory`) передают
`headers: {}` — этот пустой объект Content-Type **не переопределяет**, лишь
дополняет.

Итог: браузер отправляет `FormData` (multipart-тело) с заголовком
`Content-Type: application/json`. На сервере глобальный
`express.json({ limit: '10mb' })` (`packages/server/src/app.ts:52`) стоит **до**
роутера `/api/upload` (`routes/index.ts:58`) и пытается распарсить multipart-тело
как JSON → `SyntaxError` → `400 Bad Request`. До multer запрос не доходит,
`req.file` не заполняется.

Не связано с деплоем `65b4606`: в диапазоне `853da64..65b4606` файл `api.ts`
менялся только в части `createDirectChat`; заголовок `Content-Type` в `request()`
— давний.

## Затронуто (все FormData-запросы)

| Метод | Эндпоинт | Симптом |
|---|---|---|
| `uploadFile` | `POST /api/upload/file` | 400 (подтверждено консолью) |
| `uploadAvatar` | `POST /api/upload/avatar` | 400 (тот же механизм) |
| `uploadChatAvatar` | `POST /api/upload/chat-avatar` | 400 |
| `createStory` | `POST /api/stories` | 400 |

## Решение

В `request()` не устанавливать `Content-Type`, когда тело — `FormData`:
браузер сам проставит `multipart/form-data; boundary=…`. Явно переданный
`customHeaders['Content-Type']` сохраняет приоритет.

## Подзадачи

- [x] 1. `api.ts` `request()`: `Content-Type: application/json` только для не-FormData
- [x] 2. Регресс-тест `__tests__/services/api.upload.test.ts` (заголовок не json, body — FormData)
- [x] 3. Проверки: `tsc --noEmit` (web), `pnpm test:web`, `vite build`
- [x] 4. Деплой web — батчи D/F/G, 23.11.2026: `HEAD=4e9e9e5`, бандль
      `index-B6MIL7kE.js` (=8090=домен), маркер `instanceof FormData` = 1
      (в прежнем образе = 0)

## Результат

`packages/web/src/services/api.ts` — `request()`: заголовок `Content-Type:
application/json` ставится только для не-FormData тела; для `FormData` заголовок
не задаётся (браузер проставляет `multipart/form-data; boundary=…`).
Явный `customHeaders['Content-Type']` сохраняет приоритет.

Регресс-тест `packages/web/src/__tests__/services/api.upload.test.ts` (3 кейса):
на старом коде 2 failed (`expected 'application/json' to be undefined`),
после фикса 3/3.

Проверки:
```
pnpm --filter @balloo/web exec tsc --noEmit   → exit 0
pnpm --filter @balloo/web exec vitest run      → Test Files 54 passed, Tests 396 passed
pnpm --filter @balloo/web exec vite build      → ✓ built in 7.63s (index-DUNirnh_.js)
```

Требуется деплой **web**.

## Деплой (батчи D/F/G, 23.11.2026)

```text
D: git fetch origin → origin/main=4e9e9e5; git checkout -B main origin/main → HEAD=4e9e9e5
E: откатный тег balloo/web:rollback-20261123b = 8c1aff2cfd9f (= web:local);
   дамп БД pre-deploy-20261123b.sql — 182 742 B
F: build web → слои 18/28 (COPY packages/web) и 24/28 (vite build) БЕЗ CACHED,
   config-хэш 6e2f7825… (≠ ce0a4364 прежнего образа);
   up -d --no-deps --force-recreate web → Container balloo-web Started (9.8s)
G: HEAD=4e9e9e5; web img=9c121cb3… restarts=0;
   бандль: 8090 = index-B6MIL7kE.js = домен (≠ index-BMWJl9HD.js)
G2 (маркер фикса, устойчивый к минификации):
   новый образ balloo-web  : `instanceof FormData` = 1
     контекст: "undefined"!=typeof FormData&&n.body instanceof FormData?{}:{"Content-Type":"application/json"}
   прежний rollback-20261123b: index-BMWJl9HD.js, `instanceof FormData` = 0
   server: Up 13 hours (healthy) — не перезапускался; postgres/redis/minio — Up 2 weeks
```

Откат не потребовался. Тег `balloo/web:rollback-20261123b` и дамп
`pre-deploy-20261123b.sql` остаются на сервере.

**Остаток — браузерная приёмка владельца:** вложение в чат (скрепка → файл →
отправить) → `POST /api/upload/file` отвечает 200, файл появляется в сообщении;
загрузка аватара пользователя тоже работает.

## Критерии готовности

- `POST /api/upload/file` с вложением отвечает 200 и возвращает `data.url`;
- загрузка аватара пользователя/чата и медиа истории работают;
- `tsc`/`vitest`/`vite build` зелёные.

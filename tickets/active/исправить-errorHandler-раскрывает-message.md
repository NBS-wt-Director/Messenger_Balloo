# исправить-errorHandler-раскрывает-message-в-проде

**Создана:** 09.10.2026
**Приоритет:** средний

## Проблема

`middleware/errorHandler.ts:17` — `const message = err.message || 'Внутренняя ошибка сервера'`.
`message` уходит клиенту **всегда**, включая 500-е.

Стек раскрывается только в development (`errorHandler.ts:37`) — это правильно.
А `err.message` — нет.

Для неоперационных ошибок (упавший Prisma, драйвер БД, `TypeError` внутри бизнес-логики) `err.message` содержит внутренние детали: имена таблиц, куски SQL, пути, версии библиотек.

## Почему это дыра

Флаг `isOperational` в интерфейсе `AppError` (errorHandler.ts:6) объявлен, но **нигде не используется** при решении, что показать клиенту.

## Где смотреть

| Что | Файл:строка |
|-----|-------------|
| message уходит клиенту | `packages/server/src/middleware/errorHandler.ts:17`, `:44` |
| неиспользуемый isOperational | `packages/server/src/middleware/errorHandler.ts:6` |
| /health отдаёт error.message наружу | `packages/server/src/app.ts:90`, `:98`, `:106` |

## Решение

```typescript
// errorHandler.ts:16-17
const isOperational = err.isOperational !== false; // по умолчанию считаем операционной
const statusCode = err.statusCode || 500;

// Неоперационная 500 → клиенту общий текст, детали только в лог
const message = isOperational || statusCode < 500
  ? (err.message || 'Внутренняя ошибка сервера')
  : 'Внутренняя ошибка сервера';
```

И для `/health`: детали зависимостей отдавать только аутентифицированному админу (`authRequired, roleRequired('admin')`), наружу — только `{ status: 'ready' | 'not_ready' }`.

## Как проверить

`curl -s localhost:4000/api/health` → в JSON нет строк с сообщениями драйверов.
Тест: бросить неоперационную ошибку → в ответе `message: 'Внутренняя ошибка сервера'`.

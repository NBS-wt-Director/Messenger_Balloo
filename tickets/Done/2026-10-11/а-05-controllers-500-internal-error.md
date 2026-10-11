# а-05 — Контроллеры: скрыть error.message из 500-ответов

**Слой:** 4 (обработка ошибок). **136 мест, 24 контроллера.**

## Что сделать

1. Добавить хелпер `internalError` в `packages/server/src/middleware/errorHandler.ts`:
   ```ts
   export const internalError = (res: Response, err: unknown, logTag = ''): void => {
     console.error(`[500]${logTag ? ' ' + logTag : ''}`, (err as Error)?.message, (err as Error)?.stack);
     res.status(500).json({ error: 'Internal Error', message: 'Внутренняя ошибка сервера' });
   };
   ```
2. По каждому из 24 контроллеров: заменить `res.status(500).json({..., message: error.message})` → `internalError(res, error, 'имя.метод')`.
3. Тесты, ожидающие конкретные 500-тексты, перевести на общий текст.

## Как проверить

`grep -rn "status(500)" packages/server/src/controllers/*.ts | grep -c "message: error\.\|message: err\."` → 0.
`pnpm --filter @balloo/server test` зелёный.

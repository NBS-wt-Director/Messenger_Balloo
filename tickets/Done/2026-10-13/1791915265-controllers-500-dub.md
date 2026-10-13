# исправить-controllers-500-message

**Создана:** 11.10.2026 (из тикета «исправить-errorHandler-раскрывает-message-в-проде»)
**Приоритет:** средний

## Проблема

Глобальный `errorHandler` с 11.10.2026 скрывает `err.message` у не-операционных
5xx, но большинство контроллеров перехватывают ошибки **своими** try/catch и
сами отдают `res.status(500).json({ ..., message: error.message })`, минуя
обработчик. Внутренние сообщения (Prisma, драйверы, TypeError) уходят клиенту.

## Факт (замер 11.10.2026)

```bash
grep -rn "status(500)" packages/server/src/controllers/*.ts | grep -c "message: error.message\|message: err.message"
# 136
```

Затронуто 24 контроллера (максимумы: knowledgeController 21, adminController 16,
downloadController 12, messageController/blogController/featureController по 11).

## Решение (предлагаемое)

Один хелпер в `middleware/errorHandler.ts`:

```typescript
export const internalError = (res: Response, err: unknown, logTag = ''): void => {
  console.error(`[500]${logTag ? ' ' + logTag : ''}`, (err as Error)?.message, (err as Error)?.stack);
  res.status(500).json({ error: 'Internal Error', message: 'Внутренняя ошибка сервера' });
};
```

Замена в контроллерах: `res.status(500).json({ error: 'Internal Error', message: error.message })`
→ `internalError(res, error, 'chatController.getMessages')`. Массовая правка —
по контроллеру за шаг, после каждого `jest` соответствующего набора.

## Критерии готовности

- `grep -rn "status(500).*message: e" packages/server/src/controllers/` → 0;
- тесты, ожидающие конкретные 500-сообщения контроллеров, переведены на
  общий текст (правки тестов — с доказательством, что старый текст был утечкой);
- `pnpm --filter @balloo/server test` зелёные.

## Результат

(заполняется по ходу)

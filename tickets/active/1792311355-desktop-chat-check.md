# Тикет 1792311355 — Desktop: DesktopChatScreen — проверить обёртку

**Создан:** 18.10.2026 (unix 1792311355)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
DesktopChatScreen — обёртка ChatView. Проверить что контент рендерится корректно.

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopChatScreen.tsx` (46 строк)
- Текущий код: показывает placeholder "Выберите чат", нет реального ChatView
- API: ChatViewScreen из web роутера

## Подзадачи
- [ ] 1. Проверить что ChatViewScreen доступен через router
- [ ] 2. DesktopChatScreen нужен как обёртка или ChatView напрямую?
- [ ] 3. `pnpm --filter @balloo/desktop build`

## Критерии готовности
- ChatView рендерится
- build зелёный

## Результат

# Тикет 1792311345 — Mobile: MediaViewerScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311345)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API просмотра медиа.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/MediaViewerScreen.tsx`
- Текущий код: `const items: MediaItem[] = route?.params?.items || []` — данные приходят через params, нет загрузки по ID
- API из web: `grep "api.*media\|getMedia" packages/web/src/`

## Подзадачи
- [ ] 1. Найти API в web: `grep -rn "api\.\w+.*media" packages/web/src/`
- [ ] 2. Добавить `import { api } from '../services/api'`
- [ ] 3. Если нужно — добавить API-загрузку медиа по chatId
- [ ] 4. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- API-вызов
- build зелёный

## Результат

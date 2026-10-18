# Тикет 1792311352 — Desktop: DesktopMediaViewerScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311352)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API просмотра медиа.

## Живое состояние
- Файл: `packages/desktop/src/renderer/src/screens/DesktopMediaViewerScreen.tsx` (198 строк)
- Текущий код: `useState<MediaItem[]>([])` — пустой
- API из web: `grep "api.*media\|getMedia" packages/web/src/`

## Подзадачи
- [ ] 1. Найти API в web
- [ ] 2. Добавить `import { api } from '@balloo/web/services/api'`
- [ ] 3. Заменить пустой useState на API-вызов
- [ ] 4. `pnpm --filter @balloo/desktop build`

## Критерии готовности
- API-вызов
- build зелёный

## Результат

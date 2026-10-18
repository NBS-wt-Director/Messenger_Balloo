# Тикет 1792311343 — Mobile: ArchiveScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311343)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API архива чатов.

## Живое состояние
- Файл: `packages/mobile-android/src/screens/ArchiveScreen.tsx`
- Текущий код: `useState<ArchChat[]>([])`, `useEffect(() => {}, [])` — пустой
- API из web: `grep "api.*archive\|getArchived" packages/web/src/screens/`

## Подзадачи
- [ ] 1. Найти API в web: `grep -rn "api\.\w+.*archiv" packages/web/src/`
- [ ] 2. Добавить `import { api } from '../services/api'`
- [ ] 3. Заменить пустой useEffect на API-вызов
- [ ] 4. Добавить loading state
- [ ] 5. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- API-вызов
- loading state
- build зелёный

## Результат

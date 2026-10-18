# Тикет 1792311339 — Mobile: DonateScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311339)
**Статус:** в работе
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API доната (YooKassa).

## Живое состояние
- Файл: `packages/mobile-android/src/screens/DonateScreen.tsx`
- Текущий код: `const [selected, setSelected] = useState(500)`, кнопка без onClick
- API из web: `grep "api.*donate\|createPayment" packages/web/src/screens/donate/`

## Подзадачи
- [ ] 1. Найти API в web: `grep -rn "api\.\w+.*donate\|payment" packages/web/src/screens/donate/`
- [ ] 2. Добавить `import { api } from '../services/api'`
- [ ] 3. Добавить onClick на кнопку оплаты
- [ ] 4. Добавить loading/success/error states
- [ ] 5. Проверка: `pnpm --filter @balloo/mobile-android build`

## Критерии готовности
- API-вызов при нажатии
- loading/success states
- build зелёный

## Результат

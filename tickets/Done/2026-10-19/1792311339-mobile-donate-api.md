# Тикет 1792311339 — Mobile: DonateScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311339)
**Статус:** готов (19.10.2026)
**Источник:** инвентаризация 1792311334

## Цель
Подключить реальный API доната (YooKassa).

## Живое состояние
- Файл: `packages/mobile-android/src/screens/DonateScreen.tsx`
- Текущий код: `const [selected, setSelected] = useState(500)`, кнопка без onClick
- API из web: `grep "api.*donate\|createPayment" packages/web/src/screens/donate/`

## Подзадачи
- [x] 1. API: `api.createDonation({ amount })` → `POST /api/payments/donate`
- [x] 2. Импорт `api` добавлен
- [x] 3. Кнопка «Оплатить N ₽» получила onPress
- [x] 4. loading / ошибка / блок результата (ЮKassa: `Linking.openURL(paymentUrl)`;
      анонимный режим: реквизиты СБП из `sbpInfo`)
- [x] 5. Типы mobile-пакета: 0 ошибок tsc

## Критерии готовности
- API-вызов при нажатии
- loading/success states
- build зелёный

## Проблемы и решения

Форма ответа сервера (`paymentService.ts:138` и `:182`) разобрана в обоих режимах.
ЮKassa на проде не настроена (`YOOKASSA_SHOP_ID`/`API_KEY` пустые) — на этом стенде
реализуется анонимный (СБП) режим; это не блокер кода (решение владельца №4).

## Результат

### Проверки (прогон 19.10.2026, эта сессия)

```
$ cd packages/mobile-android && ./node_modules/.bin/tsc --noEmit --pretty false
0 ошибок (до правок в пакете — 77 строк ошибок)

$ pnpm --filter @balloo/web build
✓ built in 7.69s

$ pnpm --filter @balloo/web test
 Test Files  33 passed (33)
      Tests  290 passed (290)

$ pnpm --filter @balloo/desktop build
✓ built (tsc && vite build)

$ python3 scripts/api-endpoints-check.py
Клиентских путей: 184 / Серверных маршрутов: 250 / НЕ СОВПАДАЕТ: 18 (группа B, ждёт владельца)
```

Не проверялось: реальный прогон экранов в браузере/эмуляторе (нет запущенного
бэкенда с БД и нет Android-устройства на этой машине) — см. AGENTS.md §1.

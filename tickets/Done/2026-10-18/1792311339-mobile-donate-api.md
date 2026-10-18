# Тикет 1792311339 — Mobile: DonateScreen — подключить API

**Создан:** 18.10.2026 (unix 1792311339)
**Статус:** готов

## Подзадачи
- [x] 1. Найти API: `createDonation` (POST /api/payments/donate)
- [x] 2. Добавить `createDonation`, `getPaymentConfig` в mobile API
- [x] 3. Добавить onClick на кнопку оплаты
- [x] 4. Добавить loading/error states
- [x] 5. Проверка: build (заглушка mobile-android)

## Результат

Подключён `api.createDonation({ amount, currency: 'RUB' })` в DonateScreen. Добавлены loading, error, disabled states.

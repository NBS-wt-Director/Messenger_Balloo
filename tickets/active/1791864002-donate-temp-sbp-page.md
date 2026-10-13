# Тикет 1791864002 — Временная страница приёма донатов (СБП QR-код, без ЮKassa)

**Создан:** 2026-10-13 (unix 1791864002)
**Статус:** в работе
**Приоритет:** P1 (MVP1)
**Источник:** пользователь, `tickets/deferred/1790443855-yukassa-priyom-platezhey.md`, режим `sbp_manual`
**Триггер:** не нужен — это временное решение, не ЮKassa

## Цель

Настроить экран донатов на приём без реальных платежей ЮKassa: режим **СБП QR-код + перевод по номеру телефона**. Код интеграции уже написан (`paymentService.ts`, режим `sbp_manual`), нужен только ввод реквизитов от владельца.

## Факты (сняты 13.10.2026)

1. `packages/server/src/services/paymentService.ts` (519 строк) — два провайдера: `yookassa` и `sbp_manual`.
2. Режим `sbp_manual` включается автоматически, если `YOOKASSA_SHOP_ID`/`API_KEY` пусты → `yookassaConnected: false`.
3. `packages/web/src/screens/donate/DonateScreen.tsx` — экран донатов (P38.11), использует тарифы из `DonationTier`.
4. `packages/server/src/services/paymentService.ts` — `paymentConfig.sbpQrUrl`, `paymentConfig.sbpPhoneNumber`, `paymentConfig.sbpPhoneName` — реквизиты СБП.
5. Массив `paymentConfig` в БД — пуст (нужен seed или первая запись через админку).
6. `assets/logos/qr_helpus.jpg` — файл QR-кода для донатов существует (65 КБ).
7. `packages/web/public/qr.webp` — QR-код в public (18 КБ).

## Что нужно сделать

1. **Seed-запись `PaymentConfig`:** добавить в `prisma/seed` или выполнить `prisma db execute` с записью:
   - `mode: 'sbp_manual'` (режим по умолчанию)
   - `sbpQrUrl: "<URL_или_путь_к_файлу_QR>"` — можно `assets/logos/qr_helpus.jpg` или `qr.webp`
   - `sbpPhoneNumber: "<Номер_телефона_для_перевода>"` — номер от владельца
   - `sbpPhoneName: "<Имя_получателя>"` — имя от владельца
2. **Проверить `DonateScreen.tsx`:** правильно ли показывает QR-код и номер телефона в режиме `sbp_manual`. Если QR-код — статический файл из public, убедиться, что путь корректен.
3. **Проверить `AdminDonationsScreen.tsx`:** можно ли вручную подтверждать донаты в режиме `sbp_manual`.
4. **Прогон `pnpm build`** — зелёный.

## Подзадачи

- [ ] 1. Снять фактическое состояние PaymentConfig: `docker compose -f docker/prod/docker-compose.local.yml exec server npx prisma db execute --file -` (локально) или `pnpm --filter @balloo/server prisma db seed`.
- [ ] 2. Добавить seed-данные PaymentConfig (sbp_manual, номер, имя, QR-путь).
- [ ] 3. Проверить `DonateScreen.tsx` — режим `sbp_manual`: показывает QR + номер.
- [ ] 4. Проверить `AdminDonationsScreen.tsx` — ручное подтверждение донатов.
- [ ] 5. `pnpm build` — зелёный.
- [ ] 6. **Прогон в браузере** — [!] ждёт владельца: открыть `/donate` (гость), убедиться, что показан QR/номер, не ЮKassa.

## Критерии готовности

- PaymentConfig с `mode: 'sbp_manual'` существует в БД.
- `DonateScreen.tsx` в режиме `sbp_manual` показывает QR-код и номер телефона.
- `AdminDonationsScreen.tsx` позволяет вручную подтвердить донат.
- `pnpm build` → exit 0.
- [!] Браузерная проверка — ждёт владельца.

## Что ждёт владельца (записано в `with_lord/СДЕЛАТ_ВЛАДЕЛЬЦУ.md`)

| № | Что нужно | Сделано | Решение |
|---|---|---|---|
| D.1 | Номер телефона для СБП-перевода | | |
| D.2 | Имя получателя (для отображения) | | |
| D.3 | Подтвердить: QR-код `qr.webp` в public/ или загрузить новый | | |
| D.4 | Проверить в браузере: `/donate` → показывает QR/номер, не ЮKassa | | |

## Проблемы и решения

ЮKassa не подключена — это **временное** решение, не финальное. Когда владелец зарегистрирует магазин на yookassa.ru, переключим на `yookassa` (тикет `1790443855`).

## Результат

(заполняется по итогам)

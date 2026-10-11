# исправить-yookassa-webhook-forgery

**Создана:** 11.10.2026 (из проверочного тикета а-16)
**Приоритет:** высокий (денежный контур)

## Проблема (факт из кода, paymentService.ts:262-290)

`processYookassaWebhook` принимает `POST /api/payments/webhook/yookassa` и
обновляет статус доната **без какой-либо аутентификации**:

```ts
const expected = crypto.createHmac('sha256', apiKey).update(body).digest('hex');
if (signature !== expected) {
  // В вебхуках ЮKassa v2 подпись — это HMAC-SHA256 от тела запроса
  // Проверяем иначе: если shopId+apiKey совпадают — доверяем
  // (в production требуется более строгая проверка)
}
```

- при несовпадении подписи не делается **ничего** (пустая ветка);
- ЮKassa v2 вообще не присылает `Authorization: Bearer <hmac>` — уведомления
  аутентифицируются списком IP отправителя, а содержимое подтверждается
  запросом к API;
- итог: любой, кто знает/угадает `donationId`, может прислать тело
  `{object:{status:'succeeded', metadata:{donationId}}}` и получить
  `completed` без оплаты.

## Что сделать

1. Отклонять вебхук без настроенных `shopId`/`apiKey` (сейчас при пустых
   ключах проверка просто не выполняется).
2. Если заголовок `Authorization: Bearer` всё же пришёл — строгая проверка
   HMAC через `crypto.timingSafeEqual`, несовпадение = отклонить.
3. Настоящая проверка подлинности: **GET `https://api.yookassa.ru/v3/payments/{id}`**
   (Basic shopId:apiKey) — платить верим только ответу API:
   - платёж существует;
   - `payment.metadata.donationId` совпадает с донатом из БД;
   - сумма `payment.amount.value` (рубли, строка) совпадает с `Donation.amount`
     (Int, мин. единицы);
   - новый статус берётся из `payment.status` ответа API, НЕ из тела
     уведомления.
4. `waiting_for_capture` → capture — как сейчас, но по статусу из API.

## Критерии готовности

- `grep -n "доверяем" paymentService.ts` → 0;
- фейковый вебхук на существующий donationId (платежа нет в ЮKassa) → 400,
  статус доната не меняется (тест с mock fetch);
- легитимный флоу (mock GET-ответа API) → статус проставляется из API;
- `pnpm --filter @balloo/server test` зелёные.

## Результат (11.10.2026)

Реализовано по плану, `paymentService.ts`:

- `getYooKassaPayment(paymentId, shopId, apiKey)` — GET `/payments/{id}`,
  Basic auth, 404 → null;
- `processYookassaWebhook`: без ключей → 400 «ЮKassa не настроена — вебхук
  отклонён»; Bearer-заголовок сверяется `crypto.timingSafeEqual` (несовпадение
  → 400); статус, metadata.donationId и сумма (`amount.value` рубли → мин.
  единицы против `Donation.amount`) берутся **только из ответа API**;
  `waiting_for_capture` → capture по `payment.id` из API;
- комментарий-заглушка «доверяем» удалён: `grep -n "доверяем" paymentService.ts` → 0.

Тесты (`payment-service-depth.test.ts`, `payments.test.ts`):

- переведены на мок API: succeeded/canceled/weird/waiting_for_capture — 200+正确的 статус;
- новые отклонения: без ключей / 404 платежа / metadata чужого доната /
  несовпадение суммы / неверная Bearer-подпись → 400 и статус не меняется;
- верная HMAC + подтверждение API → 200 + completed;
- прогон: **32 набора / 591 тест зелёные** (было 584, +7), `tsc --noEmit` чисто.

Старые тесты, ожидавшие «поддельное тело → completed», переписаны намеренно:
они фиксировали дыру (см. diff коммита).

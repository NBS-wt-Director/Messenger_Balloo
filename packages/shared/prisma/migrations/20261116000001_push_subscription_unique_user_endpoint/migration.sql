-- Тикет 1794831100 (часть A): идемпотентность push-подписок браузера.
-- У модели PushSubscription не было @@unique([userId, endpoint]) → повторная
-- подписка того же браузера создавала дубль, отправка дублировала уведомления.
-- Индекс позволяет upsert в saveBrowserPushSubscription.

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_userId_endpoint_key"
  ON "push_subscriptions"("userId", "endpoint");

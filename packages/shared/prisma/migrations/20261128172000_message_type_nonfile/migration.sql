-- Тикет 1795677071: не-файловые вложения задают тип сообщения.
-- Message.type — enum MessageType, поэтому новых значений недостаточно
-- объявить в контроллере: без ALTER TYPE Prisma отклоняет создание
-- сообщения с типом quiz/list_active/list_passive/personali.
-- Аддитивно: существующие значения и строки не меняются.
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'quiz';
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'list_active';
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'list_passive';
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'personali';

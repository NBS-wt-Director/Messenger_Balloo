-- Миграция 20261004000000 — анонимные фич-предложения (тикет 1790480787-04)
-- 1. Добавить колонку isAnonymous (по умолчанию true)
-- 2. Сделать userId nullable (анонимные предложения не привязаны к пользователю)
-- 3. Обновить FK: ON DELETE SET NULL для author (при удалении автора анонимная фича остаётся)

-- Добавить колонку isAnonymous
ALTER TABLE "feature_requests" ADD COLUMN "isAnonymous" BOOLEAN NOT NULL DEFAULT true;

-- Сделать userId nullable
ALTER TABLE "feature_requests" ALTER COLUMN "userId" DROP NOT NULL;

-- Обновить FK: при удалении автора — оставить userId NULL (анонимная фича не удаляется)
ALTER TABLE "feature_requests" DROP CONSTRAINT "feature_requests_userId_fkey";
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Тикет 1792395490: добавление API-токена к ботам.
-- Фронт (BotsScreen) ожидает поле token в ответе GET/POST /api/bots.

ALTER TABLE "bots" ADD COLUMN IF NOT EXISTS "token" VARCHAR(64) NOT NULL DEFAULT '';

-- Для существующих строк генерируем уникальный token (cuid-подобный)
UPDATE "bots" SET "token" = 'bot_' || substr(md5(random()::text || id), 1, 32) WHERE "token" = '';

-- Уникальный индекс (после заполнения, чтобы не коллизировать)
CREATE UNIQUE INDEX IF NOT EXISTS "bots_token_key" ON "bots"("token");

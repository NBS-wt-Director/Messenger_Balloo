-- Тикет 1792072292: выборочный доступ к истории.
-- 1. Поле visibility на Story (all/friends/self/selective)
-- 2. Таблица story_audience: связь история ↔ выбранные пользователи

ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "visibility" VARCHAR(20) NOT NULL DEFAULT 'all';

CREATE TABLE IF NOT EXISTS "story_audience" (
    "id" VARCHAR(25) NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" VARCHAR(25) NOT NULL,
    CONSTRAINT "story_audience_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "story_audience_storyId_userId_key" ON "story_audience"("storyId", "userId");
CREATE INDEX IF NOT EXISTS "story_audience_storyId_idx" ON "story_audience"("storyId");

ALTER TABLE "story_audience" ADD CONSTRAINT "story_audience_storyId_fkey"
    FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

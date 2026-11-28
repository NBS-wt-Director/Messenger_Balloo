-- Тикет 1795888510: заявки в команду Balloo.
-- Аддитивная миграция: новая таблица, существующие данные не меняются.
CREATE TABLE "team_applications" (
    "id" VARCHAR(25) NOT NULL,
    "userId" VARCHAR(25) NOT NULL,
    "username" VARCHAR(255),
    "message" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "reviewedById" VARCHAR(25),
    "reviewedAt" BIGINT,
    "lastMessageAt" BIGINT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "team_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "team_applications_status_idx" ON "team_applications"("status");
CREATE INDEX "team_applications_userId_idx" ON "team_applications"("userId");

ALTER TABLE "team_applications"
  ADD CONSTRAINT "team_applications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_applications"
  ADD CONSTRAINT "team_applications_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

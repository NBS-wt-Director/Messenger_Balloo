-- CreateTable: refresh_tokens
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" VARCHAR(25) NOT NULL,
    "jti" VARCHAR(255) NOT NULL,
    "userId" VARCHAR(25) NOT NULL,
    "familyId" VARCHAR(25) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_jti_key" ON "refresh_tokens"("jti");
CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
CREATE INDEX IF NOT EXISTS "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");
CREATE INDEX IF NOT EXISTS "refresh_tokens_jti_idx" ON "refresh_tokens"("jti");
CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_revoked_idx" ON "refresh_tokens"("userId", "revoked");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

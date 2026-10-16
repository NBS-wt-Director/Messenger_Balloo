-- ============================================
-- Migration: 20261016000000_account_device_links
-- Мультиаккаунт: связь аккаунт → устройство
-- (mockups/data_schema.json → account_device_links,
--  приёмка макета 1.1.9 → 6.33, тикет 1792124252)
-- ============================================

-- CreateTable
CREATE TABLE IF NOT EXISTS "account_device_links" (
    "id" VARCHAR(25) NOT NULL,
    "userId" VARCHAR(25) NOT NULL,
    "deviceId" VARCHAR(64) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "account_device_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "account_device_links_userId_deviceId_key" ON "account_device_links"("userId", "deviceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "account_device_links_deviceId_idx" ON "account_device_links"("deviceId");

-- AddForeignKey
ALTER TABLE "account_device_links" ADD CONSTRAINT "account_device_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

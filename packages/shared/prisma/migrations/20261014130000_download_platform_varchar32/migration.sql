-- ============================================
-- Migration: 20261014130000_download_platform_varchar32
-- DownloadFile.platform VARCHAR(20) → VARCHAR(32)
-- (тикеты 1791927977: канонические имена upload-mobile-file
--  android-apk-universal=21, android-apk-armeabi-v7a=23 символа
--  не влезали в 20 — задокументировано тестом
--  download-controller-depth.test.ts:125)
-- ============================================

ALTER TABLE "download_files" ALTER COLUMN "platform" TYPE VARCHAR(32);

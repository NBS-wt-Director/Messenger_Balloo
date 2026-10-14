-- ============================================
-- Migration: 20261014120000_download_version_code
-- DownloadFile.versionCode — монотонный номер сборки Android
-- (APK self-update, тикет 1791927977)
-- ============================================

ALTER TABLE "download_files" ADD COLUMN IF NOT EXISTS "versionCode" INTEGER;

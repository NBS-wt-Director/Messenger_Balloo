-- ============================================
-- Migration: 20261014000001_feature_request_category
-- feature_requests.categoryId — связь с feature_categories
-- (модель FeatureRequest.categoryId была в схеме без миграции;
--  после prisma generate клиент требует колонку, без неё features API = 500)
-- ============================================

ALTER TABLE "feature_requests" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'feature_requests_categoryId_fkey'
    ) THEN
        ALTER TABLE "feature_requests"
            ADD CONSTRAINT "feature_requests_categoryId_fkey"
            FOREIGN KEY ("categoryId") REFERENCES "feature_categories"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

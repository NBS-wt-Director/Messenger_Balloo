-- ============================================
-- Migration: 20261014000000_info_seed_tables
-- Создаёт 8 таблиц для seed-данных (pre_filled_data.json)
-- ============================================

-- 1. onboarding_steps
CREATE TABLE IF NOT EXISTS "onboarding_steps" (
    "id" VARCHAR(25) NOT NULL,
    "order" INTEGER NOT NULL,
    "illustrationUrl" VARCHAR(500) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "onboarding_steps_pkey" PRIMARY KEY ("id")
);

-- 2. onboarding_step_translations
CREATE TABLE IF NOT EXISTS "onboarding_step_translations" (
    "id" VARCHAR(25) NOT NULL,
    "onboardingStepId" TEXT NOT NULL,
    "language" VARCHAR(10) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    CONSTRAINT "onboarding_step_translations_pkey" PRIMARY KEY ("id")
);

-- 3. text_pages
CREATE TABLE IF NOT EXISTS "text_pages" (
    "id" VARCHAR(25) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "text_pages_pkey" PRIMARY KEY ("id")
);

-- 4. text_page_translations
CREATE TABLE IF NOT EXISTS "text_page_translations" (
    "id" VARCHAR(25) NOT NULL,
    "textPageId" TEXT NOT NULL,
    "language" VARCHAR(10) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" VARCHAR(20000) NOT NULL,
    CONSTRAINT "text_page_translations_pkey" PRIMARY KEY ("id")
);

-- 5. knowledge_categories
CREATE TABLE IF NOT EXISTS "knowledge_categories" (
    "id" VARCHAR(25) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    CONSTRAINT "knowledge_categories_pkey" PRIMARY KEY ("id")
);

-- 6. application_stages
CREATE TABLE IF NOT EXISTS "application_stages" (
    "id" VARCHAR(25) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "application_stages_pkey" PRIMARY KEY ("id")
);

-- 7. interview_criteria
CREATE TABLE IF NOT EXISTS "interview_criteria" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "interview_criteria_pkey" PRIMARY KEY ("id")
);

-- 8. feature_categories
CREATE TABLE IF NOT EXISTS "feature_categories" (
    "id" VARCHAR(25) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "icon" VARCHAR(50) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "feature_categories_pkey" PRIMARY KEY ("id")
);

-- Indexes

CREATE INDEX IF NOT EXISTS "onboarding_steps_order_idx" ON "onboarding_steps"("order");

CREATE UNIQUE INDEX IF NOT EXISTS "onboarding_step_translations_onboardingStepId_language_key" ON "onboarding_step_translations"("onboardingStepId", "language");

CREATE UNIQUE INDEX IF NOT EXISTS "text_pages_slug_key" ON "text_pages"("slug");

CREATE INDEX IF NOT EXISTS "text_pages_slug_idx" ON "text_pages"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "text_page_translations_textPageId_language_key" ON "text_page_translations"("textPageId", "language");

CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_categories_slug_key" ON "knowledge_categories"("slug");

CREATE INDEX IF NOT EXISTS "knowledge_categories_slug_idx" ON "knowledge_categories"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "application_stages_slug_key" ON "application_stages"("slug");

CREATE INDEX IF NOT EXISTS "application_stages_slug_idx" ON "application_stages"("slug");

CREATE INDEX IF NOT EXISTS "interview_criteria_order_idx" ON "interview_criteria"("order");

CREATE UNIQUE INDEX IF NOT EXISTS "feature_categories_slug_key" ON "feature_categories"("slug");

CREATE INDEX IF NOT EXISTS "feature_categories_slug_idx" ON "feature_categories"("slug");

-- Foreign Keys

ALTER TABLE "onboarding_step_translations"
    ADD CONSTRAINT "onboarding_step_translations_onboardingStepId_fkey"
    FOREIGN KEY ("onboardingStepId") REFERENCES "onboarding_steps"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "text_page_translations"
    ADD CONSTRAINT "text_page_translations_textPageId_fkey"
    FOREIGN KEY ("textPageId") REFERENCES "text_pages"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_categories"
    ADD CONSTRAINT "knowledge_categories_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "knowledge_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

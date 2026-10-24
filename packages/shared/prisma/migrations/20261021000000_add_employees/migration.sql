-- ============================================
-- Migration: 20261021000000_add_employees
-- Экран админки «Сотрудники» (1_02_14, приёмка 1.1.14):
-- GET /api/admin/employees + модель Employee (тикет 1792516969)
-- ============================================

-- CreateTable
CREATE TABLE IF NOT EXISTS "employees" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "department" VARCHAR(255),
    "role" VARCHAR(100) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "employees_status_idx" ON "employees"("status");

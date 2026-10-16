-- ============================================
-- Migration: 20261016000100_drop_reports_target_fk
-- Полиморфный Report.targetId (user | message | chat | post) не может иметь
-- FK на users: репорты на сообщения/чаты падали с 500 (тик. 1792124252).
-- FK из зависшей миграции 20261010000000 удаляется; модель Prisma
-- синхронизирована (relation ReportTarget удалён).
-- ============================================

ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "reports_targetId_fkey";

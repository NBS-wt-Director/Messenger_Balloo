-- Удаление некорректного FK-констрейнта Report.targetId → User.id
-- targetId — полиморфный ID (user, message, chat, post, story),
-- FK на User ломал создание жалоб на сообщения/чаты (ошибка 500)

ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "Report_targetId_fkey";
ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "reports_targetId_fkey";

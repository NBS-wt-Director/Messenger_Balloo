-- Тик. 1795686329: баланс баллов Balloo.
-- Поле баланса у пользователя + приветственный бонус 555 баллов всем,
-- кто зарегистрирован на момент выката (требование владельца 26.11.2026:
-- «начисляем сразу по факту регистрации»).

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "balancePoints" INTEGER NOT NULL DEFAULT 0;

-- Data: приветственный бонус уже зарегистрированным пользователям
UPDATE "users" SET "balancePoints" = 555 WHERE "balancePoints" = 0;

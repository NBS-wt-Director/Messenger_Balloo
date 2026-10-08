-- Миграция 20261007120000 — задачи и спринты (тикет В-112)
-- Создает таблицы tasks и sprints с индексами и FK-связями

CREATE TABLE "sprints" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "goal" TEXT,
    "startDate" BIGINT,
    "endDate" BIGINT,
    "departmentId" TEXT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tasks" (
    "id" VARCHAR(25) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "type" VARCHAR(20) NOT NULL DEFAULT 'task',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "creatorId" TEXT,
    "assigneeId" TEXT,
    "departmentId" TEXT,
    "sprintId" TEXT,
    "dueDate" BIGINT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "sprints_departmentId_idx" ON "sprints"("departmentId");
CREATE INDEX "sprints_startDate_idx" ON "sprints"("startDate");
CREATE INDEX "tasks_creatorId_idx" ON "tasks"("creatorId");
CREATE INDEX "tasks_assigneeId_idx" ON "tasks"("assigneeId");
CREATE INDEX "tasks_departmentId_idx" ON "tasks"("departmentId");
CREATE INDEX "tasks_sprintId_idx" ON "tasks"("sprintId");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_status_priority_idx" ON "tasks"("status", "priority");
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");

-- Foreign Keys
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprintId_fkey"
    FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

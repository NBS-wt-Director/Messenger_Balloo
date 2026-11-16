-- Тикет 1794850879: Группы контактов (списки контактов)
-- Макет 1_01_42 принят владельцем 17.11.2026

-- CreateTable: contact_groups
CREATE TABLE IF NOT EXISTS "contact_groups" (
    "id" VARCHAR(25) NOT NULL,
    "ownerId" VARCHAR(25) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "emoji" VARCHAR(8) NOT NULL DEFAULT '👥',
    "description" VARCHAR(200),
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "contact_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable: contact_group_members
CREATE TABLE IF NOT EXISTS "contact_group_members" (
    "groupId" VARCHAR(25) NOT NULL,
    "memberId" VARCHAR(25) NOT NULL,
    "addedAt" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "contact_group_members_pkey" PRIMARY KEY ("groupId", "memberId")
);

-- CreateIndex: contact_groups(ownerId)
CREATE INDEX IF NOT EXISTS "contact_groups_ownerId_idx" ON "contact_groups"("ownerId");

-- CreateIndex: contact_group_members(memberId)
CREATE INDEX IF NOT EXISTS "contact_group_members_memberId_idx" ON "contact_group_members"("memberId");

-- AddForeignKey: contact_groups.ownerId -> users.id
ALTER TABLE "contact_groups" ADD CONSTRAINT "contact_groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: contact_group_members.groupId -> contact_groups.id
ALTER TABLE "contact_group_members" ADD CONSTRAINT "contact_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "contact_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: contact_group_members.memberId -> users.id
ALTER TABLE "contact_group_members" ADD CONSTRAINT "contact_group_members_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Тик. 1795270823: приглашения по ссылке — флаг «в контакты», текст приглашения,
-- и таблица рефералов (вкладка «Я присоединил к Balloo»).

-- AlterTable
ALTER TABLE "invite_links" ADD COLUMN     "addToContacts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "message" TEXT;

-- CreateIndex
CREATE INDEX "invite_links_code_idx" ON "invite_links"("code");

-- CreateTable
CREATE TABLE "invite_acceptances" (
    "id" VARCHAR(25) NOT NULL,
    "inviteId" VARCHAR(25) NOT NULL,
    "userId" VARCHAR(25) NOT NULL,
    "inviterId" VARCHAR(25) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "invite_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invite_acceptances_inviteId_userId_key" ON "invite_acceptances"("inviteId", "userId");

-- CreateIndex
CREATE INDEX "invite_acceptances_inviterId_idx" ON "invite_acceptances"("inviterId");

-- CreateIndex
CREATE INDEX "invite_acceptances_userId_idx" ON "invite_acceptances"("userId");

-- AddForeignKey
ALTER TABLE "invite_acceptances" ADD CONSTRAINT "invite_acceptances_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invite_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_acceptances" ADD CONSTRAINT "invite_acceptances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_acceptances" ADD CONSTRAINT "invite_acceptances_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

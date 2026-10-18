-- AlterTable
ALTER TABLE "chat_settings" ADD COLUMN     "requireRules" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rulesText" TEXT;

-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "groupType" VARCHAR(20);

-- CreateTable
CREATE TABLE "group_media_requests" (
    "id" VARCHAR(25) NOT NULL,
    "groupId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "certNumber" VARCHAR(100),
    "cert_issued_at" BIGINT,
    "certIssuer" VARCHAR(255),
    "certMediaName" VARCHAR(255),
    "certFounder" VARCHAR(255),
    "certInn" VARCHAR(20),
    "certOgrn" VARCHAR(20),
    "documents" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedByAdminId" TEXT,
    "reviewComment" TEXT,
    "reviewedAt" BIGINT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "group_media_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_media_requests_groupId_idx" ON "group_media_requests"("groupId");

-- CreateIndex
CREATE INDEX "group_media_requests_status_idx" ON "group_media_requests"("status");

-- AddForeignKey
ALTER TABLE "group_media_requests" ADD CONSTRAINT "group_media_requests_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "chat_settings" ADD COLUMN     "allowForward" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "editPosts" VARCHAR(10),
ADD COLUMN     "enableDiscussion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideSubscribers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whoCanWrite" VARCHAR(20);

-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "memberLimit" INTEGER,
ADD COLUMN     "slug" VARCHAR(100);

-- AlterTable
ALTER TABLE "invite_links" ADD COLUMN     "groupIds" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "ttlType" TEXT NOT NULL DEFAULT 'permanent',
ADD COLUMN     "updatedAt" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "message_attachments" ADD COLUMN     "createdAt" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "storage" VARCHAR(20);

-- AlterTable
ALTER TABLE "user_bans" ADD COLUMN     "appealDeadline" BIGINT,
ADD COLUMN     "confirmations" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reportCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'temporary';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "blog_channel_subscribers" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "blog_channel_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" VARCHAR(25) NOT NULL,
    "userId" VARCHAR(25) NOT NULL,
    "contactId" VARCHAR(25) NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" VARCHAR(25) NOT NULL,
    "userId" VARCHAR(25) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "preview" VARCHAR(500) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_edits" (
    "id" VARCHAR(25) NOT NULL,
    "messageId" VARCHAR(25) NOT NULL,
    "oldText" TEXT NOT NULL,
    "newText" TEXT NOT NULL,
    "editedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "message_edits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pinned_messages" (
    "id" VARCHAR(25) NOT NULL,
    "chatId" VARCHAR(25) NOT NULL,
    "messageId" VARCHAR(25) NOT NULL,
    "pinnedBy" VARCHAR(25) NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "pinned_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drafts" (
    "id" VARCHAR(25) NOT NULL,
    "chatId" VARCHAR(25) NOT NULL,
    "userId" VARCHAR(25) NOT NULL,
    "text" TEXT NOT NULL,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" VARCHAR(25) NOT NULL,
    "userId" VARCHAR(25) NOT NULL,
    "deviceId" VARCHAR(25),
    "sessionToken" VARCHAR(255) NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "expires" BIGINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pair_tokens" (
    "id" VARCHAR(25) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "userId" VARCHAR(25) NOT NULL,
    "deviceId" VARCHAR(25),
    "expiresAt" BIGINT NOT NULL DEFAULT 0,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "pair_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" VARCHAR(25) NOT NULL,
    "chatId" VARCHAR(25) NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" BIGINT,
    "endedAt" BIGINT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_participants" (
    "id" VARCHAR(25) NOT NULL,
    "callId" VARCHAR(25) NOT NULL,
    "userId" VARCHAR(25) NOT NULL,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "videoOn" BOOLEAN NOT NULL DEFAULT false,
    "isScreenSharing" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" BIGINT NOT NULL DEFAULT 0,
    "leftAt" BIGINT,

    CONSTRAINT "call_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ban_appeals" (
    "id" VARCHAR(25) NOT NULL,
    "banId" VARCHAR(25) NOT NULL,
    "userId" VARCHAR(25) NOT NULL,
    "text" TEXT NOT NULL,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "decision" VARCHAR(20),
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "ban_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blog_channel_subscribers_channelId_idx" ON "blog_channel_subscribers"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_channel_subscribers_userId_channelId_key" ON "blog_channel_subscribers"("userId", "channelId");

-- CreateIndex
CREATE INDEX "contacts_userId_idx" ON "contacts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_userId_contactId_key" ON "contacts"("userId", "contactId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "message_edits_messageId_idx" ON "message_edits"("messageId");

-- CreateIndex
CREATE INDEX "pinned_messages_chatId_idx" ON "pinned_messages"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "pinned_messages_chatId_messageId_key" ON "pinned_messages"("chatId", "messageId");

-- CreateIndex
CREATE INDEX "drafts_userId_idx" ON "drafts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "drafts_chatId_userId_key" ON "drafts"("chatId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_isActive_idx" ON "sessions"("userId", "isActive");

-- CreateIndex
CREATE INDEX "sessions_expires_idx" ON "sessions"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "pair_tokens_token_key" ON "pair_tokens"("token");

-- CreateIndex
CREATE INDEX "pair_tokens_userId_idx" ON "pair_tokens"("userId");

-- CreateIndex
CREATE INDEX "pair_tokens_expiresAt_idx" ON "pair_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "calls_chatId_idx" ON "calls"("chatId");

-- CreateIndex
CREATE INDEX "calls_createdAt_idx" ON "calls"("createdAt");

-- CreateIndex
CREATE INDEX "call_participants_callId_idx" ON "call_participants"("callId");

-- CreateIndex
CREATE INDEX "call_participants_userId_idx" ON "call_participants"("userId");

-- CreateIndex
CREATE INDEX "ban_appeals_banId_idx" ON "ban_appeals"("banId");

-- CreateIndex
CREATE INDEX "ban_appeals_userId_idx" ON "ban_appeals"("userId");

-- CreateIndex
CREATE INDEX "ban_appeals_decision_idx" ON "ban_appeals"("decision");

-- CreateIndex
CREATE UNIQUE INDEX "chats_slug_key" ON "chats"("slug");

-- CreateIndex
CREATE INDEX "invite_links_status_idx" ON "invite_links"("status");

-- CreateIndex
CREATE INDEX "user_bans_global_idx" ON "user_bans"("global");

-- AddForeignKey
ALTER TABLE "blog_channel_subscribers" ADD CONSTRAINT "blog_channel_subscribers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_channel_subscribers" ADD CONSTRAINT "blog_channel_subscribers_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "blog_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_edits" ADD CONSTRAINT "message_edits_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pair_tokens" ADD CONSTRAINT "pair_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_participants" ADD CONSTRAINT "call_participants_callId_fkey" FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_participants" ADD CONSTRAINT "call_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ban_appeals" ADD CONSTRAINT "ban_appeals_banId_fkey" FOREIGN KEY ("banId") REFERENCES "user_bans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ban_appeals" ADD CONSTRAINT "ban_appeals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'banned', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "TwoFAMethod" AS ENUM ('totp', 'sms', 'email');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('web', 'desktop', 'android', 'ios');

-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('direct', 'group', 'channel');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'read');

-- CreateEnum
CREATE TYPE "BlogPostStatus" AS ENUM ('draft', 'published', 'rejected');

-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('open', 'closed', 'on_hold');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('new', 'review', 'interview', 'rejected', 'hired');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('phone', 'video', 'in_person', 'take_home');

-- CreateEnum
CREATE TYPE "InterviewResult" AS ENUM ('pass', 'fail', 'pending');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'file', 'voice', 'video', 'poll', 'system');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('pending', 'manual_pending', 'yookassa_pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "DonationProvider" AS ENUM ('sbp_manual', 'yookassa');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(25) NOT NULL,
    "email" VARCHAR(255),
    "username" VARCHAR(50),
    "passwordHash" VARCHAR(255),
    "phone" VARCHAR(20),
    "avatarUrl" VARCHAR(500),
    "displayName" VARCHAR(100),
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "language" TEXT NOT NULL DEFAULT 'ru',
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" BIGINT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_fa_secrets" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" VARCHAR(255) NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "method" "TwoFAMethod" NOT NULL DEFAULT 'totp',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "two_fa_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "providerId" VARCHAR(255) NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" BIGINT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL,
    "name" VARCHAR(100),
    "platform" VARCHAR(50),
    "pushToken" VARCHAR(255),
    "lastIp" VARCHAR(45),
    "lastActive" BIGINT NOT NULL DEFAULT 0,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_bans" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "global" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" BIGINT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "user_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" VARCHAR(25) NOT NULL,
    "type" "ChatType" NOT NULL DEFAULT 'direct',
    "name" VARCHAR(255),
    "avatarUrl" VARCHAR(500),
    "inviteCode" VARCHAR(20),
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_chats" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" BIGINT NOT NULL DEFAULT 0,
    "lastRead" BIGINT NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "unread" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_settings" (
    "id" VARCHAR(25) NOT NULL,
    "chatId" TEXT NOT NULL,
    "allowMessages" BOOLEAN NOT NULL DEFAULT true,
    "allowMedia" BOOLEAN NOT NULL DEFAULT true,
    "allowPolls" BOOLEAN NOT NULL DEFAULT true,
    "allowStories" BOOLEAN NOT NULL DEFAULT false,
    "requiredApprove" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" VARCHAR(25) NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'text',
    "content" TEXT,
    "replyToId" VARCHAR(25),
    "editCount" INTEGER NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" VARCHAR(25) NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "thumbnail" VARCHAR(500),
    "size" BIGINT NOT NULL DEFAULT 0,
    "name" VARCHAR(255),
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" VARCHAR(25) NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" VARCHAR(20) NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_read_counts" (
    "id" VARCHAR(25) NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "message_read_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_links" (
    "id" VARCHAR(25) NOT NULL,
    "chatId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" BIGINT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "invite_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "website" VARCHAR(500),
    "socialLinks" TEXT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_profiles" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(100),
    "avatarUrl" VARCHAR(500),
    "bio" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "public_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "mediaUrl" VARCHAR(500) NOT NULL,
    "thumbnail" VARCHAR(500),
    "expiresAt" BIGINT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_views" (
    "id" VARCHAR(25) NOT NULL,
    "storyId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "story_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_reactions" (
    "id" VARCHAR(25) NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" VARCHAR(20) NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "story_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" VARCHAR(25) NOT NULL,
    "chatId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "allowsMultiple" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" BIGINT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_votes" (
    "id" VARCHAR(25) NOT NULL,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionIndex" INTEGER NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_bans" (
    "id" VARCHAR(25) NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "reason" TEXT,
    "expiresAt" BIGINT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "chat_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_users" (
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("blockerId","blockedId")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" VARCHAR(25) NOT NULL,
    "authorId" TEXT NOT NULL,
    "channelId" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "BlogPostStatus" NOT NULL DEFAULT 'draft',
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_comments" (
    "id" VARCHAR(25) NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "blog_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_channels" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "avatarUrl" VARCHAR(500),
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "blog_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post_categories" (
    "id" VARCHAR(25) NOT NULL,
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "blog_post_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_pages" (
    "id" VARCHAR(25) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastEditorId" TEXT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "knowledge_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "headId" TEXT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacancies" (
    "id" VARCHAR(25) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "departmentId" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT,
    "salary" VARCHAR(50),
    "status" "VacancyStatus" NOT NULL DEFAULT 'open',
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" VARCHAR(25) NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'new',
    "coverLetter" TEXT,
    "resumeUrl" VARCHAR(500),
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" VARCHAR(25) NOT NULL,
    "applicationId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "date" BIGINT NOT NULL,
    "type" "InterviewType" NOT NULL,
    "notes" TEXT,
    "result" "InterviewResult",
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_tiers" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "amount" INTEGER NOT NULL,
    "features" TEXT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "donation_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "tierId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'RUB',
    "status" "DonationStatus" NOT NULL DEFAULT 'pending',
    "provider" "DonationProvider" NOT NULL DEFAULT 'sbp_manual',
    "paymentMethod" VARCHAR(50),
    "paymentIntentId" VARCHAR(255),
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_config" (
    "id" VARCHAR(25) NOT NULL,
    "mode" VARCHAR(20) NOT NULL DEFAULT 'anonymous',
    "shopId" VARCHAR(255),
    "secretKey" TEXT,
    "sbpQrUrl" VARCHAR(500) NOT NULL DEFAULT '/assets/logos/qr_helpus.jpg',
    "sbpPhoneNumber" VARCHAR(20) NOT NULL DEFAULT '89122023035',
    "sbpPhoneName" VARCHAR(255) NOT NULL DEFAULT 'Оберюхттин Иван, Сбербанк',
    "forKassaUrl" VARCHAR(500) NOT NULL DEFAULT '/for_kassa',
    "webhookActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "payment_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_requests" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "priority" VARCHAR(50),
    "motivation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idea',
    "votesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "feature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_votes" (
    "id" VARCHAR(25) NOT NULL,
    "featureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "feature_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_comments" (
    "id" VARCHAR(25) NOT NULL,
    "featureId" TEXT NOT NULL,
    "userId" TEXT,
    "parentId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "feature_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" VARCHAR(25) NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" VARCHAR(50) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "resolvedBy" TEXT,
    "resolvedAt" BIGINT,
    "action" VARCHAR(50),
    "comment" TEXT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bots" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "avatarUrl" VARCHAR(500),
    "commands" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "creatorId" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "bots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_commands" (
    "id" VARCHAR(25) NOT NULL,
    "botId" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "handler" VARCHAR(255) NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "bot_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" VARCHAR(25) NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target" VARCHAR(255) NOT NULL,
    "details" TEXT,
    "ip" VARCHAR(45),
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "targetVersion" VARCHAR(20),
    "description" TEXT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_versions" (
    "id" VARCHAR(25) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "changelog" TEXT,
    "publishedAt" BIGINT NOT NULL DEFAULT 0,
    "isLatest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "service_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_metrics" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "service_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" VARCHAR(25) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "targetAudience" VARCHAR(50) NOT NULL,
    "activeFrom" BIGINT NOT NULL,
    "activeUntil" BIGINT,
    "createdAt" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_files" (
    "id" VARCHAR(25) NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "size" BIGINT NOT NULL DEFAULT 0,
    "checksum" VARCHAR(64),
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "download_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development_statuses" (
    "id" VARCHAR(25) NOT NULL,
    "ticketNumber" INTEGER NOT NULL,
    "blockName" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "screensDone" INTEGER NOT NULL DEFAULT 0,
    "screensTotal" INTEGER NOT NULL DEFAULT 0,
    "testsPassed" INTEGER NOT NULL DEFAULT 0,
    "testsTotal" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "updatedAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "development_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" VARCHAR(25) NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "p256dh" VARCHAR(255) NOT NULL,
    "auth" VARCHAR(255) NOT NULL,
    "createdAt" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_userId_idx" ON "verification_tokens"("userId");

-- CreateIndex
CREATE INDEX "verification_tokens_token_idx" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_expiresAt_idx" ON "verification_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "two_fa_secrets_userId_key" ON "two_fa_secrets"("userId");

-- CreateIndex
CREATE INDEX "oauth_accounts_userId_idx" ON "oauth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_providerId_key" ON "oauth_accounts"("provider", "providerId");

-- CreateIndex
CREATE INDEX "devices_userId_idx" ON "devices"("userId");

-- CreateIndex
CREATE INDEX "user_bans_userId_idx" ON "user_bans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "chats_inviteCode_key" ON "chats"("inviteCode");

-- CreateIndex
CREATE INDEX "chats_createdAt_idx" ON "chats"("createdAt");

-- CreateIndex
CREATE INDEX "user_chats_chatId_idx" ON "user_chats"("chatId");

-- CreateIndex
CREATE INDEX "user_chats_userId_lastRead_idx" ON "user_chats"("userId", "lastRead");

-- CreateIndex
CREATE UNIQUE INDEX "user_chats_userId_chatId_key" ON "user_chats"("userId", "chatId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_settings_chatId_key" ON "chat_settings"("chatId");

-- CreateIndex
CREATE INDEX "messages_chatId_createdAt_idx" ON "messages"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_senderId_createdAt_idx" ON "messages"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "message_attachments_messageId_idx" ON "message_attachments"("messageId");

-- CreateIndex
CREATE INDEX "message_reactions_messageId_idx" ON "message_reactions"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_key" ON "message_reactions"("messageId", "userId");

-- CreateIndex
CREATE INDEX "message_read_counts_messageId_idx" ON "message_read_counts"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "message_read_counts_messageId_userId_key" ON "message_read_counts"("messageId", "userId");

-- CreateIndex
CREATE INDEX "invite_links_chatId_idx" ON "invite_links"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "invite_links_chatId_code_key" ON "invite_links"("chatId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "public_profiles_userId_key" ON "public_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "public_profiles_username_key" ON "public_profiles"("username");

-- CreateIndex
CREATE INDEX "public_profiles_username_idx" ON "public_profiles"("username");

-- CreateIndex
CREATE INDEX "stories_userId_expiresAt_idx" ON "stories"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "stories_expiresAt_idx" ON "stories"("expiresAt");

-- CreateIndex
CREATE INDEX "story_views_storyId_idx" ON "story_views"("storyId");

-- CreateIndex
CREATE INDEX "story_views_viewerId_idx" ON "story_views"("viewerId");

-- CreateIndex
CREATE UNIQUE INDEX "story_views_storyId_viewerId_key" ON "story_views"("storyId", "viewerId");

-- CreateIndex
CREATE INDEX "story_reactions_storyId_idx" ON "story_reactions"("storyId");

-- CreateIndex
CREATE INDEX "story_reactions_userId_idx" ON "story_reactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "story_reactions_storyId_userId_emoji_key" ON "story_reactions"("storyId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "polls_chatId_idx" ON "polls"("chatId");

-- CreateIndex
CREATE INDEX "polls_creatorId_idx" ON "polls"("creatorId");

-- CreateIndex
CREATE INDEX "poll_votes_pollId_idx" ON "poll_votes"("pollId");

-- CreateIndex
CREATE INDEX "poll_votes_userId_idx" ON "poll_votes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_pollId_userId_key" ON "poll_votes"("pollId", "userId");

-- CreateIndex
CREATE INDEX "chat_bans_chatId_idx" ON "chat_bans"("chatId");

-- CreateIndex
CREATE INDEX "chat_bans_userId_idx" ON "chat_bans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_bans_chatId_userId_key" ON "chat_bans"("chatId", "userId");

-- CreateIndex
CREATE INDEX "blocked_users_blockerId_idx" ON "blocked_users"("blockerId");

-- CreateIndex
CREATE INDEX "blocked_users_blockedId_idx" ON "blocked_users"("blockedId");

-- CreateIndex
CREATE INDEX "blog_posts_authorId_idx" ON "blog_posts"("authorId");

-- CreateIndex
CREATE INDEX "blog_posts_channelId_idx" ON "blog_posts"("channelId");

-- CreateIndex
CREATE INDEX "blog_posts_channelId_status_createdAt_idx" ON "blog_posts"("channelId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");

-- CreateIndex
CREATE INDEX "blog_posts_createdAt_idx" ON "blog_posts"("createdAt");

-- CreateIndex
CREATE INDEX "blog_comments_postId_idx" ON "blog_comments"("postId");

-- CreateIndex
CREATE INDEX "blog_comments_authorId_idx" ON "blog_comments"("authorId");

-- CreateIndex
CREATE INDEX "blog_channels_name_idx" ON "blog_channels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE INDEX "blog_categories_slug_idx" ON "blog_categories"("slug");

-- CreateIndex
CREATE INDEX "blog_post_categories_postId_idx" ON "blog_post_categories"("postId");

-- CreateIndex
CREATE INDEX "blog_post_categories_categoryId_idx" ON "blog_post_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_categories_postId_categoryId_key" ON "blog_post_categories"("postId", "categoryId");

-- CreateIndex
CREATE INDEX "knowledge_pages_categoryId_idx" ON "knowledge_pages"("categoryId");

-- CreateIndex
CREATE INDEX "knowledge_pages_createdAt_idx" ON "knowledge_pages"("createdAt");

-- CreateIndex
CREATE INDEX "departments_parentId_idx" ON "departments"("parentId");

-- CreateIndex
CREATE INDEX "vacancies_departmentId_idx" ON "vacancies"("departmentId");

-- CreateIndex
CREATE INDEX "vacancies_status_idx" ON "vacancies"("status");

-- CreateIndex
CREATE INDEX "vacancies_createdAt_idx" ON "vacancies"("createdAt");

-- CreateIndex
CREATE INDEX "applications_vacancyId_idx" ON "applications"("vacancyId");

-- CreateIndex
CREATE INDEX "applications_applicantId_idx" ON "applications"("applicantId");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "interviews_applicationId_idx" ON "interviews"("applicationId");

-- CreateIndex
CREATE INDEX "interviews_interviewerId_idx" ON "interviews"("interviewerId");

-- CreateIndex
CREATE INDEX "interviews_date_idx" ON "interviews"("date");

-- CreateIndex
CREATE INDEX "donation_tiers_amount_idx" ON "donation_tiers"("amount");

-- CreateIndex
CREATE INDEX "donations_userId_idx" ON "donations"("userId");

-- CreateIndex
CREATE INDEX "donations_status_idx" ON "donations"("status");

-- CreateIndex
CREATE INDEX "donations_createdAt_idx" ON "donations"("createdAt");

-- CreateIndex
CREATE INDEX "donations_provider_idx" ON "donations"("provider");

-- CreateIndex
CREATE INDEX "feature_requests_userId_idx" ON "feature_requests"("userId");

-- CreateIndex
CREATE INDEX "feature_requests_status_idx" ON "feature_requests"("status");

-- CreateIndex
CREATE INDEX "feature_requests_status_votesCount_idx" ON "feature_requests"("status", "votesCount");

-- CreateIndex
CREATE INDEX "feature_requests_createdAt_idx" ON "feature_requests"("createdAt");

-- CreateIndex
CREATE INDEX "feature_requests_votesCount_idx" ON "feature_requests"("votesCount");

-- CreateIndex
CREATE INDEX "feature_votes_featureId_idx" ON "feature_votes"("featureId");

-- CreateIndex
CREATE INDEX "feature_votes_userId_idx" ON "feature_votes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_votes_featureId_userId_key" ON "feature_votes"("featureId", "userId");

-- CreateIndex
CREATE INDEX "feature_comments_featureId_idx" ON "feature_comments"("featureId");

-- CreateIndex
CREATE INDEX "feature_comments_userId_idx" ON "feature_comments"("userId");

-- CreateIndex
CREATE INDEX "feature_comments_parentId_idx" ON "feature_comments"("parentId");

-- CreateIndex
CREATE INDEX "reports_reporterId_idx" ON "reports"("reporterId");

-- CreateIndex
CREATE INDEX "reports_targetId_idx" ON "reports"("targetId");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_createdAt_idx" ON "reports"("createdAt");

-- CreateIndex
CREATE INDEX "bots_isPublic_idx" ON "bots"("isPublic");

-- CreateIndex
CREATE INDEX "bots_creatorId_idx" ON "bots"("creatorId");

-- CreateIndex
CREATE INDEX "bots_createdAt_idx" ON "bots"("createdAt");

-- CreateIndex
CREATE INDEX "bot_commands_botId_idx" ON "bot_commands"("botId");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_name_key" ON "feature_flags"("name");

-- CreateIndex
CREATE INDEX "feature_flags_enabled_idx" ON "feature_flags"("enabled");

-- CreateIndex
CREATE INDEX "feature_flags_targetVersion_idx" ON "feature_flags"("targetVersion");

-- CreateIndex
CREATE INDEX "service_versions_publishedAt_idx" ON "service_versions"("publishedAt");

-- CreateIndex
CREATE INDEX "service_versions_isLatest_idx" ON "service_versions"("isLatest");

-- CreateIndex
CREATE UNIQUE INDEX "service_versions_version_key" ON "service_versions"("version");

-- CreateIndex
CREATE INDEX "service_metrics_name_idx" ON "service_metrics"("name");

-- CreateIndex
CREATE INDEX "service_metrics_timestamp_idx" ON "service_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "announcements_targetAudience_idx" ON "announcements"("targetAudience");

-- CreateIndex
CREATE INDEX "announcements_activeFrom_idx" ON "announcements"("activeFrom");

-- CreateIndex
CREATE INDEX "announcements_activeUntil_idx" ON "announcements"("activeUntil");

-- CreateIndex
CREATE INDEX "download_files_platform_idx" ON "download_files"("platform");

-- CreateIndex
CREATE INDEX "download_files_version_idx" ON "download_files"("version");

-- CreateIndex
CREATE INDEX "download_files_createdAt_idx" ON "download_files"("createdAt");

-- CreateIndex
CREATE INDEX "development_statuses_ticketNumber_idx" ON "development_statuses"("ticketNumber");

-- CreateIndex
CREATE INDEX "development_statuses_blockName_idx" ON "development_statuses"("blockName");

-- CreateIndex
CREATE INDEX "development_statuses_status_idx" ON "development_statuses"("status");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "push_subscriptions_endpoint_idx" ON "push_subscriptions"("endpoint");

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_fa_secrets" ADD CONSTRAINT "two_fa_secrets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bans" ADD CONSTRAINT "user_bans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bans" ADD CONSTRAINT "user_bans_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_chats" ADD CONSTRAINT "user_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_chats" ADD CONSTRAINT "user_chats_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_settings" ADD CONSTRAINT "chat_settings_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_read_counts" ADD CONSTRAINT "message_read_counts_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_read_counts" ADD CONSTRAINT "message_read_counts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_links" ADD CONSTRAINT "invite_links_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_links" ADD CONSTRAINT "invite_links_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_profiles" ADD CONSTRAINT "public_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_reactions" ADD CONSTRAINT "story_reactions_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_reactions" ADD CONSTRAINT "story_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_bans" ADD CONSTRAINT "chat_bans_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_bans" ADD CONSTRAINT "chat_bans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_bans" ADD CONSTRAINT "chat_bans_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "blog_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_categories" ADD CONSTRAINT "blog_post_categories_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_categories" ADD CONSTRAINT "blog_post_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_pages" ADD CONSTRAINT "knowledge_pages_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_pages" ADD CONSTRAINT "knowledge_pages_lastEditorId_fkey" FOREIGN KEY ("lastEditorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_headId_fkey" FOREIGN KEY ("headId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "donation_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_votes" ADD CONSTRAINT "feature_votes_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "feature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_votes" ADD CONSTRAINT "feature_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_comments" ADD CONSTRAINT "feature_comments_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "feature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_comments" ADD CONSTRAINT "feature_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_comments" ADD CONSTRAINT "feature_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "feature_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bots" ADD CONSTRAINT "bots_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_commands" ADD CONSTRAINT "bot_commands_botId_fkey" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


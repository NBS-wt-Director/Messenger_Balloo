
[+] Added enums
  - UserStatus
  - TwoFAMethod
  - DeviceType
  - ChatType
  - MessageStatus
  - BlogPostStatus
  - VacancyStatus
  - ApplicationStatus
  - InterviewType
  - InterviewResult
  - MessageType
  - DonationStatus
  - DonationProvider
  - ReportStatus

[+] Added tables
  - users
  - two_fa_secrets
  - oauth_accounts
  - devices
  - user_bans
  - chats
  - user_chats
  - chat_settings
  - messages
  - message_attachments
  - message_reactions
  - message_read_counts
  - invite_links
  - profiles
  - public_profiles
  - stories
  - story_views
  - story_reactions
  - polls
  - poll_votes
  - chat_bans
  - blocked_users
  - blog_posts
  - blog_comments
  - blog_channels
  - blog_categories
  - blog_post_categories
  - knowledge_pages
  - departments
  - vacancies
  - applications
  - interviews
  - donation_tiers
  - donations
  - payment_config
  - feature_requests
  - feature_votes
  - feature_comments
  - reports
  - bots
  - bot_commands
  - audit_logs
  - feature_flags
  - service_versions
  - service_metrics
  - announcements
  - download_files
  - development_statuses

[*] Changed the `announcements` table
  [+] Added index on columns (targetAudience)
  [+] Added index on columns (activeFrom)
  [+] Added index on columns (activeUntil)

[*] Changed the `applications` table
  [+] Added index on columns (vacancyId)
  [+] Added index on columns (applicantId)
  [+] Added index on columns (status)
  [+] Added foreign key on columns (vacancyId)
  [+] Added foreign key on columns (applicantId)

[*] Changed the `audit_logs` table
  [+] Added index on columns (adminId)
  [+] Added index on columns (action)
  [+] Added index on columns (createdAt)
  [+] Added foreign key on columns (adminId)

[*] Changed the `blocked_users` table
  [+] Added index on columns (blockerId)
  [+] Added index on columns (blockedId)
  [+] Added foreign key on columns (blockerId)
  [+] Added foreign key on columns (blockedId)

[*] Changed the `blog_categories` table
  [+] Added unique index on columns (slug)
  [+] Added index on columns (slug)

[*] Changed the `blog_channels` table
  [+] Added index on columns (name)

[*] Changed the `blog_comments` table
  [+] Added index on columns (postId)
  [+] Added index on columns (authorId)
  [+] Added foreign key on columns (postId)
  [+] Added foreign key on columns (authorId)

[*] Changed the `blog_post_categories` table
  [+] Added index on columns (postId)
  [+] Added index on columns (categoryId)
  [+] Added unique index on columns (postId, categoryId)
  [+] Added foreign key on columns (postId)
  [+] Added foreign key on columns (categoryId)

[*] Changed the `blog_posts` table
  [+] Added index on columns (authorId)
  [+] Added index on columns (channelId)
  [+] Added index on columns (channelId, status, createdAt)
  [+] Added index on columns (status)
  [+] Added index on columns (createdAt)
  [+] Added foreign key on columns (authorId)
  [+] Added foreign key on columns (channelId)

[*] Changed the `bot_commands` table
  [+] Added index on columns (botId)
  [+] Added foreign key on columns (botId)

[*] Changed the `bots` table
  [+] Added index on columns (isPublic)
  [+] Added index on columns (creatorId)
  [+] Added index on columns (createdAt)
  [+] Added foreign key on columns (creatorId)

[*] Changed the `chat_bans` table
  [+] Added index on columns (chatId)
  [+] Added index on columns (userId)
  [+] Added unique index on columns (chatId, userId)
  [+] Added foreign key on columns (chatId)
  [+] Added foreign key on columns (userId)
  [+] Added foreign key on columns (adminId)

[*] Changed the `chat_settings` table
  [+] Added unique index on columns (chatId)
  [+] Added foreign key on columns (chatId)

[*] Changed the `chats` table
  [+] Added unique index on columns (inviteCode)
  [+] Added index on columns (createdAt)

[*] Changed the `departments` table
  [+] Added index on columns (parentId)
  [+] Added foreign key on columns (parentId)
  [+] Added foreign key on columns (headId)

[*] Changed the `development_statuses` table
  [+] Added index on columns (ticketNumber)
  [+] Added index on columns (blockName)
  [+] Added index on columns (status)

[*] Changed the `devices` table
  [+] Added index on columns (userId)
  [+] Added foreign key on columns (userId)

[*] Changed the `donation_tiers` table
  [+] Added index on columns (amount)

[*] Changed the `donations` table
  [+] Added index on columns (userId)
  [+] Added index on columns (status)
  [+] Added index on columns (createdAt)
  [+] Added index on columns (provider)
  [+] Added foreign key on columns (userId)
  [+] Added foreign key on columns (tierId)

[*] Changed the `download_files` table
  [+] Added index on columns (platform)
  [+] Added index on columns (version)
  [+] Added index on columns (createdAt)

[*] Changed the `feature_comments` table
  [+] Added index on columns (featureId)
  [+] Added index on columns (userId)
  [+] Added index on columns (parentId)
  [+] Added foreign key on columns (featureId)
  [+] Added foreign key on columns (userId)
  [+] Added foreign key on columns (parentId)

[*] Changed the `feature_flags` table
  [+] Added unique index on columns (name)
  [+] Added index on columns (enabled)
  [+] Added index on columns (targetVersion)

[*] Changed the `feature_requests` table
  [+] Added index on columns (userId)
  [+] Added index on columns (status)
  [+] Added index on columns (status, votesCount)
  [+] Added index on columns (createdAt)
  [+] Added index on columns (votesCount)
  [+] Added foreign key on columns (userId)

[*] Changed the `feature_votes` table
  [+] Added index on columns (featureId)
  [+] Added index on columns (userId)
  [+] Added unique index on columns (featureId, userId)
  [+] Added foreign key on columns (featureId)
  [+] Added foreign key on columns (userId)

[*] Changed the `interviews` table
  [+] Added index on columns (applicationId)
  [+] Added index on columns (interviewerId)
  [+] Added index on columns (date)
  [+] Added foreign key on columns (applicationId)
  [+] Added foreign key on columns (interviewerId)

[*] Changed the `invite_links` table
  [+] Added index on columns (chatId)
  [+] Added unique index on columns (chatId, code)
  [+] Added foreign key on columns (chatId)
  [+] Added foreign key on columns (creatorId)

[*] Changed the `knowledge_pages` table
  [+] Added index on columns (categoryId)
  [+] Added index on columns (createdAt)
  [+] Added foreign key on columns (categoryId)
  [+] Added foreign key on columns (lastEditorId)

[*] Changed the `message_attachments` table
  [+] Added index on columns (messageId)
  [+] Added foreign key on columns (messageId)

[*] Changed the `message_reactions` table
  [+] Added index on columns (messageId)
  [+] Added unique index on columns (messageId, userId)
  [+] Added foreign key on columns (messageId)
  [+] Added foreign key on columns (userId)

[*] Changed the `message_read_counts` table
  [+] Added index on columns (messageId)
  [+] Added unique index on columns (messageId, userId)
  [+] Added foreign key on columns (messageId)
  [+] Added foreign key on columns (userId)

[*] Changed the `messages` table
  [+] Added index on columns (chatId, createdAt)
  [+] Added index on columns (senderId)
  [+] Added index on columns (senderId, createdAt)
  [+] Added foreign key on columns (chatId)
  [+] Added foreign key on columns (senderId)
  [+] Added foreign key on columns (replyToId)

[*] Changed the `oauth_accounts` table
  [+] Added index on columns (userId)
  [+] Added unique index on columns (provider, providerId)
  [+] Added foreign key on columns (userId)

[*] Changed the `poll_votes` table
  [+] Added index on columns (pollId)
  [+] Added index on columns (userId)
  [+] Added unique index on columns (pollId, userId)
  [+] Added foreign key on columns (pollId)
  [+] Added foreign key on columns (userId)

[*] Changed the `polls` table
  [+] Added index on columns (chatId)
  [+] Added index on columns (creatorId)
  [+] Added foreign key on columns (chatId)
  [+] Added foreign key on columns (creatorId)

[*] Changed the `profiles` table
  [+] Added unique index on columns (userId)
  [+] Added foreign key on columns (userId)

[*] Changed the `public_profiles` table
  [+] Added unique index on columns (userId)
  [+] Added unique index on columns (username)
  [+] Added index on columns (username)
  [+] Added foreign key on columns (userId)

[*] Changed the `reports` table
  [+] Added index on columns (reporterId)
  [+] Added index on columns (targetId)
  [+] Added index on columns (status)
  [+] Added index on columns (createdAt)
  [+] Added foreign key on columns (reporterId)
  [+] Added foreign key on columns (targetId)
  [+] Added foreign key on columns (resolvedBy)

[*] Changed the `service_metrics` table
  [+] Added index on columns (name)
  [+] Added index on columns (timestamp)

[*] Changed the `service_versions` table
  [+] Added index on columns (publishedAt)
  [+] Added index on columns (isLatest)
  [+] Added unique index on columns (version)

[*] Changed the `stories` table
  [+] Added index on columns (userId, expiresAt)
  [+] Added index on columns (expiresAt)
  [+] Added foreign key on columns (userId)

[*] Changed the `story_reactions` table
  [+] Added index on columns (storyId)
  [+] Added index on columns (userId)
  [+] Added unique index on columns (storyId, userId, emoji)
  [+] Added foreign key on columns (storyId)
  [+] Added foreign key on columns (userId)

[*] Changed the `story_views` table
  [+] Added index on columns (storyId)
  [+] Added index on columns (viewerId)
  [+] Added unique index on columns (storyId, viewerId)
  [+] Added foreign key on columns (storyId)
  [+] Added foreign key on columns (viewerId)

[*] Changed the `two_fa_secrets` table
  [+] Added unique index on columns (userId)
  [+] Added foreign key on columns (userId)

[*] Changed the `user_bans` table
  [+] Added index on columns (userId)
  [+] Added foreign key on columns (userId)
  [+] Added foreign key on columns (adminId)

[*] Changed the `user_chats` table
  [+] Added index on columns (chatId)
  [+] Added index on columns (userId, lastRead)
  [+] Added unique index on columns (userId, chatId)
  [+] Added foreign key on columns (userId)
  [+] Added foreign key on columns (chatId)

[*] Changed the `users` table
  [+] Added unique index on columns (email)
  [+] Added unique index on columns (username)
  [+] Added unique index on columns (phone)

[*] Changed the `vacancies` table
  [+] Added index on columns (departmentId)
  [+] Added index on columns (status)
  [+] Added index on columns (createdAt)
  [+] Added foreign key on columns (departmentId)

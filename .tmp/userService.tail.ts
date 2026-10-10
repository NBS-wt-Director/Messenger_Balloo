// ============================================================
// GET /api/users/me/export — выгрузка данных пользователя (152-ФЗ)
// ============================================================

/**
 * Собирает все данные пользователя в один объект для выгрузки.
 *
 * Названия полей и связей сверены с packages/shared/prisma/schema.prisma.
 * Секреты в выгрузку не попадают намеренно: passwordHash, secret и backupCodes
 * двухфакторной аутентификации, access/refresh токены OAuth-аккаунтов,
 * pushToken устройства, verification tokens, ключи push-подписок.
 */
export const exportUserData = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      publicProfile: true,
    },
  });

  if (!user) {
    throw new Error('Пользователь не найден');
  }

  const [
    devices,
    oauthAccounts,
    twoFactor,
    userChats,
    messages,
    messageReactions,
    messageReads,
    stories,
    storyViews,
    storyReactions,
    polls,
    pollVotes,
    inviteLinks,
    donations,
    featureRequests,
    featureVotes,
    featureComments,
    reports,
    blogPosts,
    blogComments,
    knowledgePages,
    applications,
    interviews,
    supportTickets,
    supportMessages,
    bots,
    blockedUsers,
    blockedByUsers,
    bans,
    chatBans,
    pushSubscriptions,
  ] = await Promise.all([
    prisma.device.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        name: true,
        platform: true,
        lastIp: true,
        lastActive: true,
        createdAt: true,
      },
    }),
    prisma.oAuthAccount.findMany({
      where: { userId },
      select: {
        provider: true,
        providerId: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    prisma.twoFASecret.findMany({
      where: { userId },
      select: {
        method: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.userChat.findMany({
      where: { userId },
      select: {
        chatId: true,
        role: true,
        joinedAt: true,
        lastRead: true,
        pinned: true,
        muted: true,
        unread: true,
      },
    }),
    prisma.message.findMany({
      where: { senderId: userId },
      select: {
        id: true,
        chatId: true,
        type: true,
        content: true,
        replyToId: true,
        editCount: true,
        deleted: true,
        pinned: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.messageReaction.findMany({
      where: { userId },
      select: {
        messageId: true,
        emoji: true,
        createdAt: true,
      },
    }),
    prisma.messageReadCount.findMany({
      where: { userId },
      select: {
        messageId: true,
        readAt: true,
      },
    }),
    prisma.story.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        mediaUrl: true,
        thumbnail: true,
        expiresAt: true,
        viewCount: true,
        createdAt: true,
      },
    }),
    prisma.storyView.findMany({
      where: { viewerId: userId },
      select: {
        storyId: true,
        viewedAt: true,
      },
    }),
    prisma.storyReaction.findMany({
      where: { userId },
      select: {
        storyId: true,
        emoji: true,
        createdAt: true,
      },
    }),
    prisma.poll.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        chatId: true,
        question: true,
        options: true,
        allowsMultiple: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    prisma.pollVote.findMany({
      where: { userId },
      select: {
        pollId: true,
        optionIndex: true,
        createdAt: true,
      },
    }),
    prisma.inviteLink.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        chatId: true,
        code: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    prisma.donation.findMany({
      where: { userId },
      select: {
        id: true,
        tierId: true,
        amount: true,
        currency: true,
        status: true,
        provider: true,
        paymentMethod: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.featureRequest.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        priority: true,
        motivation: true,
        status: true,
        votesCount: true,
        isAnonymous: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.featureVote.findMany({
      where: { userId },
      select: {
        featureId: true,
        createdAt: true,
      },
    }),
    prisma.featureComment.findMany({
      where: { userId },
      select: {
        id: true,
        featureId: true,
        parentId: true,
        text: true,
        createdAt: true,
      },
    }),
    prisma.report.findMany({
      where: { reporterId: userId },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        content: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.blogPost.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        channelId: true,
        title: true,
        content: true,
        status: true,
        views: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.blogComment.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        postId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.knowledgePage.findMany({
      where: { lastEditorId: userId },
      select: {
        id: true,
        categoryId: true,
        title: true,
        content: true,
        version: true,
        updatedAt: true,
      },
    }),
    prisma.application.findMany({
      where: { applicantId: userId },
      select: {
        id: true,
        vacancyId: true,
        status: true,
        coverLetter: true,
        resumeUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.interview.findMany({
      where: { interviewerId: userId },
      select: {
        id: true,
        applicationId: true,
        date: true,
        type: true,
        notes: true,
        result: true,
        createdAt: true,
      },
    }),
    prisma.supportTicket.findMany({
      where: { userId },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.supportMessage.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        ticketId: true,
        text: true,
        createdAt: true,
      },
    }),
    prisma.bot.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        commands: true,
        isPublic: true,
        createdAt: true,
      },
    }),
    prisma.blockedUser.findMany({
      where: { blockerId: userId },
      select: {
        blockedId: true,
        createdAt: true,
      },
    }),
    prisma.blockedUser.findMany({
      where: { blockedId: userId },
      select: {
        blockerId: true,
        createdAt: true,
      },
    }),
    prisma.userBan.findMany({
      where: { userId },
      select: {
        id: true,
        reason: true,
        global: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    prisma.chatBan.findMany({
      where: { userId },
      select: {
        id: true,
        chatId: true,
        reason: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        endpoint: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      language: user.language,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    profile: user.profile
      ? {
          bio: user.profile.bio,
          website: user.profile.website,
          socialLinks: user.profile.socialLinks ? JSON.parse(user.profile.socialLinks) : null,
        }
      : null,
    publicProfile: user.publicProfile
      ? {
          username: user.publicProfile.username,
          displayName: user.publicProfile.displayName,
          avatarUrl: user.publicProfile.avatarUrl,
          bio: user.publicProfile.bio,
          isPrivate: user.publicProfile.isPrivate,
        }
      : null,
    devices,
    oauthAccounts,
    twoFactor,
    userChats,
    messages,
    messageReactions,
    messageReads,
    stories,
    storyViews,
    storyReactions,
    polls,
    pollVotes,
    inviteLinks,
    donations,
    featureRequests,
    featureVotes,
    featureComments,
    reports,
    blogPosts,
    blogComments,
    knowledgePages,
    applications,
    interviews,
    supportTickets,
    supportMessages,
    bots,
    blockedUsers,
    blockedByUsers,
    bans,
    chatBans,
    pushSubscriptions,
  };
};

// ============================================================
// DELETE /api/users/me — мягкое удаление аккаунта пользователем
// ============================================================

/**
 * Мягкое удаление собственного аккаунта (self-service).
 *
 *  - status → 'deleted' — запись не стирается физически, см. docs/retention-policy.md;
 *  - email заменяется служебным — email в схеме @unique, иначе освободившийся
 *    адрес нельзя было бы использовать при повторной регистрации;
 *  - вход перестаёт работать: authRequired отклоняет пользователей не со
 *    статусом 'active', refresh-токен проверяет тот же статус.
 */
export const deleteMe = async (userId: string): Promise<{ message: string }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true },
  });

  if (!user) {
    throw new Error('Пользователь не найден');
  }

  if (user.status === 'deleted') {
    throw new Error('Аккаунт уже удалён');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'deleted',
      email: `${userId}.deleted@invalid`,
    },
  });

  return { message: 'Аккаунт удалён' };
};

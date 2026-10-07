import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Утилиты
// ============================================================

/**
 * Slugify: превращает имя пользователя в URL-friendly slug
 * "Иван Иванов" → "ivan-ivanov"
 * "Иван123" → "ivan123"
 */
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // удаляем спецсимволы
    .replace(/[\s_]+/g, '-')   // пробелы → дефисы
    .replace(/^-+|-+$/g, '');  // убираем дефисы по краям

/**
 * Генерация случайного username из email
 */
const generateUsernameFromEmail = (email: string): string => {
  const base = email.split('@')[0];
  const random = Math.random().toString(36).slice(2, 6);
  return `${base}-${random}`;
};

// ============================================================
// Get Me
// ============================================================

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      publicProfile: true,
      profile: true,
    },
  });

  if (!user) {
    throw new Error('Пользователь не найден');
  }

  if (user.status === 'deleted') {
    throw new Error('Аккаунт удалён');
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    status: user.status,
    language: user.language,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    publicProfile: user.publicProfile
      ? {
          id: user.publicProfile.id,
          username: user.publicProfile.username,
          displayName: user.publicProfile.displayName,
          avatarUrl: user.publicProfile.avatarUrl,
          bio: user.publicProfile.bio,
          isPrivate: user.publicProfile.isPrivate,
        }
      : null,
    profile: user.profile
      ? {
          id: user.profile.id,
          bio: user.profile.bio,
          website: user.profile.website,
          socialLinks: user.profile.socialLinks ? JSON.parse(user.profile.socialLinks) : null,
        }
      : null,
  };
};

// ============================================================
// Update Me
// ============================================================

interface UpdateMeInput {
  username?: string;
  displayName?: string;
  bio?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  avatarUrl?: string;
  language?: string;
  isPrivate?: boolean;
}

export const updateMe = async (userId: string, input: UpdateMeInput) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  // --- Проверяем уникальность username, если он меняется ---
  if (input.username !== undefined) {
    const existing = await prisma.user.findUnique({
      where: { username: input.username },
    });
    if (existing && existing.id !== userId) {
      throw new Error('Username уже занят');
    }
  }

  // --- Обновляем User ---
  const updateData: Record<string, unknown> = { updatedAt: now };
  if (input.username !== undefined) updateData.username = input.username;
  if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;
  if (input.language !== undefined) updateData.language = input.language;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // --- Обновляем/создаем PublicProfile ---
  const publicProfileUpdate: Record<string, unknown> = { updatedAt: now };
  if (input.displayName !== undefined) publicProfileUpdate.displayName = input.displayName;
  if (input.avatarUrl !== undefined) publicProfileUpdate.avatarUrl = input.avatarUrl;
  if (input.isPrivate !== undefined) publicProfileUpdate.isPrivate = input.isPrivate;

  // Если username не передан, берём из user
  if (input.username !== undefined) {
    publicProfileUpdate.username = input.username;
  } else if (user.username) {
    publicProfileUpdate.username = user.username;
  }

  const publicProfile = await prisma.publicProfile.upsert({
    where: { userId },
    update: publicProfileUpdate,
    create: {
      userId,
      username: user.username || generateUsernameFromEmail(user.email || 'user'),
      displayName: input.displayName || user.username || '',
      avatarUrl: input.avatarUrl || user.avatarUrl || null,
      isPrivate: input.isPrivate ?? false,
      createdAt: now,
      updatedAt: now,
    },
  });

  // --- Обновляем Profile (bio, website, socialLinks) ---
  const profileUpdate: Record<string, unknown> = { updatedAt: now };
  if (input.bio !== undefined) profileUpdate.bio = input.bio;
  if (input.website !== undefined) profileUpdate.website = input.website;
  if (input.socialLinks !== undefined) profileUpdate.socialLinks = JSON.stringify(input.socialLinks);

  await prisma.profile.upsert({
    where: { userId },
    update: profileUpdate,
    create: {
      userId,
      bio: input.bio || null,
      website: input.website || null,
      socialLinks: input.socialLinks ? JSON.stringify(input.socialLinks) : null,
      createdAt: now,
      updatedAt: now,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
      language: user.language,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    publicProfile: {
      id: publicProfile.id,
      username: publicProfile.username,
      displayName: publicProfile.displayName,
      avatarUrl: publicProfile.avatarUrl,
      bio: publicProfile.bio,
      isPrivate: publicProfile.isPrivate,
    },
  };
};

// ============================================================
// Get Public Profile by Username
// ============================================================

export const getPublicProfile = async (username: string, viewerId?: string) => {
  const publicProfile = await prisma.publicProfile.findUnique({
    where: { username },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!publicProfile) {
    throw new Error('Пользователь не найден');
  }

  // --- Проверка приватного профиля ---
  // Если профиль приватный и зритель не авторизован — возвращаем анонимный профиль
  if (publicProfile.isPrivate && !viewerId) {
    return {
      username: publicProfile.username,
      displayName: 'Приватный профиль',
      avatarUrl: null,
      bio: null,
      isPrivate: true,
      message: 'Этот профиль приватный',
    };
  }

  // Если профиль приватный и зритель авторизован — проверяем, не заблокирован ли
  if (publicProfile.isPrivate && viewerId) {
    const blocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: publicProfile.userId },
          { blockerId: publicProfile.userId, blockedId: viewerId },
        ],
      },
    });

    if (blocked) {
      return {
        username: publicProfile.username,
        displayName: 'Пользователь скрыт',
        avatarUrl: null,
        bio: null,
        isPrivate: true,
        message: 'Вы не можете просмотреть этот профиль',
      };
    }
  }

  // --- Возвращаем публичный профиль ---
  return {
    id: publicProfile.userId,
    username: publicProfile.username,
    displayName: publicProfile.displayName,
    avatarUrl: publicProfile.avatarUrl,
    bio: publicProfile.bio,
    isPrivate: publicProfile.isPrivate,
    profile: publicProfile.user.profile
      ? {
          bio: publicProfile.user.profile.bio,
          website: publicProfile.user.profile.website,
          socialLinks: publicProfile.user.profile.socialLinks
            ? JSON.parse(publicProfile.user.profile.socialLinks)
            : null,
        }
      : null,
  };
};

// ============================================================
// Search Users
// ============================================================

interface SearchUsersInput {
  query: string;
  page?: number;
  limit?: number;
  viewerId?: string;
}

export const searchUsers = async ({ query, page = 1, limit = 20, viewerId }: SearchUsersInput) => {
  const skip = (page - 1) * limit;

  // Ищем по username и displayName
  const searchPattern = `%${query}%`;

  const [publicProfiles, total] = await Promise.all([
    prisma.publicProfile.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { username: 'asc' },
    }),
    prisma.publicProfile.count({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
    }),
  ]);

  const profiles = publicProfiles.map((pp) => ({
    id: pp.userId,
    username: pp.username,
    displayName: pp.displayName,
    avatarUrl: pp.avatarUrl,
    bio: pp.bio,
    isPrivate: pp.isPrivate,
  }));

  return {
    profiles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

// ============================================================
// Block / Unblock User
// ============================================================

export const blockUser = async (blockerId: string, blockedId: string) => {
  if (blockerId === blockedId) {
    throw new Error('Нельзя заблокировать себя');
  }

  const blocked = await prisma.user.findUnique({
    where: { id: blockedId },
  });

  if (!blocked) {
    throw new Error('Пользователь не найден');
  }

  // Проверяем, не заблокирован ли уже
  const existing = await prisma.blockedUser.findFirst({
    where: { blockerId, blockedId },
  });

  if (existing) {
    throw new Error('Пользователь уже заблокирован');
  }

  await prisma.blockedUser.create({
    data: {
      blockerId,
      blockedId,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
    },
  });

  return { message: 'Пользователь заблокирован' };
};

export const unblockUser = async (blockerId: string, blockedId: string) => {
  const existing = await prisma.blockedUser.findFirst({
    where: { blockerId, blockedId },
  });

  if (!existing) {
    throw new Error('Пользователь не в списке заблокированных');
  }

  await prisma.blockedUser.delete({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId,
      },
    },
  });

  return { message: 'Пользователь разблокирован' };
};

// ============================================================
// Get Blocked Users
// ============================================================

export const getBlockedUsers = async (blockerId: string) => {
  const blocks = await prisma.blockedUser.findMany({
    where: { blockerId },
    include: {
      blocked: {
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return blocks.map((b) => ({
    id: b.blocked.id,
    email: b.blocked.email,
    username: b.blocked.username,
    avatarUrl: b.blocked.avatarUrl,
    status: b.blocked.status,
    blockedAt: b.createdAt,
  }));
};



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

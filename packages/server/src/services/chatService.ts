import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateUniqueInviteCode = async (): Promise<string> => {
  let code = generateInviteCode();
  let exists = true;
  while (exists) {
    const existing = await prisma.chat.findFirst({ where: { inviteCode: code } });
    if (!existing) {
      exists = false;
    } else {
      code = generateInviteCode();
    }
  }
  return code;
};

const getUserRoleInChat = async (userId: string, chatId: string): Promise<string | null> => {
  const membership = await prisma.userChat.findUnique({
    where: { userId_chatId: { userId, chatId } },
    select: { role: true },
  });
  return membership?.role ?? null;
};

const canManageMembers = (role: string): boolean => {
  return ['owner', 'admin', 'moderator'].includes(role);
};

const canDeleteChat = (role: string): boolean => {
  return role === 'owner';
};

const canEditChat = (role: string): boolean => {
  return ['owner', 'admin'].includes(role);
};

interface CreateChatInput {
  type: 'group' | 'channel';
  name: string;
  description?: string;
  avatarUrl?: string;
  memberIds?: string[];
}

export const createChat = async (ownerId: string, input: CreateChatInput) => {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const inviteCode = await generateUniqueInviteCode();

  const chat = await prisma.chat.create({
    data: {
      type: input.type === 'group' ? 'group' : 'channel',
      name: input.name,
      avatarUrl: input.avatarUrl || null,
      inviteCode,
      createdAt: now,
      updatedAt: now,
      members: {
        create: {
          userId: ownerId,
          role: 'owner',
          joinedAt: now,
          lastRead: now,
          unread: 0,
          pinned: false,
          muted: false,
        },
      },
      settings: {
        create: {
          allowMessages: true,
          allowMedia: true,
          allowPolls: true,
          allowStories: false,
          requiredApprove: false,
        },
      },
    },
    include: {
      members: true,
      settings: true,
    },
  });

  if (input.memberIds && input.type === 'group') {
    const memberData = input.memberIds.map((userId) => ({
      userId,
      chatId: chat.id,
      role: 'member',
      joinedAt: now,
      lastRead: now,
      unread: 0,
      pinned: false,
      muted: false,
    }));

    await prisma.userChat.createMany({
      data: memberData,
      skipDuplicates: true,
    });
  }

  return {
    id: chat.id,
    type: chat.type,
    name: chat.name,
    avatarUrl: chat.avatarUrl,
    inviteCode: chat.inviteCode,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    memberCount: chat.members.length,
  };
};

interface GetChatsInput {
  userId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
}

export const getChats = async ({ userId, page = 1, limit = 20, sortBy = 'lastMessage', search }: GetChatsInput) => {
  const skip = (page - 1) * limit;

  // Сначала получаем все чаты пользователя
  const memberships = await prisma.userChat.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          settings: true,
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
    skip,
    take: limit + 1,
  });

  // Фильтруем по поиску на уровне приложения
  let filtered = memberships;
  if (search && typeof search === 'string' && search.trim().length > 0) {
    const searchTrimmed = search.trim().toLowerCase();
    filtered = memberships.filter((m) => {
      const chat = m.chat;
      return chat.name && chat.name.toLowerCase().includes(searchTrimmed);
    });
  }

  let chats = filtered.map((m) => {
    const chat = m.chat;
    return {
      id: chat.id,
      type: chat.type,
      name: chat.name || '',
      avatarUrl: chat.avatarUrl,
      role: m.role,
      pinned: m.pinned,
      muted: m.muted,
      unread: Number(m.unread),
      lastRead: m.lastRead,
      inviteCode: chat.inviteCode,
      memberCount: chat._count.members,
      settings: chat.settings
        ? {
            allowMessages: chat.settings.allowMessages,
            allowMedia: chat.settings.allowMedia,
            allowPolls: chat.settings.allowPolls,
            allowStories: chat.settings.allowStories,
            requiredApprove: chat.settings.requiredApprove,
          }
        : null,
    };
  });

  if (sortBy === 'name') {
    chats.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sortBy === 'unread') {
    chats.sort((a, b) => b.unread - a.unread);
  } else {
    chats.sort((a, b) => Number(b.lastRead || 0) - Number(a.lastRead || 0));
  }

  chats.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const hasMore = chats.length > limit;
  if (hasMore) {
    chats = chats.slice(0, limit);
  }

  // Total count для пагинации
  let totalCount = filtered.length;
  if (filtered.length > limit) {
    // Если есть больше элементов, чем limit, значит есть ещё страницы
    const allCount = await prisma.userChat.count({ where: { userId } });
    totalCount = allCount;
  }

  return {
    chats,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1,
    },
  };
};

export const getChatInfo = async (chatId: string, userId?: string) => {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      settings: true,
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!chat) {
    throw new Error('Чат не найден');
  }

  const userRole = userId ? await getUserRoleInChat(userId, chatId) : null;

  if (!userRole) {
    return {
      id: chat.id,
      type: chat.type,
      name: chat.name || '',
      avatarUrl: chat.avatarUrl,
      inviteCode: chat.inviteCode,
      memberCount: chat._count.members,
      settings: chat.settings
        ? {
            allowMessages: chat.settings.allowMessages,
            allowMedia: chat.settings.allowMedia,
            allowPolls: chat.settings.allowPolls,
            allowStories: chat.settings.allowStories,
            requiredApprove: chat.settings.requiredApprove,
          }
        : null,
      isMember: false,
      role: null,
    };
  }

  return {
    id: chat.id,
    type: chat.type,
    name: chat.name || '',
    avatarUrl: chat.avatarUrl,
    inviteCode: chat.inviteCode,
    memberCount: chat._count.members,
    settings: chat.settings
      ? {
          allowMessages: chat.settings.allowMessages,
          allowMedia: chat.settings.allowMedia,
          allowPolls: chat.settings.allowPolls,
          allowStories: chat.settings.allowStories,
          requiredApprove: chat.settings.requiredApprove,
        }
      : null,
    isMember: true,
    role: userRole,
    members: chat.members.map((m) => ({
      id: m.user.id,
      username: m.user.username,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  };
};

interface UpdateChatInput {
  name?: string;
  description?: string;
  avatarUrl?: string;
}

export const updateChat = async (chatId: string, userId: string, input: UpdateChatInput) => {
  const role = await getUserRoleInChat(userId, chatId);

  if (!role) {
    throw new Error('Доступ запрещён');
  }

  if (!canEditChat(role)) {
    throw new Error('Доступ запрещён: только владелец или админ');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  const updateData: Record<string, unknown> = { updatedAt: now };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;

  const chat = await prisma.chat.update({
    where: { id: chatId },
    data: updateData,
  });

  return {
    id: chat.id,
    type: chat.type,
    name: chat.name || '',
    avatarUrl: chat.avatarUrl,
    updatedAt: chat.updatedAt,
  };
};

export const deleteChat = async (chatId: string, userId: string) => {
  const role = await getUserRoleInChat(userId, chatId);

  if (!role) {
    throw new Error('Доступ запрещён');
  }

  if (!canDeleteChat(role)) {
    throw new Error('Доступ запрещён: только владелец может удалить чат');
  }

  await prisma.chat.delete({
    where: { id: chatId },
  });

  return { message: 'Чат удалён' };
};

export const addMember = async (chatId: string, operatorId: string, memberId: string) => {
  const role = await getUserRoleInChat(operatorId, chatId);

  if (!role) {
    throw new Error('Доступ запрещён: вы не участник чата');
  }

  if (!canManageMembers(role)) {
    throw new Error('Доступ запрещён: только owner, admin или moderator');
  }

  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (!member) {
    throw new Error('Пользователь не найден');
  }

  const existing = await prisma.userChat.findUnique({
    where: { userId_chatId: { userId: memberId, chatId } },
  });

  if (existing) {
    throw new Error('Пользователь уже является участником');
  }

  const chatBan = await prisma.chatBan.findUnique({
    where: { chatId_userId: { chatId, userId: memberId } },
  });

  if (chatBan) {
    throw new Error('Пользователь заблокирован в этом чате');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  await prisma.userChat.create({
    data: {
      userId: memberId,
      chatId,
      role: 'member',
      joinedAt: now,
      lastRead: now,
      unread: 0,
      pinned: false,
      muted: false,
    },
  });

  return { message: 'Участник добавлен' };
};

export const removeMember = async (chatId: string, operatorId: string, memberId: string) => {
  const operatorRole = await getUserRoleInChat(operatorId, chatId);

  if (!operatorRole) {
    throw new Error('Доступ запрещён: вы не участник чата');
  }

  if (!canManageMembers(operatorRole)) {
    throw new Error('Доступ запрещён: только owner, admin или moderator');
  }

  if (operatorId === memberId) {
    throw new Error('Используйте leaveChat для выхода из чата');
  }

  const memberRole = await getUserRoleInChat(memberId, chatId);

  if (memberRole === 'owner') {
    throw new Error('Нельзя удалить владельца чата');
  }

  if (operatorRole === 'moderator' && (memberRole === 'admin' || memberRole === 'owner')) {
    throw new Error('Модератор не может удалять администраторов');
  }

  const existing = await prisma.userChat.findUnique({
    where: { userId_chatId: { userId: memberId, chatId } },
  });

  if (!existing) {
    throw new Error('Пользователь не является участником чата');
  }

  await prisma.userChat.delete({
    where: { userId_chatId: { userId: memberId, chatId } },
  });

  return { message: 'Участник удалён' };
};

export const joinByInvite = async (chatId: string, userId: string) => {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { settings: true },
  });

  if (!chat) {
    throw new Error('Чат не найден');
  }

  const existing = await prisma.userChat.findUnique({
    where: { userId_chatId: { userId, chatId } },
  });

  if (existing) {
    throw new Error('Вы уже являетесь участником этого чата');
  }

  const chatBan = await prisma.chatBan.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });

  if (chatBan) {
    throw new Error('Вы заблокированы в этом чате');
  }

  const needsApproval = chat.settings?.requiredApprove ?? false;
  const now = BigInt(Math.floor(Date.now() / 1000));

  if (needsApproval) {
    return {
      message: 'Запрос на вступление отправлен. Ожидает одобрения администратора.',
      needsApproval: true,
    };
  }

  if (chat.type === 'direct') {
    throw new Error('В личных чатах нет invite links');
  }

  await prisma.userChat.create({
    data: {
      userId,
      chatId,
      role: 'member',
      joinedAt: now,
      lastRead: now,
      unread: 0,
      pinned: false,
      muted: false,
    },
  });

  return { message: 'Вы присоединились к чату' };
};

interface CreateInviteLinkInput {
  maxUses?: number | null;
  expiresAt?: number | null;
}

export const createInviteLink = async (chatId: string, creatorId: string, input: CreateInviteLinkInput) => {
  const role = await getUserRoleInChat(creatorId, chatId);

  if (!role) {
    throw new Error('Доступ запрещён: вы не участник чата');
  }

  if (!canManageMembers(role)) {
    throw new Error('Доступ запрещён: только owner, admin или moderator');
  }

  const chat = await prisma.chat.findUnique({ where: { id: chatId } });

  if (!chat) {
    throw new Error('Чат не найден');
  }

  if (chat.type === 'direct') {
    throw new Error('В личных чатах нет invite links');
  }

  let code = await generateUniqueInviteCode();

  const inviteLink = await prisma.inviteLink.create({
    data: {
      chatId,
      creatorId,
      code,
      maxUses: input.maxUses ?? null,
      expiresAt: input.expiresAt ?? null,
      usedCount: 0,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
    },
  });

  return {
    id: inviteLink.id,
    chatId: inviteLink.chatId,
    code: inviteLink.code,
    url: `https://app.balloo.su/invite/${inviteLink.code}`,
    maxUses: inviteLink.maxUses,
    expiresAt: inviteLink.expiresAt,
    usedCount: inviteLink.usedCount,
    createdAt: inviteLink.createdAt,
  };
};

export const leaveChat = async (chatId: string, userId: string) => {
  const role = await getUserRoleInChat(userId, chatId);

  if (!role) {
    throw new Error('Вы не являетесь участником этого чата');
  }

  if (role === 'owner') {
    throw new Error('Владелец не может выйти из чата. Сначала передайте права другому участнику.');
  }

  await prisma.userChat.delete({
    where: { userId_chatId: { userId, chatId } },
  });

  return { message: 'Вы вышли из чата' };
};

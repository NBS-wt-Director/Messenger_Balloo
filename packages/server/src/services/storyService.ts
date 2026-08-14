import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Типы
// ============================================================

interface CreateStoryInput {
  userId: string;
  type: string; // image, video
  mediaUrl: string;
  thumbnail?: string;
  expiresAt: number; // Unix seconds
}

interface DeleteStoryInput {
  storyId: string;
  userId: string;
}

interface GetStoriesInput {
  userIds?: string[];
  limit?: number;
  before?: number; // cursor
}

interface AddStoryReactionInput {
  storyId: string;
  userId: string;
  emoji: string;
}

// ============================================================
// Создание истории
// ============================================================

export const createStory = async (input: CreateStoryInput) => {
  const { userId, type, mediaUrl, thumbnail, expiresAt } = input;

  // Валидация: expiresAt не в прошлом
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt <= now) {
    throw new Error('Срок действия должен быть в будущем');
  }

  // Валидация: максимум 50 историй в активной очереди пользователя
  const activeCount = await prisma.story.count({
    where: { userId, expiresAt: { gt: now } },
  });
  if (activeCount >= 50) {
    throw new Error('Достигнут лимит активных историй (50)');
  }

  const story = await prisma.story.create({
    data: {
      userId,
      type,
      mediaUrl,
      thumbnail,
      expiresAt,
    },
    include: {
      user: {
        include: {
          publicProfile: true,
        },
      },
      _count: {
        select: { views: true, reactions: true },
      },
    },
  });

  return story;
};

// ============================================================
// Получить истории (круг + лента)
// ============================================================

export const getStories = async (input: GetStoriesInput, viewerId?: string) => {
  const { limit = 50, before } = input;
  const now = Math.floor(Date.now() / 1000);

  let whereClause: any = {
    expiresAt: { gt: now },
  };

  // Фильтр по userIds (для круга историй конкретных пользователей)
  if (input.userIds && input.userIds.length > 0) {
    whereClause.userId = { in: input.userIds };
  }

  // Cursor pagination
  if (before) {
    whereClause.createdAt = { lt: before };
  }

  const stories = await prisma.story.findMany({
    where: whereClause,
    include: {
      user: {
        include: {
          publicProfile: true,
        },
      },
      views: viewerId
        ? { where: { viewerId }, select: { viewerId: true } }
        : false,
      _count: {
        select: { views: true, reactions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // Форматируем ответ
  const formatted = stories.map((story) => {
    const hasViewed = viewerId
      ? story.views && story.views.some((v) => v.viewerId === viewerId)
      : false;

    const pp = story.user.publicProfile;

    return {
      id: story.id,
      userId: story.userId,
      type: story.type,
      mediaUrl: story.mediaUrl,
      thumbnail: story.thumbnail,
      expiresAt: Number(story.expiresAt),
      createdAt: Number(story.createdAt),
      viewCount: story._count.views,
      reactionCount: story._count.reactions,
      hasViewed,
      user: {
        id: story.user.id,
        username: pp?.username ?? story.user.username,
        displayName: pp?.displayName,
        avatarUrl: pp?.avatarUrl ?? story.user.avatarUrl,
        isPrivate: pp?.isPrivate ?? false,
      },
    };
  });

  // Cursor для следующей страницы (самый старый created)
  const nextCursor = formatted.length > 0 ? formatted[formatted.length - 1].createdAt : null;

  return { stories: formatted, nextCursor };
};

// ============================================================
// Получить просмотры истории
// ============================================================

export const getStoryViews = async (storyId: string) => {
  const views = await prisma.storyView.findMany({
    where: { storyId },
    include: {
      viewer: {
        include: {
          publicProfile: true,
        },
      },
    },
    orderBy: { viewedAt: 'desc' },
  });

  const formatted = views.map((view) => {
    const pp = view.viewer.publicProfile;
    return {
      viewerId: view.viewer.id,
      username: pp?.username ?? view.viewer.username,
      displayName: pp?.displayName,
      avatarUrl: pp?.avatarUrl ?? view.viewer.avatarUrl,
      viewedAt: Number(view.viewedAt),
    };
  });

  return { views: formatted, total: views.length };
};

// ============================================================
// Добавить реакцию на историю
// ============================================================

export const addStoryReaction = async (input: AddStoryReactionInput) => {
  const { storyId, userId, emoji } = input;

  // Проверяем существование истории
  const story = await prisma.story.findUnique({
    where: { id: storyId },
  });

  if (!story) {
    throw new Error('История не найдена');
  }

  // Проверяем, не истекла ли история
  const now = Math.floor(Date.now() / 1000);
  if (story.expiresAt <= now) {
    throw new Error('История истекла');
  }

  // Upsert реакции (unique constraint: storyId + userId + emoji)
  const reaction = await prisma.storyReaction.upsert({
    where: {
      storyId_userId_emoji: {
        storyId,
        userId,
        emoji,
      },
    },
    create: {
      storyId,
      userId,
      emoji,
      createdAt: now,
    },
    update: {
      createdAt: now, // обновляем timestamp при повторной реакции
    },
    include: {
      user: {
        include: {
          publicProfile: true,
        },
      },
    },
  });

  return reaction;
};

// ============================================================
// Удалить историю
// ============================================================

export const deleteStory = async (input: DeleteStoryInput) => {
  const { storyId, userId } = input;

  const story = await prisma.story.findUnique({
    where: { id: storyId },
  });

  if (!story) {
    throw new Error('История не найдена');
  }

  // Проверяем: владелец или админ
  if (story.userId !== userId) {
    throw new Error('Доступ запрещён');
  }

  await prisma.story.delete({
    where: { id: storyId },
  });

  return { success: true, message: 'История удалена' };
};

// ============================================================
// Удалить истекшие истории (для cron job)
// ============================================================

export const expireOldStories = async () => {
  const now = Math.floor(Date.now() / 1000);

  const deleted = await prisma.story.deleteMany({
    where: {
      expiresAt: { lte: now },
    },
  });

  return { deletedCount: deleted.count };
};

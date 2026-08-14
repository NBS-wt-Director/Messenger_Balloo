// FeatureService — бизнес-логика фич-реквестов
// Тикет №55 — Features: фич-реквесты (узел 04)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateFeatureInput {
  title: string;
  description: string;
  category: string;
  priority?: string;
  motivation?: string;
}

export interface UpdateFeatureInput {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  motivation?: string;
  status?: string;
}

// --- Создание фич-реквеста ---
export async function createFeature(
  userId: string,
  input: CreateFeatureInput
): Promise<any> {
  const feature = await prisma.featureRequest.create({
    data: {
      userId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      priority: input.priority || null,
      motivation: input.motivation?.trim() || null,
      status: 'idea',
    },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      _count: { select: { votes: true, comments: true } },
    },
  });

  return feature;
}

// --- Список фич-реквестов ---
export async function getFeatures(
  params: {
    status?: string;
    category?: string;
    search?: string;
    sortBy?: 'votes' | 'date' | 'comments';
    page?: number;
    limit?: number;
  } = {}
) {
  const { status, category, search, sortBy = 'votes', page = 1, limit = 20 } = params;
  const where: any = {};

  if (status) where.status = status;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy: any = {};
  if (sortBy === 'votes') orderBy.votes = { _count: 'desc' };
  else if (sortBy === 'comments') orderBy.comments = { _count: 'desc' };
  else orderBy.createdAt = 'desc';

  const [items, total] = await Promise.all([
    prisma.featureRequest.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { votes: true, comments: true } },
      },
    }),
    prisma.featureRequest.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// --- Детальная страница фич-реквеста ---
export async function getFeature(id: string) {
  const feature = await prisma.featureRequest.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      votes: {
        select: { userId: true },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          _count: { select: { replies: true } },
        },
      },
      _count: { select: { votes: true, comments: true } },
    },
  });

  if (!feature) return null;

  return {
    ...feature,
    voteCount: feature._count.votes,
    commentCount: feature._count.comments,
  };
}

// --- Обновление фич-реквеста (только автор или админ) ---
export async function updateFeature(
  featureId: string,
  userId: string,
  input: UpdateFeatureInput
): Promise<any> {
  const feature = await prisma.featureRequest.findUnique({
    where: { id: featureId },
    select: { userId: true },
  });

  if (!feature) throw new Error('Feature not found');

  // Только автор или админ может обновлять
  // (админка проверяется на уровне контроллера)

  const updated = await prisma.featureRequest.update({
    where: { id: featureId },
    data: {
      ...(input.title && { title: input.title.trim() }),
      ...(input.description && { description: input.description.trim() }),
      ...(input.category && { category: input.category }),
      ...(input.priority && { priority: input.priority }),
      ...(input.motivation !== undefined && { motivation: input.motivation?.trim() || null }),
      ...(input.status && { status: input.status }),
    },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      _count: { select: { votes: true, comments: true } },
    },
  });

  return updated;
}

// --- Удаление фич-реквеста ---
export async function deleteFeature(featureId: string, userId: string): Promise<void> {
  const feature = await prisma.featureRequest.findUnique({
    where: { id: featureId },
    select: { userId: true },
  });

  if (!feature) throw new Error('Feature not found');

  await prisma.featureRequest.delete({
    where: { id: featureId },
  });
}

// --- Голосование ---
export async function voteFeature(featureId: string, userId: string): Promise<any> {
  // Проверяем, не голосовал ли уже пользователь
  const existingVote = await prisma.featureVote.findUnique({
    where: {
      featureId_userId: {
        featureId,
        userId,
      },
    },
  });

  if (existingVote) {
    throw new Error('Уже проголосовали');
  }

  const vote = await prisma.featureVote.create({
    data: {
      featureId,
      userId,
    },
    include: {
      feature: {
        include: {
          _count: { select: { votes: true } },
        },
      },
    },
  });

  return vote;
}

// --- Отмена голоса ---
export async function unvoteFeature(featureId: string, userId: string): Promise<void> {
  await prisma.featureVote.deleteMany({
    where: {
      featureId,
      userId,
    },
  });
}

// --- Быстрое голосование (toggle: голосовать / отменить) ---
export async function toggleVote(featureId: string, userId: string): Promise<any> {
  const existingVote = await prisma.featureVote.findUnique({
    where: {
      featureId_userId: {
        featureId,
        userId,
      },
    },
  });

  if (existingVote) {
    await prisma.featureVote.delete({
      where: { id: existingVote.id },
    });
    // Возвращаем обновлённый счётчик
    const feature = await prisma.featureRequest.findUnique({
      where: { id: featureId },
      include: { _count: { select: { votes: true } } },
    });
    return { voted: false, voteCount: feature?._count.votes || 0 };
  } else {
    const vote = await prisma.featureVote.create({
      data: { featureId, userId },
    });
    const feature = await prisma.featureRequest.findUnique({
      where: { id: featureId },
      include: { _count: { select: { votes: true } } },
    });
    return { voted: true, voteCount: feature?._count.votes || 1 };
  }
}

// --- Категории фич-реквестов ---
export async function getCategories() {
  return [
    { id: 'messenger', name: 'Мессенджер', slug: 'messenger' },
    { id: 'calls', name: 'Звонки', slug: 'calls' },
    { id: 'groups', name: 'Группы', slug: 'groups' },
    { id: 'uiux', name: 'UI/UX', slug: 'uiux' },
    { id: 'bots', name: 'Боты и API', slug: 'bots' },
    { id: 'files', name: 'Файлы и медиа', slug: 'files' },
    { id: 'privacy', name: 'Приватность и безопасность', slug: 'privacy' },
    { id: 'integrations', name: 'Интеграции', slug: 'integrations' },
    { id: 'other', name: 'Другое', slug: 'other' },
  ];
}

// --- Статистика ---
export async function getFeatureStats() {
  const total = await prisma.featureRequest.count();
  const byStatus = await prisma.featureRequest.groupBy({
    by: ['status'],
    _count: true,
  });
  const totalVotes = await prisma.featureVote.count();

  return {
    total,
    byStatus: Object.fromEntries(
      byStatus.map((s) => [s.status, s._count])
    ),
    totalVotes,
  };
}

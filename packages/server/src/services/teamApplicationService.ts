// Заявки в команду Balloo (тикет 1795888510).
//
// Заявка подаётся с экрана отказа админки авторизованным пользователем,
// хранит id Balloo (userId + username на момент подачи) и обрабатывается
// в админке. Принятие выдаёт роль admin и отправляет заявителю сообщение
// в direct-чат; из формы заявки админ/суперадмин может написать заявителю
// до принятия решения.

import { PrismaClient } from '@prisma/client';
import { createChat } from './chatService';
import { sendMessage } from './messageService';

const prisma = new PrismaClient();

export const TEAM_APPLICATION_STATUSES = ['new', 'accepted', 'rejected'] as const;
export type TeamApplicationStatus = (typeof TEAM_APPLICATION_STATUSES)[number];

const MAX_MESSAGE_LENGTH = 2000;
const MAX_REPLY_LENGTH = 4000;

interface SerializedApplication {
  id: string;
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  message: string | null;
  status: string;
  createdAt: number;
  updatedAt: number;
  reviewedAt: number | null;
  lastMessageAt: number | null;
}

function serialize(app: {
  id: string;
  userId: string;
  username: string | null;
  message: string | null;
  status: string;
  createdAt: bigint;
  updatedAt: bigint;
  reviewedAt: bigint | null;
  lastMessageAt: bigint | null;
  user?: {
    username: string | null;
    avatarUrl: string | null;
    publicProfile: { displayName: string | null } | null;
  } | null;
}): SerializedApplication {
  return {
    id: app.id,
    userId: app.userId,
    // id Balloo для показа: username на момент заявки, иначе текущий username.
    username: app.username ?? app.user?.username ?? null,
    displayName: app.user?.publicProfile?.displayName ?? null,
    avatarUrl: app.user?.avatarUrl ?? null,
    message: app.message,
    status: app.status,
    createdAt: Number(app.createdAt),
    updatedAt: Number(app.updatedAt),
    reviewedAt: app.reviewedAt === null ? null : Number(app.reviewedAt),
    lastMessageAt: app.lastMessageAt === null ? null : Number(app.lastMessageAt),
  };
}

const USER_SELECT = {
  username: true,
  avatarUrl: true,
  publicProfile: { select: { displayName: true } },
} as const;

// ============================================================
// Подача заявки
// ============================================================

export const createTeamApplication = async (
  userId: string,
  message?: string
): Promise<{ application: SerializedApplication; created: boolean }> => {
  const trimmed = typeof message === 'string' ? message.trim() : '';
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Сообщение заявки не должно превышать ${MAX_MESSAGE_LENGTH} символов`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, role: true, status: true },
  });
  if (!user) {
    throw new Error('Пользователь не найден');
  }
  if (user.status !== 'active') {
    throw new Error('Подать заявку может только активный аккаунт');
  }

  // Идемпотентность: повторная подача, пока заявка на рассмотрении, не создаёт
  // дубль — возвращаем существующую. Новую можно подать после решения.
  const existing = await prisma.teamApplication.findFirst({
    where: { userId, status: 'new' },
    include: { user: { select: USER_SELECT } },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) {
    return { application: serialize(existing), created: false };
  }

  const now = BigInt(Math.floor(Date.now() / 1000));
  const created = await prisma.teamApplication.create({
    data: {
      userId,
      username: user.username,
      message: trimmed || null,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    },
    include: { user: { select: USER_SELECT } },
  });

  return { application: serialize(created), created: true };
};

// ============================================================
// Список заявок (админка)
// ============================================================

export const listTeamApplications = async (
  status?: string
): Promise<SerializedApplication[]> => {
  const where: Record<string, unknown> = {};
  if (status && status !== 'all') {
    if (!(TEAM_APPLICATION_STATUSES as readonly string[]).includes(status)) {
      throw new Error('Неизвестный статус заявки');
    }
    where.status = status;
  }

  const applications = await prisma.teamApplication.findMany({
    where,
    include: { user: { select: USER_SELECT } },
    orderBy: [{ createdAt: 'desc' }],
    take: 200,
  });

  // Новые — первыми, внутри группы свежие сверху.
  const rank: Record<string, number> = { new: 0, accepted: 1, rejected: 2 };
  return applications
    .map(serialize)
    .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
};

// ============================================================
// Внутреннее: сообщение заявителю в direct-чат
// ============================================================

async function sendToApplicant(
  reviewerId: string,
  applicantId: string,
  text: string
) {
  if (reviewerId === applicantId) {
    throw new Error('Нельзя отправить сообщение самому себе');
  }
  // createChat идемпотентен: найдёт существующий direct-чат или создаст новый.
  const chat = await createChat(reviewerId, {
    type: 'direct',
    memberIds: [applicantId],
  });
  return sendMessage(reviewerId, {
    chatId: chat.id,
    type: 'text',
    content: text,
  });
}

// ============================================================
// Принятие / отклонение
// ============================================================

export const acceptTeamApplication = async (id: string, reviewerId: string) => {
  const app = await prisma.teamApplication.findUnique({
    where: { id },
    include: { user: { select: { role: true, status: true } } },
  });
  if (!app) {
    throw new Error('Заявка не найдена');
  }
  if (app.status === 'accepted') {
    throw new Error('Заявка уже принята');
  }
  if (app.user.status !== 'active') {
    throw new Error('Аккаунт заявителя неактивен — принятие невозможно');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  // Роль выдаём только «пользователю»: модератора/админа не понижаем и не
  // перетираем, а суперадмина тем более.
  const granted = app.user.role === 'user';
  if (granted) {
    await prisma.user.update({
      where: { id: app.userId },
      data: { role: 'admin', updatedAt: now },
    });
  }

  const updated = await prisma.teamApplication.update({
    where: { id },
    data: {
      status: 'accepted',
      reviewedById: reviewerId,
      reviewedAt: now,
      updatedAt: now,
    },
    include: { user: { select: USER_SELECT } },
  });

  // Сообщение не должно валить принятие: роль уже выдана, заявка закрыта.
  try {
    await sendToApplicant(
      reviewerId,
      app.userId,
      'Ваша заявка в команду Balloo принята — доступ в админ-панель открыт.'
    );
  } catch (err) {
    console.error('[TEAM_APPLICATION] accept: message not sent:', err);
  }

  return { application: serialize(updated), granted };
};

export const rejectTeamApplication = async (id: string, reviewerId: string) => {
  const app = await prisma.teamApplication.findUnique({ where: { id } });
  if (!app) {
    throw new Error('Заявка не найдена');
  }
  if (app.status === 'rejected') {
    throw new Error('Заявка уже отклонена');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));
  const updated = await prisma.teamApplication.update({
    where: { id },
    data: {
      status: 'rejected',
      reviewedById: reviewerId,
      reviewedAt: now,
      updatedAt: now,
    },
    include: { user: { select: USER_SELECT } },
  });

  return { application: serialize(updated) };
};

// ============================================================
// Сообщение заявителю из формы заявки
// ============================================================

export const messageTeamApplicant = async (
  id: string,
  reviewerId: string,
  text: string
) => {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) {
    throw new Error('Текст сообщения обязателен');
  }
  if (trimmed.length > MAX_REPLY_LENGTH) {
    throw new Error(`Сообщение не должно превышать ${MAX_REPLY_LENGTH} символов`);
  }

  const app = await prisma.teamApplication.findUnique({ where: { id } });
  if (!app) {
    throw new Error('Заявка не найдена');
  }

  const message = await sendToApplicant(reviewerId, app.userId, trimmed);

  const now = BigInt(Math.floor(Date.now() / 1000));
  await prisma.teamApplication.update({
    where: { id },
    data: { lastMessageAt: now, updatedAt: now },
  });

  return message;
};

// ============================================================
// Роль пользователя (только superadmin) — выдача доступа в админку
// ============================================================

export const setUserRole = async (
  actorId: string,
  targetId: string,
  role: 'admin' | 'user'
) => {
  if (actorId === targetId) {
    throw new Error('Нельзя изменить собственную роль');
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true },
  });
  if (!target) {
    throw new Error('Пользователь не найден');
  }

  // Защита от потери управления: последнего суперадмина понижать нельзя.
  if (target.role === 'superadmin') {
    const superadmins = await prisma.user.count({ where: { role: 'superadmin' } });
    if (superadmins <= 1) {
      throw new Error('Нельзя понизить последнего суперадминистратора');
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { role, updatedAt: BigInt(Math.floor(Date.now() / 1000)) },
    select: { id: true, role: true },
  });

  return updated;
};

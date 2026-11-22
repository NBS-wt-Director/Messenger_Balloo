// inviteService.ts — Сервис приглашений по ссылке (тик. 1792160012, 1795270823)
//
// Модель: приглашение — это ссылка на страницу. Письма не отправляются.
// Приглашаемый открывает страницу, видит пригласившего/группы/текст и
// присоединяется к группам; при флаге addToContacts — попадает в контакты
// пригласившего. Каждое принятие фиксируется как реферал (InviteAcceptance)
// для вкладки «Я присоединил к Balloo».

import { PrismaClient } from '@prisma/client';
import { ensureMutualContacts } from './userService';

const prisma = new PrismaClient();

const nowSec = () => BigInt(Math.floor(Date.now() / 1000));

// Код приглашения: 10 символов без визуально похожих (0/O, 1/l/I).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

const randomCode = (len = 10): string => {
  let code = '';
  for (let i = 0; i < len; i++) {
    code += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  }
  return code;
};

const generateUniqueCode = async (): Promise<string> => {
  for (let i = 0; i < 10; i++) {
    const code = randomCode();
    const existing = await prisma.inviteLink.findFirst({ where: { code } });
    if (!existing) return code;
  }
  return `${Date.now().toString(36)}${randomCode(4)}`;
};

// Набор групп приглашения: основная chatId + groupIds (без дублей).
const resolveGroupIds = (chatId: string, groupIds: unknown): string[] => {
  const extra = Array.isArray(groupIds)
    ? (groupIds as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
  return Array.from(new Set([chatId, ...extra]));
};

// ============================================================
// Публичный предпросмотр приглашения (для страницы /join/:code)
// ============================================================

export const previewInvite = async (code: string) => {
  const invite = await prisma.inviteLink.findFirst({
    where: { code },
    include: {
      creator: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!invite) {
    throw new Error('Приглашение не найдено');
  }

  const groupIds = resolveGroupIds(invite.chatId, invite.groupIds);
  const groups = await prisma.chat.findMany({
    where: { id: { in: groupIds } },
    select: { id: true, name: true, type: true, avatarUrl: true },
  });

  const expired = !!invite.expiresAt && invite.expiresAt < nowSec();
  const limitReached = !!invite.maxUses && invite.usedCount >= invite.maxUses;
  const active = !expired && !limitReached && invite.status !== 'expired';

  return {
    code: invite.code,
    messenger: 'Balloo',
    inviter: {
      id: invite.creator.id,
      username: invite.creator.username,
      displayName: invite.creator.displayName,
      avatarUrl: invite.creator.avatarUrl,
    },
    groups,
    message: invite.message,
    addToContacts: invite.addToContacts,
    expiresAt: invite.expiresAt ? Number(invite.expiresAt) : null,
    active,
    reason: !active ? (expired ? 'expired' : 'limit') : null,
  };
};

// ============================================================
// Список приглашений пользователя
// ============================================================

export const getInvites = async (userId: string) => {
  const invites = await prisma.inviteLink.findMany({
    where: { creatorId: userId },
    include: {
      chat: { select: { id: true, name: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invites.map((inv) => {
    const groupIds = resolveGroupIds(inv.chatId, inv.groupIds);
    const expired = !!inv.expiresAt && inv.expiresAt < nowSec();
    const status = expired && inv.status !== 'accepted' ? 'expired' : inv.status;
    return {
      id: inv.id,
      chatId: inv.chatId,
      chatName: inv.chat?.name,
      chatType: inv.chat?.type,
      groupIds,
      code: inv.code,
      url: `https://balloo.su/#/join/${inv.code}`,
      status,
      ttlType: inv.ttlType,
      maxUses: inv.maxUses,
      usedCount: inv.usedCount,
      addToContacts: inv.addToContacts,
      message: inv.message,
      expiresAt: inv.expiresAt ? Number(inv.expiresAt) : null,
      createdAt: Number(inv.createdAt),
    };
  });
};

// ============================================================
// Создание приглашения
// ============================================================

export interface CreateInviteInput {
  chatId: string;
  groupIds?: string[];
  addToContacts?: boolean;
  message?: string | null;
  maxUses?: number | null;
  ttlType?: string;
  expiresAt?: number | null;
}

export const createInvite = async (userId: string, input: CreateInviteInput) => {
  if (!input.chatId) {
    throw new Error('chatId обязателен');
  }

  // Создатель должен быть участником основной группы.
  const member = await prisma.userChat.findUnique({
    where: { userId_chatId: { userId, chatId: input.chatId } },
  });
  if (!member) {
    throw new Error('Вы не участник этого чата');
  }

  const code = await generateUniqueCode();
  const now = nowSec();

  const inviteLink = await prisma.inviteLink.create({
    data: {
      chatId: input.chatId,
      creatorId: userId,
      code,
      maxUses: input.maxUses ?? null,
      expiresAt: input.expiresAt ?? null,
      ttlType: input.ttlType ?? 'permanent',
      groupIds: input.groupIds && input.groupIds.length ? input.groupIds : undefined,
      addToContacts: input.addToContacts ?? false,
      message: input.message ?? null,
      createdAt: now,
      updatedAt: now,
    },
  });

  return {
    id: inviteLink.id,
    chatId: inviteLink.chatId,
    code: inviteLink.code,
    url: `https://balloo.su/#/join/${inviteLink.code}`,
    maxUses: inviteLink.maxUses,
    expiresAt: inviteLink.expiresAt ? Number(inviteLink.expiresAt) : null,
    usedCount: inviteLink.usedCount,
    addToContacts: inviteLink.addToContacts,
    message: inviteLink.message,
    createdAt: Number(inviteLink.createdAt),
  };
};

// ============================================================
// Удаление приглашения
// ============================================================

export const deleteInvite = async (userId: string, inviteId: string) => {
  const invite = await prisma.inviteLink.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    throw new Error('Приглашение не найдено');
  }

  if (invite.creatorId !== userId) {
    throw new Error('Доступ запрещён: только создатель может удалять приглашение');
  }

  await prisma.inviteLink.delete({ where: { id: inviteId } });

  return { message: 'Приглашение удалено' };
};

// ============================================================
// Принятие приглашения
// ============================================================

type InviteRow = NonNullable<Awaited<ReturnType<typeof prisma.inviteLink.findFirst>>>;

// Общая логика принятия: вступление во все группы, контакты, реферал.
const processAcceptance = async (invite: InviteRow, userId: string) => {
  const now = nowSec();
  const groupIds = resolveGroupIds(invite.chatId, invite.groupIds);

  // Приглашающий не может присоединиться к своему же приглашению.
  if (invite.creatorId === userId) {
    throw new Error('Это ваше собственное приглашение');
  }

  const joined: string[] = [];
  for (const chatId of groupIds) {
    const existing = await prisma.userChat.findUnique({
      where: { userId_chatId: { userId, chatId } },
    });
    if (existing) continue;
    const ban = await prisma.chatBan.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (ban) continue;
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
    joined.push(chatId);
  }

  // Контакты пригласившего (и обратно) — только если флаг установлен.
  if (invite.addToContacts) {
    await ensureMutualContacts(invite.creatorId, userId);
  }

  // Реферал (вкладка «Я присоединил к Balloo»). Идемпотентно.
  try {
    await prisma.inviteAcceptance.create({
      data: {
        inviteId: invite.id,
        userId,
        inviterId: invite.creatorId,
        code: invite.code,
        createdAt: now,
      },
    });
  } catch (err: any) {
    if (err?.code !== 'P2002') throw err; // уже принимал — не ошибка
  }

  const newUsed = invite.usedCount + 1;
  const limitReached = !!invite.maxUses && newUsed >= invite.maxUses;
  await prisma.inviteLink.update({
    where: { id: invite.id },
    data: {
      usedCount: { increment: 1 },
      status: invite.ttlType === 'onetime' || limitReached ? 'accepted' : invite.status,
      updatedAt: now,
    },
  });

  const chats = await prisma.chat.findMany({
    where: { id: { in: groupIds } },
    select: { id: true, name: true, type: true },
  });

  return {
    message: 'Вы присоединились',
    joinedChatIds: joined,
    groups: chats,
    addedToContacts: invite.addToContacts,
  };
};

// Принятие по коду (публичная ссылка)
export const acceptInviteByCode = async (code: string, userId: string) => {
  const invite = await prisma.inviteLink.findFirst({
    where: { code },
    orderBy: { createdAt: 'desc' },
  });

  if (!invite) throw new Error('Приглашение не найдено');

  if (invite.expiresAt && invite.expiresAt < nowSec()) {
    await prisma.inviteLink.update({ where: { id: invite.id }, data: { status: 'expired' } });
    throw new Error('Приглашение истекло');
  }
  if (invite.maxUses && invite.usedCount >= invite.maxUses) {
    throw new Error('Лимит использований приглашения достигнут');
  }

  return processAcceptance(invite, userId);
};

// Принятие по id (совместимость с POST /api/invites/:id/accept)
export const acceptInvite = async (userId: string, inviteId: string) => {
  const invite = await prisma.inviteLink.findUnique({ where: { id: inviteId } });
  if (!invite) throw new Error('Приглашение не найдено');

  if (invite.expiresAt && invite.expiresAt < nowSec()) {
    await prisma.inviteLink.update({ where: { id: inviteId }, data: { status: 'expired' } });
    throw new Error('Приглашение истекло');
  }
  if (invite.maxUses && invite.usedCount >= invite.maxUses) {
    throw new Error('Лимит использований приглашения достигнут');
  }

  return processAcceptance(invite, userId);
};

// ============================================================
// Рефералы — «Я присоединил к Balloo»
// ============================================================

export const getReferrals = async (userId: string) => {
  const rows = await prisma.inviteAcceptance.findMany({
    where: { inviterId: userId },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    total: rows.length,
    referrals: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      username: r.user?.username,
      displayName: r.user?.displayName,
      avatarUrl: r.user?.avatarUrl,
      code: r.code,
      joinedAt: Number(r.createdAt),
    })),
  };
};

// Применение приглашения к уже созданному пользователю (регистрация по ссылке).
// Не бросает исключение наружу: регистрация не должна падать из-за приглашения.
export const applyInviteOnRegister = async (code: string, userId: string): Promise<void> => {
  try {
    await acceptInviteByCode(code, userId);
  } catch (err) {
    console.error('[applyInviteOnRegister] failed:', err);
  }
};

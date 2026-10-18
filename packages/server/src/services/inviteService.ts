// inviteService.ts — Сервис для приглашений (тик. 1792160012)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/invites — список приглашений пользователя
export const getInvites = async (userId: string) => {
  const invites = await prisma.inviteLink.findMany({
    where: {
      creatorId: userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: BigInt(Math.floor(Date.now() / 1000)) } },
      ],
    },
    include: {
      chat: { select: { id: true, name: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invites.map((inv) => ({
    id: inv.id,
    chatId: inv.chatId,
    chatName: inv.chat?.name,
    chatType: inv.chat?.type,
    code: inv.code,
    status: inv.status,
    ttlType: inv.ttlType,
    maxUses: inv.maxUses,
    usedCount: inv.usedCount,
    expiresAt: inv.expiresAt ? Number(inv.expiresAt) : null,
    createdAt: Number(inv.createdAt),
  }));
};

// DELETE /api/invites/:id — отмена приглашения
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

  await prisma.inviteLink.delete({
    where: { id: inviteId },
  });

  return { message: 'Приглашение удалено' };
};

// POST /api/invites/:id/accept — принятие приглашения
export const acceptInvite = async (userId: string, inviteId: string) => {
  const invite = await prisma.inviteLink.findUnique({
    where: { id: inviteId },
    include: { chat: { select: { id: true, name: true } } },
  });

  if (!invite) {
    throw new Error('Приглашение не найдено');
  }

  // Проверка срока
  if (invite.expiresAt && invite.expiresAt < BigInt(Math.floor(Date.now() / 1000))) {
    await prisma.inviteLink.update({
      where: { id: inviteId },
      data: { status: 'expired' },
    });
    throw new Error('Приглашение истекло');
  }

  // Проверка лимита использований
  if (invite.maxUses && invite.usedCount >= invite.maxUses) {
    throw new Error('Лимит использований приглашения достигнут');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  // Проверяем, не состоит ли пользователь в чате
  const existingMember = await prisma.userChat.findUnique({
    where: { userId_chatId: { userId, chatId: invite.chatId } },
  });

  if (existingMember) {
    throw new Error('Вы уже состоите в этом чате');
  }

  // Добавляем в чат
  await prisma.userChat.create({
    data: {
      userId,
      chatId: invite.chatId,
      role: 'member',
      joinedAt: now,
    },
  });

  // Обновляем приглашение
  await prisma.inviteLink.update({
    where: { id: inviteId },
    data: {
      usedCount: { increment: 1 },
      status: 'accepted',
      updatedAt: now,
    },
  });

  return { message: 'Вы присоединились к чату', chatId: invite.chatId, chatName: invite.chat?.name };
};

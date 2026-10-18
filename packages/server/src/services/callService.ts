// callService.ts — Сервис для истории и инициации звонков (тик. 1792160007)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CallRecord {
  id: string;
  contactName: string;
  contactAvatar?: string | null;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
  duration: number;
}

// Получить историю звонков (GET /api/calls)
export const getCallHistory = async (
  userId: string,
  filter?: 'all' | 'incoming' | 'outgoing' | 'missed',
  page = 1,
  limit = 50
) => {
  const skip = (page - 1) * limit;

  const where: any = { participants: { some: { userId } } };
  if (filter === 'missed') {
    where.status = 'missed';
  }

  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      include: {
        participants: {
          include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.call.count({ where }),
  ]);

  const items: CallRecord[] = calls.map((c) => {
    const other = c.participants.find((p) => p.userId !== userId);
    const otherUser = other?.user;
    let type: 'incoming' | 'outgoing' | 'missed' = 'outgoing';
    if (c.status === 'missed') type = 'missed';
    else if (otherUser && c.participants.some((p) => p.userId === userId && p.joinedAt === c.startedAt)) {
      type = 'incoming';
    }

    return {
      id: c.id,
      contactName: otherUser?.displayName || otherUser?.username || 'Неизвестный',
      contactAvatar: otherUser?.avatarUrl,
      type,
      timestamp: Number(c.startedAt ?? c.createdAt),
      duration: c.endedAt && c.startedAt ? Number(c.endedAt) - Number(c.startedAt) : 0,
    };
  });

  return {
    calls: items,
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

// Инициация звонка (POST /api/calls)
export const createCall = async (
  callerId: string,
  calleeId: string,
  type: 'audio' | 'video' = 'audio'
) => {
  if (callerId === calleeId) {
    throw new Error('Нельзя позвонить самому себе');
  }

  const callee = await prisma.user.findUnique({ where: { id: calleeId } });
  if (!callee) {
    throw new Error('Пользователь не найден');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  // Прямой чат между caller и callee (создаётся при необходимости)
  const existing = await prisma.chat.findFirst({
    where: {
      type: 'direct',
      members: {
        every: { userId: { in: [callerId, calleeId] } },
      },
    },
  });

  const chat =
    existing ??
    (await prisma.chat.create({
      data: {
        type: 'direct',
        createdAt: now,
        updatedAt: now,
        members: {
          create: [
            { userId: callerId, role: 'member', joinedAt: now },
            { userId: calleeId, role: 'member', joinedAt: now },
          ],
        },
      },
    }));

  const call = await prisma.call.create({
    data: {
      chatId: chat.id,
      type,
      status: 'ongoing',
      isGroup: false,
      startedAt: now,
      createdAt: now,
      participants: {
        create: [
          { userId: callerId, joinedAt: now },
          { userId: calleeId, joinedAt: now },
        ],
      },
    },
  });

  return { id: call.id, chatId: call.chatId, status: call.status, startedAt: Number(call.startedAt) };
};

// Завершение звонка (POST /api/calls/:id/end)
export const endCall = async (userId: string, callId: string) => {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: { participants: { where: { userId } } },
  });

  if (!call) {
    throw new Error('Звонок не найден');
  }

  if (call.participants.length === 0) {
    throw new Error('Доступ запрещён: вы не участник звонка');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  await prisma.$transaction([
    prisma.call.update({
      where: { id: callId },
      data: { status: 'ended', endedAt: now },
    }),
    prisma.callParticipant.updateMany({
      where: { callId, userId },
      data: { leftAt: now },
    }),
  ]);

  return { id: callId, status: 'ended', endedAt: Number(now) };
};

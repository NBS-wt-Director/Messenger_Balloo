// botService.ts — Сервис для управления ботами

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateBotData {
  name: string;
  description?: string;
  webhookUrl?: string;
}

export interface BotResponse {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  creatorId: string;
  createdAt: number;
  updatedAt: number;
}

// Создать бота
export const createBot = async (creatorId: string, data: CreateBotData): Promise<BotResponse> => {
  const bot = await prisma.bot.create({
    data: {
      creatorId,
      name: data.name,
      description: data.description ?? null,
      commands: data.webhookUrl ? JSON.stringify([{ command: 'start', description: 'Начать работу', handler: data.webhookUrl }]) : null,
      isPublic: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      avatarUrl: true,
      isPublic: true,
      creatorId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    ...bot,
    createdAt: Number(bot.createdAt),
    updatedAt: Number(bot.updatedAt),
  };
};

// Получить все публичные боты
export const getBots = async (): Promise<BotResponse[]> => {
  const bots = await prisma.bot.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      name: true,
      description: true,
      avatarUrl: true,
      isPublic: true,
      creatorId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return bots.map((bot) => ({
    ...bot,
    createdAt: Number(bot.createdAt),
    updatedAt: Number(bot.updatedAt),
  }));
};

// Получить одного бота по ID
export const getBot = async (botId: string): Promise<BotResponse | null> => {
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    select: {
      id: true,
      name: true,
      description: true,
      avatarUrl: true,
      isPublic: true,
      creatorId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!bot) return null;

  return {
    ...bot,
    createdAt: Number(bot.createdAt),
    updatedAt: Number(bot.updatedAt),
  };
};

// Удалить бота
export const deleteBot = async (botId: string, userId: string): Promise<void> => {
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
  });

  if (!bot) {
    throw new Error('Бот не найден');
  }

  if (bot.creatorId !== userId) {
    throw new Error('Доступ запрещён');
  }

  await prisma.bot.delete({
    where: { id: botId },
  });
};

// callService.ts — Сервис для истории звонков
// Заглушка: модель callRecord отсутствует в Prisma schema

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CallRecord {
  id: string;
  contactName: string;
  contactAvatar?: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
  duration: number;
}

// Получить историю звонков (заглушка — возвращает пустой массив)
export const getCallHistory = async (
  userId: string,
  filter?: 'all' | 'incoming' | 'outgoing' | 'missed',
  page = 1,
  limit = 50
) => {
  return {
    calls: [] as CallRecord[],
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
};

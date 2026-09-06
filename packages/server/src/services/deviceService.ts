// deviceService.ts — Сервис для управления устройствами и сессиями
// Заглушка: модель userSession отсутствует в Prisma schema

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  lastActive: number;
  isCurrent: boolean;
  location?: string;
  ipAddress?: string;
  os?: string;
}

// Получить список устройств (заглушка — возвращает текущее устройство)
export const getDevices = async (userId: string, currentDeviceId?: string) => {
  const devices: DeviceInfo[] = [
    {
      id: currentDeviceId || 'current',
      name: 'Текущее устройство',
      type: 'desktop',
      lastActive: Math.floor(Date.now() / 1000),
      isCurrent: true,
    },
  ];

  return { devices };
};

// Завершить сессию устройства (заглушка)
export const endSession = async (sessionId: string, userId: string) => {
  return { message: 'Сессия завершена' };
};

// Завершить все сессии кроме текущей (заглушка)
export const endAllSessions = async (userId: string, currentDeviceId?: string) => {
  return { message: 'Все остальные сессии завершены' };
};

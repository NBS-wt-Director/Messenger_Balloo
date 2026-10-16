// accountsService.ts — Мультиаккаунт: связь аккаунт → устройство
// Сущность: account_device_links (mockups/data_schema.json), миграция
// 20261016000000. Приёмка макета 1.1.9 → 6.33, тикет 1792124252.
//
// Модель доверия: deviceId — стабильный случайный UUID, который браузер
// держит в localStorage. Он выдаётся только после реального входа на этом
// устройстве, поэтому список аккаунтов устройства доступен только
// пользователю, который на этом же устройстве залогинен (проверка link).

import { PrismaClient } from '@prisma/client';
import { generateTokens, TokenPair } from './authService';

const prisma = new PrismaClient();

export class AccountsError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const nowSeconds = () => BigInt(Math.floor(Date.now() / 1000));

// Вход/регистрация с X-Device-Id: аккаунт становится активным на устройстве,
// остальные ссылки устройства деактивируются.
export const linkAccountToDevice = async (userId: string, deviceId: string): Promise<void> => {
  const now = nowSeconds();
  await prisma.accountDeviceLink.updateMany({
    where: { deviceId },
    data: { isActive: false, updatedAt: now },
  });
  await prisma.accountDeviceLink.upsert({
    where: { userId_deviceId: { userId, deviceId } },
    update: { isActive: true, updatedAt: now },
    create: { userId, deviceId, isActive: true, createdAt: now, updatedAt: now },
  });
};

interface DeviceAccountEntry {
  userId: string;
  displayName: string;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  pushEnabled: boolean;
  connectedAt: number;
  chatsCount: number;
  unreadCount: number;
  accountStatus: string;
}

// Список аккаунтов, подключённых к устройству. requesterUserId обязан сам
// быть подключён к этому deviceId (иначе 403) — чужой сессией список чужих
// устройств не перечислить.
export const listDeviceAccounts = async (
  deviceId: string,
  requesterUserId: string
): Promise<{ accounts: DeviceAccountEntry[] }> => {
  const requesterLink = await prisma.accountDeviceLink.findUnique({
    where: { userId_deviceId: { userId: requesterUserId, deviceId } },
  });
  if (!requesterLink) {
    throw new AccountsError(403, 'Аккаунт не подключён к этому устройству');
  }

  const links = await prisma.accountDeviceLink.findMany({
    where: { deviceId },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  const userIds = links.map((l) => l.userId);
  const [chatCounts, unreadAgg] = await Promise.all([
    prisma.userChat.groupBy({ by: ['userId'], where: { userId: { in: userIds } }, _count: { _all: true } }),
    prisma.userChat.groupBy({ by: ['userId'], where: { userId: { in: userIds } }, _sum: { unread: true } }),
  ]);
  const countBy = new Map(chatCounts.map((c) => [c.userId, c._count._all]));
  const unreadBy = new Map(unreadAgg.map((c) => [c.userId, c._sum.unread ?? 0]));

  const accounts: DeviceAccountEntry[] = links.map((l) => ({
    userId: l.userId,
    displayName: l.user.displayName || l.user.username || 'Без имени',
    email: l.user.email,
    username: l.user.username,
    avatarUrl: l.user.avatarUrl,
    isActive: l.isActive,
    pushEnabled: l.pushEnabled,
    connectedAt: Number(l.createdAt),
    chatsCount: countBy.get(l.userId) ?? 0,
    unreadCount: unreadBy.get(l.userId) ?? 0,
    accountStatus: l.user.status,
  }));

  return { accounts };
};

// Переключение активного аккаунта устройства: перевыпуск токенов целевого
// аккаунта (тот же механизм, что логин) — мгновенно, без повторного входа.
export const switchDeviceAccount = async (
  deviceId: string,
  userId: string
): Promise<{ tokens: TokenPair; user: { id: string; email: string | null; username: string | null; displayName: string | null; avatarUrl: string | null; role: string } }> => {
  const link = await prisma.accountDeviceLink.findUnique({
    where: { userId_deviceId: { userId, deviceId } },
    include: { user: true },
  });
  if (!link) {
    throw new AccountsError(404, 'Аккаунт не подключён к этому устройству');
  }
  if (link.user.status !== 'active') {
    throw new AccountsError(403, 'Аккаунт заблокирован');
  }

  const now = nowSeconds();
  await prisma.accountDeviceLink.updateMany({
    where: { deviceId },
    data: { isActive: false, updatedAt: now },
  });
  await prisma.accountDeviceLink.update({
    where: { userId_deviceId: { userId, deviceId } },
    data: { isActive: true, updatedAt: now },
  });

  const tokens = await generateTokens(
    link.user.id,
    link.user.email || '',
    link.user.username || undefined,
    link.user.role
  );

  return {
    tokens,
    user: {
      id: link.user.id,
      email: link.user.email,
      username: link.user.username,
      displayName: link.user.displayName,
      avatarUrl: link.user.avatarUrl,
      role: link.user.role,
    },
  };
};

// Отключение аккаунта от устройства: удаляется только ссылка (сессия на
// устройстве); чаты и данные пользователя на сервере остаются (accounts.md).
export const unlinkDeviceAccount = async (deviceId: string, userId: string): Promise<{ message: string }> => {
  const link = await prisma.accountDeviceLink.findUnique({
    where: { userId_deviceId: { userId, deviceId } },
  });
  if (!link) {
    throw new AccountsError(404, 'Аккаунт не подключён к этому устройству');
  }
  if (link.isActive) {
    throw new AccountsError(400, 'Нельзя отключить активный аккаунт — сначала переключитесь');
  }
  await prisma.accountDeviceLink.delete({ where: { id: link.id } });
  return { message: 'Аккаунт отключён от устройства' };
};

// Индивидуальное вкл/выкл push-уведомлений для аккаунта на устройстве.
export const setAccountNotifications = async (
  deviceId: string,
  userId: string,
  enabled: boolean
): Promise<{ pushEnabled: boolean }> => {
  const link = await prisma.accountDeviceLink.findUnique({
    where: { userId_deviceId: { userId, deviceId } },
  });
  if (!link) {
    throw new AccountsError(404, 'Аккаунт не подключён к этому устройству');
  }
  await prisma.accountDeviceLink.update({
    where: { id: link.id },
    data: { pushEnabled: enabled, updatedAt: nowSeconds() },
  });
  return { pushEnabled: enabled };
};

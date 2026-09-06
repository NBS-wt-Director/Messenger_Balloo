// reportService.ts — Сервис для жалоб на сообщения
// Создание и управление жалобами
// Исправлено под текущую Prisma schema (reporterId, targetId, targetType)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const VALID_REASONS = [
  'spam',
  'harassment',
  'hate_speech',
  'violence',
  'pornography',
  'copyright',
  'other',
] as const;

export type ReportReason = typeof VALID_REASONS[number];

export interface ReportInput {
  reporterId: string;
  targetId: string;
  targetType: 'user' | 'message' | 'chat' | 'post' | 'story';
  reason: ReportReason;
  content?: string;
}

// Создать жалобу
export const createReport = async (input: ReportInput) => {
  const { reporterId, targetId, targetType, reason, content } = input;

  // Валидация reason
  if (!VALID_REASONS.includes(reason)) {
    throw new Error('Неверная причина жалобы');
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  const report = await prisma.report.create({
    data: {
      reporterId,
      targetId,
      targetType,
      reason,
      content: content || null,
      createdAt: now,
    },
  });

  return {
    id: report.id,
    reason: report.reason,
    content: report.content,
    createdAt: report.createdAt,
  };
};

// Получить жалобы пользователя
export const getUserReports = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const reports = await prisma.report.findMany({
    where: {
      reporterId: userId,
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const total = await prisma.report.count({
    where: {
      reporterId: userId,
    },
  });

  return {
    reports,
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

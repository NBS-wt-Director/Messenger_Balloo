// clientErrorController.ts — Клиентские события ошибок (В-1…В-8, тикет 1791975722)
// POST /api/client-errors — публичный, rate-limited эндпоинт
// Записывает событие в консоль + ServiceMetric-счётчик для дашборда.

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ClientErrorBody {
  code?: string;
  url?: string;
  referrer?: string;
  userAgent?: string;
  userId?: string;
  timestamp?: number;
}

export async function clientErrorCtrl(
  req: Request<{}, any, ClientErrorBody>,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const body = req.body;

  const event = {
    code: body.code || 'unknown',
    url: body.url || req.headers.referer || '-',
    referrer: body.referrer || '-',
    userAgent: body.userAgent || req.headers['user-agent'] || '-',
    userId: body.userId || null,
    timestamp: body.timestamp || Math.floor(Date.now() / 1000),
    ip: req.ip || req.socket.remoteAddress || '-',
  };

  // 1. Консольный лог (доступен в docker logs / journal)
  console.log(`[ClientError] ${event.code} url=${event.url} userId=${event.userId} ts=${event.timestamp}`);

  // 2. ServiceMetric счётчик client_error:<code>
  try {
    const metricName = `client_error:${event.code}`;
    // Находим существующий или создаём новый
    const existing = await prisma.serviceMetric.findFirst({
      where: { name: metricName },
    });

    if (existing) {
      await prisma.serviceMetric.update({
        where: { id: existing.id },
        data: {
          value: (existing.value || 0) + 1,
          timestamp: event.timestamp,
        },
      });
    } else {
      await prisma.serviceMetric.create({
        data: {
          name: metricName,
          value: 1,
          timestamp: event.timestamp,
        },
      });
    }
  } catch (err: any) {
    // Не блокируем ответ, если метрика не записалась
    console.error('[ClientError] metric write failed:', err?.message);
  }

  res.status(201).json({ ok: true });
}

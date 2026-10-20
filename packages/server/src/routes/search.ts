import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router() as import('express').Router;

// ============================================================
// GET /api/search?q=&limit=&offset= — глобальный поиск
// ============================================================

router.get('/', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const q = (req.query.q as string || '').trim();
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (q.length < 2) {
      return res.status(400).json({ error: 'query_too_short', message: 'q must be at least 2 characters' });
    }

    const queryLower = q.toLowerCase();

    // 1. Пользователи: username/displayName ILIKE q
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
        ],
        status: 'active',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
      take: limit + offset,
    });

    // 2. Чаты: название ILIKE q, только где userId — участник
    const userChats = await prisma.userChat.findMany({
      where: { userId },
      select: { chatId: true },
    });
    const chatIds = userChats.map(uc => uc.chatId);

    const chats = chatIds.length > 0 ? await prisma.chat.findMany({
      where: {
        id: { in: chatIds },
        name: { contains: q, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
      take: limit + offset,
    }) : [];

    // 3. Сообщения: текст ILIKE q, только в чатах участника
    const messages = chatIds.length > 0 ? await prisma.message.findMany({
      where: {
        chatId: { in: chatIds },
        content: { contains: q, mode: 'insensitive' },
        deleted: false,
      },
      select: {
        id: true,
        chatId: true,
        senderId: true,
        content: true,
        createdAt: true,
      },
      take: limit + offset,
    }) : [];

    // 4. Смешанный результат с type
    const results: any[] = [
      ...users.map(u => ({ type: 'user' as const, ...u })),
      ...chats.map(c => ({ type: 'chat' as const, ...c })),
      ...messages.map(m => ({ type: 'message' as const, ...m })),
    ];

    // 5. Сортировка: точное совпадение начала строки выше
    results.sort((a, b) => {
      const aName = (a.username || a.displayName || a.name || a.content || '').toLowerCase();
      const bName = (b.username || b.displayName || b.name || b.content || '').toLowerCase();
      const aStarts = aName.startsWith(queryLower) ? 0 : 1;
      const bStarts = bName.startsWith(queryLower) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return aName.localeCompare(bName);
    });

    // 6. Единая пагинация
    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    return res.json({ results: paginated, total, limit, offset });
  } catch (err: any) {
    console.error('[search] GET /api/search error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export { router };

import { Router, Request, Response } from 'express';

const router = Router() as import('express').Router;
import {
  getInvitesCtrl,
  deleteInviteCtrl,
  acceptInviteCtrl,
} from '../controllers/inviteController';
import { authRequired } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// GET /api/invites — список приглашений пользователя
// ============================================================
router.get('/', authRequired, getInvitesCtrl);

// ============================================================
// POST /api/invites — создать приглашение (алиас на POST /api/chats/:id/invite)
// ============================================================
router.post('/', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { chatId, maxUses, expiresAt } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'Bad Request', message: 'chatId обязателен' });
    }

    // Проверяем что пользователь — участник чата
    const member = await prisma.userChat.findUnique({
      where: { userId_chatId: { userId, chatId } },
    });
    if (!member) {
      return res.status(403).json({ error: 'Forbidden', message: 'Вы не участник этого чата' });
    }

    // Создаём invite link
    const code = Math.random().toString(36).substring(2, 10);
    const inviteLink = await prisma.inviteLink.create({
      data: {
        chatId,
        creatorId: userId,
        code,
        maxUses: maxUses ? parseInt(String(maxUses), 10) : null,
        expiresAt: expiresAt ? parseInt(String(expiresAt), 10) : null,
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
      },
    });

    res.status(201).json({ inviteLink });
  } catch (error: any) {
    console.error('[invites] POST / error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ============================================================
// DELETE /api/invites/:id — отмена приглашения
// ============================================================
router.delete('/:id', authRequired, deleteInviteCtrl);

// ============================================================
// POST /api/invites/:id/accept — принятие приглашения
// ============================================================
router.post('/:id/accept', authRequired, acceptInviteCtrl);

export { router };

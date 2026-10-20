import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired } from '../middleware/auth';

const prisma = new PrismaClient();

// ============================================================
// Channel routes (mounted at /api/channels)
// ============================================================

export const channelRouter = Router() as import('express').Router;

// GET /api/channels — список каналов
channelRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const channels = await prisma.blogChannel.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ channels });
  } catch (err: any) {
    console.error('[channels] GET /channels error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// GET /api/channels/:id — канал (алиас на blog getChannel)
channelRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const channel = await prisma.blogChannel.findUnique({
      where: { id: req.params.id },
    });
    if (!channel) {
      return res.status(404).json({ error: 'channel_not_found' });
    }
    return res.json({ channel });
  } catch (err: any) {
    console.error('[channels] GET /channels/:id error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /api/channels/:id/subscribe
channelRouter.post('/:id/subscribe', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const channelId = req.params.id;

    const channel = await prisma.blogChannel.findUnique({
      where: { id: channelId },
    });
    if (!channel) {
      return res.status(404).json({ error: 'channel_not_found' });
    }

    const existing = await prisma.blogChannelSubscriber.findUnique({
      where: { userId_channelId: { userId, channelId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'already_subscribed' });
    }

    const subscription = await prisma.blogChannelSubscriber.create({
      data: { userId, channelId },
    });

    await prisma.blogChannel.update({
      where: { id: channelId },
      data: { followers: { increment: 1 } },
    });

    return res.status(201).json({ subscription });
  } catch (err: any) {
    console.error('[channels] POST /channels/:id/subscribe error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// POST /api/channels/:id/unsubscribe
channelRouter.post('/:id/unsubscribe', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const channelId = req.params.id;

    const existing = await prisma.blogChannelSubscriber.findUnique({
      where: { userId_channelId: { userId, channelId } },
    });
    if (!existing) {
      return res.status(404).json({ error: 'not_subscribed' });
    }

    await prisma.blogChannelSubscriber.delete({
      where: { userId_channelId: { userId, channelId } },
    });

    await prisma.blogChannel.update({
      where: { id: channelId },
      data: { followers: { decrement: 1 } },
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[channels] POST /channels/:id/unsubscribe error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ============================================================
// Follow aliases (mounted at /api/blog/channels/:id/follow)
// ============================================================

export const followRouter = Router() as import('express').Router;

// POST /api/blog/channels/:id/follow — алиас на subscribe
followRouter.post('/:id/follow', authRequired, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const channelId = req.params.id;

  try {
    const channel = await prisma.blogChannel.findUnique({
      where: { id: channelId },
    });
    if (!channel) {
      return res.status(404).json({ error: 'channel_not_found' });
    }

    const existing = await prisma.blogChannelSubscriber.findUnique({
      where: { userId_channelId: { userId, channelId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'already_subscribed' });
    }

    const subscription = await prisma.blogChannelSubscriber.create({
      data: { userId, channelId },
    });

    await prisma.blogChannel.update({
      where: { id: channelId },
      data: { followers: { increment: 1 } },
    });

    return res.status(201).json({ subscription });
  } catch (err: any) {
    console.error('[channels] POST /blog/channels/:id/follow error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// DELETE /api/blog/channels/:id/follow — алиас на unsubscribe
followRouter.delete('/:id/follow', authRequired, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const channelId = req.params.id;

  try {
    const existing = await prisma.blogChannelSubscriber.findUnique({
      where: { userId_channelId: { userId, channelId } },
    });
    if (!existing) {
      return res.status(404).json({ error: 'not_subscribed' });
    }

    await prisma.blogChannelSubscriber.delete({
      where: { userId_channelId: { userId, channelId } },
    });

    await prisma.blogChannel.update({
      where: { id: channelId },
      data: { followers: { decrement: 1 } },
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[channels] DELETE /blog/channels/:id/follow error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// ============================================================
// Blocked channel cascade (mounted at /api/blocked/channels/:id)
// ============================================================

export const blockedChannelRouter = Router() as import('express').Router;

// DELETE /api/blocked/channels/:id — каскад: отписаться → заблокировать создателя
blockedChannelRouter.delete('/:id', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const channelId = req.params.id;

    // 1. Отписаться от канала (все подписки)
    await prisma.blogChannelSubscriber.deleteMany({
      where: { channelId },
    });

    // 2. Найти создателя канала
    const channel = await prisma.blogChannel.findUnique({
      where: { id: channelId },
    });
    if (!channel) {
      return res.status(404).json({ error: 'channel_not_found' });
    }

    const author = await prisma.blogPost.findFirst({
      where: { channelId },
      select: { authorId: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!author) {
      return res.status(404).json({ error: 'channel_author_not_found' });
    }

    // 3. Заблокировать создателя
    await prisma.blockedUser.create({
      data: { blockerId: userId, blockedId: author.authorId },
    });

    return res.json({
      success: true,
      unsubscribed: true,
      channelBlocked: true,
      authorBlocked: true,
    });
  } catch (err: any) {
    console.error('[channels] DELETE /blocked/channels/:id error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

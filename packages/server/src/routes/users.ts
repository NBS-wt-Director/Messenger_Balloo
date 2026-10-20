import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router() as import('express').Router;
import {
  getMe,
  updateMe,
  deleteMe,
  exportMe,
  getPublicProfile,
  searchUsers,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getContacts,
  addContact,
  removeContact,
} from '../controllers/userController';
import { authRequired } from '../middleware/auth';

// ============================================================
// GET /api/users/me — текущий пользователь
// ============================================================
router.get('/me', authRequired, getMe);

// ============================================================
// PUT /api/users/me — обновление профиля
// ============================================================
router.put('/me', authRequired, updateMe);

// ============================================================
// DELETE /api/users/me — мягкое удаление аккаунта (self-service)
// ============================================================
router.delete('/me', authRequired, deleteMe);

// ============================================================
// GET /api/users/me/export — выгрузка данных пользователя
// ============================================================
router.get('/me/export', authRequired, exportMe);

// ============================================================
// GET /api/users/search?q= — поиск пользователей
// ============================================================
router.get('/search', searchUsers);

// ============================================================
// GET /api/users/:username — публичный профиль
// ============================================================
router.get('/:username', getPublicProfile);

// ============================================================
// POST /api/users/:id/block — заблокировать
// ============================================================
router.post('/:id/block', authRequired, blockUser);

// ============================================================
// DELETE /api/users/:id/block — разблокировать
// ============================================================
router.delete('/:id/block', authRequired, unblockUser);

// ============================================================
// GET /api/users/me/blocked — список заблокированных
// ============================================================
router.get('/me/blocked', authRequired, getBlockedUsers);

export { router };
// ============================================================
// GET /api/users/contacts - список контактов
// ============================================================
router.get('/contacts', authRequired, getContacts);

// ============================================================
// POST /api/users/contacts/:userId - добавить контакт
// ============================================================
router.post('/contacts/:userId', authRequired, addContact);

// ============================================================
// DELETE /api/users/contacts/:userId - удалить контакт
// ============================================================
router.delete('/contacts/:userId', authRequired, removeContact);

// ============================================================
// GET /api/users/me/subscriptions — push-подписки текущего пользователя
// ============================================================
router.get('/me/subscriptions', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, endpoint: true, p256dh: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ subscriptions });
  } catch (error: any) {
    console.error('[users] GET /me/subscriptions error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ============================================================
// PATCH /api/users/me/onboarding — обновить статус онбординга
// ============================================================
router.patch('/me/onboarding', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'Bad Request', message: 'completed должен быть boolean' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: completed },
      select: {
        id: true, username: true, email: true, displayName: true,
        avatarUrl: true, role: true, status: true, language: true,
        onboardingCompleted: true, createdAt: true, updatedAt: true,
      },
    });

    res.json({ user });
  } catch (error: any) {
    console.error('[users] PATCH /me/onboarding error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ============================================================
// PUT /api/users/me/notifications — алиас на PATCH /api/accounts/:userId/notifications
// ============================================================
router.put('/me/notifications', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Bad Request', message: 'enabled должен быть boolean' });
    }

    // Переиспользуем ту же логику что accountsController.setAccountNotificationsCtrl
    const { setAccountNotifications } = await import('../services/accountsService');
    const deviceId = req.headers['x-device-id'] as string || 'default';
    const result = await setAccountNotifications(deviceId, userId, enabled);
    res.json(result);
  } catch (error: any) {
    console.error('[users] PUT /me/notifications error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

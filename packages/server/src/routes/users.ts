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

// ============================================================
// POST /api/users/me/password/send-code — отправить 6-значный
// код смены пароля на email (тикет 1792477132-03)
// ============================================================
router.post('/me/password/send-code', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return res.status(400).json({ error: 'Bad Request', message: 'Email не подтверждён' });
    }

    // Генерация 6-значного кода
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // TTL 15 минут (900 секунд)
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 900);

    // Хеш кода для хранения (SHA-256)
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(code, 'utf8').digest('hex');

    // Сохраняем VerificationToken с типом password_change
    await prisma.verificationToken.create({
      data: {
        userId,
        type: 'password_change',
        token: tokenHash,
        expiresAt,
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
      },
    });

    // Отправка email с кодом
    const { sendEmail } = await import('../services/emailService');
    await sendEmail({
      to: user.email,
      subject: 'Код смены пароля Balloo',
      html: `<p>Ваш код смены пароля: <strong style="font-size:24px;letter-spacing:4px">${code}</strong></p>
             <p>Код действителен 15 минут. Если вы не запрашивали смену пароля, проигнорируйте это письмо.</p>`,
      text: `Ваш код смены пароля: ${code}. Код действителен 15 минут.`,
    });

    res.json({ ok: true });
  } catch (error: any) {
    console.error('[users] POST /me/password/send-code error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ============================================================
// POST /api/users/me/password — смена пароля по 6-значному коду
// (тикет 1792477132-03)
// ============================================================
router.post('/me/password', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { code, newPassword } = req.body;

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return res.status(400).json({ error: 'Bad Request', message: 'Код должен быть 6-значным числом' });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'Bad Request', message: 'Новый пароль должен быть не менее 8 символов' });
    }

    // Хеш введённого кода
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(code, 'utf8').digest('hex');

    // Поиск валидного токена
    const now = BigInt(Math.floor(Date.now() / 1000));
    const token = await prisma.verificationToken.findFirst({
      where: {
        userId,
        type: 'password_change',
        token: tokenHash,
        used: false,
        expiresAt: { gt: now },
      },
    });

    if (!token) {
      return res.status(400).json({ error: 'Bad Request', message: 'Неверный или истёкший код' });
    }

    // Отметить токен использованным
    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { used: true },
    });

    // Хеш нового пароля (pre-hash + bcrypt)
    const bcrypt = await import('bcryptjs');
    const preHashPassword = (password: string): string => {
      return crypto.createHash('sha256').update(password, 'utf8').digest('base64');
    };
    const passwordHash = await bcrypt.default.hash(preHashPassword(newPassword), 12);

    // Обновить пароль
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: passwordHash, updatedAt: now },
    });

    // Инвалидация всех refresh-токенов (все сессии)
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    res.json({ ok: true });
  } catch (error: any) {
    console.error('[users] POST /me/password error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

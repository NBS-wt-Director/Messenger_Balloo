import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router() as import('express').Router;

// GET /api/onboarding/steps — шаги онбординга (публичные, без авторизации)
router.get('/steps', async (_req: Request, res: Response) => {
  try {
    const steps = await prisma.onboardingStep.findMany({
      where: { isActive: true },
      include: {
        translations: {
          select: {
            language: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    res.json(steps.map((step) => ({
      id: step.id,
      order: step.order,
      illustrationUrl: step.illustrationUrl,
      translations: step.translations,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Ошибка загрузки шагов онбординга' });
  }
});

// PATCH /api/onboarding/me — обновить статус онбординга
router.patch('/me', authRequired, async (req: Request, res: Response) => {
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
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        status: true,
        language: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ user });
  } catch (error: any) {
    console.error('[onboarding] PATCH /me error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Ошибка обновления онбординга' });
  }
});

export { router };

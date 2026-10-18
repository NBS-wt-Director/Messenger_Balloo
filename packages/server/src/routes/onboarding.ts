import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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

export { router };

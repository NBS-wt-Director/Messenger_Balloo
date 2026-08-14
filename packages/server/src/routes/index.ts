import { Router, Request, Response } from 'express';
import { router as authRouter } from './auth';
import { router as usersRouter } from './users';
import { router as chatsRouter } from './chats';
import { router as messagesRouter } from './messages';
import { router as uploadRouter } from './upload';
import storiesRouter from './stories';
import pollsRouter from './polls';
import { router as blogRouter } from './blog';
import { router as knowledgeRouter } from './knowledge';
import { router as adminRouter } from './admin';
import { router as paymentsRouter } from './payments';
import { router as downloadRouter } from './download';
import { router as installRouter } from './install';
import { router as featuresRouter } from './features';
import { router as historyRouter } from './history';
import { router as docsRouter } from './docs';
import { router as specRouter } from './spec';
import { router as blogLandingRouter } from './blog-landing';

const router = Router() as import('express').Router;

// Базовые маршруты
router.get('/', (_req, res) => {
  res.json({
    service: 'Balloo Messenger API',
    version: '1.0.0',
    status: 'running',
    documentation: 'https://docs.balloo.su',
  });
});

// API маршруты
router.use('/api/auth', authRouter);
router.use('/api/users', usersRouter);
router.use('/api/chats', chatsRouter);
router.use('/api/messages', messagesRouter);
router.use('/api/upload', uploadRouter);
router.use('/api/stories', storiesRouter);
router.use('/api/polls', pollsRouter);
router.use('/api/blog', blogRouter);
router.use('/api/knowledge', knowledgeRouter);
router.use('/api/hiring', knowledgeRouter);
router.use('/api/admin', adminRouter);
router.use('/api/payments', paymentsRouter);
router.use('/api/downloads', downloadRouter);
router.use('/api/install', installRouter);
router.use('/api/features', featuresRouter);
router.use('/api/history', historyRouter);
router.use('/api/docs', docsRouter);
router.use('/api/specs', specRouter);
router.use('/api/blog-landing', blogLandingRouter);

export { router };

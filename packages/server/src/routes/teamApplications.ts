// Публичный маршрут заявок в команду Balloo (тикет 1795888510).
// Админские операции (список, принятие, сообщение) живут в routes/admin.ts.

import { Router } from 'express';
import { submitTeamApplication } from '../controllers/teamApplicationController';
import { authRequired } from '../middleware/auth';

const router = Router() as import('express').Router;

// POST /api/team-applications — подать заявку (только авторизованный)
router.post('/', authRequired, submitTeamApplication);

export { router };

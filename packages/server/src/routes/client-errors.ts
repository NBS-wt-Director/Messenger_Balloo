// client-errors.ts — Маршруты клиентских событий ошибок (В-1…В-8, тикет 1791975722)
// POST /api/client-errors — публичный, rate-limited, запись лога + метрика

import { Router } from 'express';
import { clientErrorCtrl } from '../controllers/clientErrorController';

const router = Router() as import('express').Router;

// POST /api/client-errors — записать событие клиентской ошибки
router.post('/client-errors', clientErrorCtrl);

export { router };

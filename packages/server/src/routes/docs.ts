// Docs Router — маршруты для API документации (api.balloo.su/doc)
// Тикет №58 — Docs: API документация

import { Router } from 'express';
import {
  getApiSpec,
  getEndpoints,
  getEndpointDetail,
  getWebSocketEvents,
  getErrorCodes,
  getQuickStart,
} from '../controllers/docsController';

const router = Router() as import('express').Router;

// --- Публичные маршруты (без авторизации) ---
router.get('/spec', getApiSpec);
router.get('/endpoints', getEndpoints);
router.get('/endpoints/:path', getEndpointDetail);
router.get('/ws', getWebSocketEvents);
router.get('/errors', getErrorCodes);
router.get('/quick-start', getQuickStart);

export { router };

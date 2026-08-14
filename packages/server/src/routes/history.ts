// History Router — маршруты для истории версий
// Тикет №56 — History: changelog (узел 05)

import { Router } from 'express';
import {
  getVersionsController,
  getVersionController,
  getVersionNeighborsController,
  compareVersionsController,
} from '../controllers/historyController';

const router = Router() as import('express').Router;

// --- Публичные маршруты (без авторизации) ---
router.get('/versions', getVersionsController);
router.get('/versions/:id', getVersionController);
router.get('/versions/:id/neighbors', getVersionNeighborsController);
router.get('/compare', compareVersionsController);

export { router };

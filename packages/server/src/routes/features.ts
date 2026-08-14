// Features Router — маршруты для фич-реквестов
// Тикет №55 — Features: фич-реквесты (узел 04)

import { Router } from 'express';
import { authRequired } from '../middleware/auth';
import {
  createFeatureController,
  getFeaturesController,
  getFeatureController,
  updateFeatureController,
  deleteFeatureController,
  voteFeatureController,
  unvoteFeatureController,
  getCategoriesController,
  getFeatureStatsController,
} from '../controllers/featureController';

const router = Router() as import('express').Router;

// --- Публичные маршруты (без авторизации) ---
router.get('/', getFeaturesController);
router.get('/:id', getFeatureController);
router.get('/categories', getCategoriesController);
router.get('/stats', getFeatureStatsController);

// --- Маршруты с авторизацией ---
router.post('/', authRequired, createFeatureController);
router.put('/:id', authRequired, updateFeatureController);
router.delete('/:id', authRequired, deleteFeatureController);
router.post('/:id/vote', authRequired, voteFeatureController);
router.delete('/:id/vote', authRequired, unvoteFeatureController);

export { router };

// Spec Router — маршруты для спецификаций (specifity.balloo.su)
// Тикет №59 — Specifity: спецификация (узел 10)

import { Router } from 'express';
import { getSpecs, getSpec } from '../controllers/specController';

const router = Router() as import('express').Router;

// --- Публичные маршруты (без авторизации) ---
router.get('/', getSpecs);
router.get('/:nodeId/:screenId', getSpec);

export { router };

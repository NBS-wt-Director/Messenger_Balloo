// FeatureController — REST API для фич-реквестов
// Тикет №55 — Features: фич-реквесты (узел 04)

import { Request, Response } from 'express';
import {
  createFeature,
  getFeatures,
  getFeature,
  updateFeature,
  deleteFeature,
  voteFeature,
  unvoteFeature,
  getCategories,
  getFeatureStats,
} from '../services/featureService';

// --- Создать фич-реквест ---
export async function createFeatureController(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Необходима авторизация' });
      return;
    }

    const { title, description, category, priority, motivation } = req.body;

    if (!title || !description || !category) {
      res.status(400).json({ error: 'Заполните обязательные поля: название, описание, категория' });
      return;
    }

    if (title.length > 80) {
      res.status(400).json({ error: 'Название не должно превышать 80 символов' });
      return;
    }

    const feature = await createFeature(userId, {
      title,
      description,
      category,
      priority,
      motivation,
    });

    res.status(201).json(feature);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Список фич-реквестов ---
export async function getFeaturesController(req: Request, res: Response): Promise<void> {
  try {
    const { status, category, search, sortBy, page, limit } = req.query;

    const result = await getFeatures({
      status: status as string,
      category: category as string,
      search: search as string,
      sortBy: (sortBy as 'votes' | 'date' | 'comments') || 'votes',
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Детальная страница фич-реквеста ---
export async function getFeatureController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const feature = await getFeature(id);

    if (!feature) {
      res.status(404).json({ error: 'Фича не найдена' });
      return;
    }

    res.json(feature);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Обновить фич-реквест ---
export async function updateFeatureController(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const isAdmin = (req as any).user?.isAdmin;
    const { id } = req.params;
    const input = req.body;

    const feature = await updateFeature(id, userId, input);
    res.json(feature);
  } catch (error: any) {
    if (error.message === 'Feature not found') {
      res.status(404).json({ error: 'Фича не найдена' });
      return;
    }
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Удалить фич-реквест ---
export async function deleteFeatureController(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    await deleteFeature(id, userId);
    res.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Feature not found') {
      res.status(404).json({ error: 'Фича не найдена' });
      return;
    }
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Проголосовать ---
export async function voteFeatureController(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Необходима авторизация' });
      return;
    }

    const { id } = req.params;
    const result = await voteFeature(id, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Уже проголосовали') {
      res.status(409).json({ error: 'Уже проголосовали' });
      return;
    }
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Отменить голос ---
export async function unvoteFeatureController(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Необходима авторизация' });
      return;
    }

    const { id } = req.params;
    await unvoteFeature(id, userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Категории ---
export async function getCategoriesController(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Статистика ---
export async function getFeatureStatsController(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await getFeatureStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

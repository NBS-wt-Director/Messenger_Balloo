// HistoryController — REST API для истории версий
// Тикет №56 — History: changelog (узел 05)

import { Request, Response } from 'express';
import {
  getVersions,
  getVersion,
  getVersionNeighbors,
  compareVersions,
} from '../services/historyService';

// --- Список версий ---
export async function getVersionsController(req: Request, res: Response): Promise<void> {
  try {
    const { status, page, limit } = req.query;

    const result = await getVersions({
      status: status as string,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 50,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Детальная страница версии ---
export async function getVersionController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const version = await getVersion(id);

    if (!version) {
      res.status(404).json({ error: 'Версия не найдена' });
      return;
    }

    res.json(version);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Соседние версии ---
export async function getVersionNeighborsController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const neighbors = await getVersionNeighbors(id);

    if (!neighbors) {
      res.status(404).json({ error: 'Версия не найдена' });
      return;
    }

    res.json(neighbors);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Сравнение двух версий ---
export async function compareVersionsController(req: Request, res: Response): Promise<void> {
  try {
    const { v1, v2 } = req.query;

    if (!v1 || !v2) {
      res.status(400).json({ error: 'Укажите параметры v1 и v2' });
      return;
    }

    const result = await compareVersions(v1 as string, v2 as string);

    if (!result) {
      res.status(404).json({ error: 'Одна или обе версии не найдены' });
      return;
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

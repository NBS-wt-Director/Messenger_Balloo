// SpecController — REST API для спецификаций экранов (specifity.balloo.su)
// Тикет №59 — Specifity: спецификация (узел 10)

import { Request, Response } from 'express';
import { SPEC_NODES, SPEC_SCREENS } from '../services/specData';
import { internalError } from '../middleware/errorHandler';

// --- Список всех спецификаций (по узлам/экранам) ---
export async function getSpecs(_req: Request, res: Response): Promise<void> {
  try {
    const nodes = SPEC_NODES.map((node) => ({
      id: node.id,
      name: node.name,
      icon: node.icon,
      domain: node.domain,
      screenCount: node.screenCount,
      screens: node.screens.map((s) => ({
        id: s.id,
        title: s.title,
        file: s.file,
      })),
    }));

    res.json({
      totalNodes: nodes.length,
      totalScreens: nodes.reduce((sum, n) => sum + n.screenCount, 0),
      nodes,
    });
  } catch (error: any) {
    internalError(res, error, 'specController.getSpecs');
  }
}

// --- Спецификация конкретного экрана ---
export async function getSpec(req: Request, res: Response): Promise<void> {
  try {
    const { nodeId, screenId } = req.params;
    const spec = SPEC_SCREENS[screenId];

    if (!spec) {
      res.status(404).json({ error: 'Спецификация не найдена' });
      return;
    }

    if (spec.nodeId !== nodeId) {
      res.status(404).json({ error: 'Экран не принадлежит указанному узлу' });
      return;
    }

    res.json(spec);
  } catch (error: any) {
    internalError(res, error, 'specController.getSpec');
  }
}

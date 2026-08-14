// DocsController — REST API для API документации (api.balloo.su/doc)
// Тикет №58 — Docs: API документация

import { Request, Response } from 'express';
import {
  API_MODULES,
  WS_CLIENT_EVENTS,
  WS_SERVER_EVENTS,
  ERROR_CODES,
  QUICK_START,
} from '../services/docsData';

// --- OpenAPI спецификация (JSON) ---
export async function getApiSpec(_req: Request, res: Response): Promise<void> {
  try {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Balloo Messenger API',
        version: '1.0.0',
        description: 'REST + WebSocket API для мессенджера Balloo',
      },
      servers: [
        { url: 'https://api.balloo.su/v1', description: 'Production' },
        { url: 'wss://balloo.su/ws', description: 'WebSocket' },
      ],
      paths: API_MODULES.reduce((acc, mod) => {
        for (const ep of mod.endpoints) {
          acc[ep.path] = {
            [ep.method.toLowerCase()]: {
              summary: ep.description,
              tags: [mod.name],
              security: ep.auth ? [{ bearerAuth: [] }] : [],
            },
          };
        }
        return acc;
      }, {} as Record<string, any>),
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    };

    res.json(spec);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Список всех эндпоинтов с группировкой по модулям ---
export async function getEndpoints(_req: Request, res: Response): Promise<void> {
  try {
    const modules = API_MODULES.map((mod) => ({
      id: mod.id,
      name: mod.name,
      icon: mod.icon,
      description: mod.description,
      endpointCount: mod.endpoints.length,
      endpoints: mod.endpoints.map((ep) => ({
        method: ep.method,
        path: ep.path,
        description: ep.description,
        auth: ep.auth || false,
      })),
    }));

    res.json({
      baseUrl: 'https://api.balloo.su/v1',
      wsUrl: 'wss://balloo.su/ws',
      version: '1.0.0',
      modules,
      totalEndpoints: API_MODULES.reduce((sum, m) => sum + m.endpoints.length, 0),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Детальная информация по эндпоинту ---
export async function getEndpointDetail(req: Request, res: Response): Promise<void> {
  try {
    const { path } = req.params;
    const decodedPath = decodeURIComponent(path);

    for (const mod of API_MODULES) {
      for (const ep of mod.endpoints) {
        if (ep.path === decodedPath) {
          res.json({
            module: { id: mod.id, name: mod.name, icon: mod.icon },
            ...ep,
          });
          return;
        }
      }
    }

    res.status(404).json({ error: 'Эндпоинт не найден' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- WebSocket events ---
export async function getWebSocketEvents(_req: Request, res: Response): Promise<void> {
  try {
    res.json({
      url: 'wss://balloo.su/ws?token=<JWT>',
      clientToServer: WS_CLIENT_EVENTS,
      serverToClient: WS_SERVER_EVENTS,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Коды ошибок ---
export async function getErrorCodes(_req: Request, res: Response): Promise<void> {
  try {
    res.json(ERROR_CODES);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// --- Быстрый старт ---
export async function getQuickStart(_req: Request, res: Response): Promise<void> {
  try {
    res.json(QUICK_START);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

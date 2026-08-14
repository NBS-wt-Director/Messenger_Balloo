// ============================================================
// Cache middleware — HTTP caching + Redis cache (тикет №64)
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cacheService';

// --- HTTP Cache middleware ---
// Устанавливает Cache-Control, ETag, Last-Modified для GET запросов
export function httpCache(maxAge: number = 60, immutable: boolean = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Только для GET запросов
    if (req.method !== 'GET') {
      next();
      return;
    }

    const cacheControl = immutable
      ? `public, max-age=${maxAge}, immutable`
      : `public, max-age=${maxAge}, must-revalidate`;
    res.setHeader('Cache-Control', cacheControl);

    // ETag — для условных запросов
    const etag = req.originalUrl;
    res.setHeader('ETag', `"${etag}"`);

    // If-None-Match — если клиент уже имеет кэш
    if (req.headers['if-none-match'] === `"${etag}"`) {
      res.sendStatus(304);
      return;
    }

    // Last-Modified
    const now = new Date();
    res.setHeader('Last-Modified', now.toUTCString());
    res.setHeader('Vary', 'Accept-Encoding');

    next();
  };
}

// --- Redis cache middleware ---
// Пробует получить данные из Redis; если нет — вызывает next и кэширует response
export function redisCache(key: string, ttl?: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Только для GET запросов
    if (req.method !== 'GET') {
      next();
      return;
    }

    const data = await cacheService.get<any>(key);
    if (data) {
      res.set('X-Cache', 'HIT');
      res.json(data);
      return;
    }

    // Cache miss — перехватываем res.json
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (ttl) {
        cacheService.set(key, body).catch(() => {
          // Ignore cache errors
        });
      }
      res.set('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

// --- Cache invalidation helper for POST/PUT/DELETE ---
export async function invalidateCache(keys: string[]) {
  for (const key of keys) {
    await cacheService.invalidateByPrefix(key);
  }
}

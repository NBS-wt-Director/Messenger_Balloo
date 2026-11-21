import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

// ============================================================
// Service API auth — доступ к /api/service/* по длинному секрету.
//
// Ключ передаётся заголовком `X-Service-Key: <key>` (или
// `Authorization: Bearer <key>` для curl-удобства). Значение хранится в
// переменной окружения SERVICE_API_KEY и в незагружаемом в git документе
// docs/local/service-api.md.
//
// Сравнение — timing-safe (crypto.timingSafeEqual), чтобы по времени ответа
// нельзя было побайтово подобрать ключ.
// ============================================================

const MIN_KEY_LENGTH = 32;

// Извлечение ключа из запроса
const extractServiceKey = (req: Request): string => {
  const headerKey = req.headers['x-service-key'];
  if (typeof headerKey === 'string' && headerKey.length > 0) {
    return headerKey;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return '';
};

export const serviceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const expected = env.SERVICE_API_KEY;

  // Фича выключена, если ключ не задан или слишком короткий: отвечаем 404,
  // чтобы не подтверждать существование маршрута.
  if (!expected || expected.length < MIN_KEY_LENGTH) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  const provided = extractServiceKey(req);

  if (!provided) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Не предоставлен сервисный ключ (X-Service-Key)',
    });
    return;
  }

  const providedBuf = Buffer.from(provided, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');

  // Длины сравниваем отдельно: timingSafeEqual падает на буферах разной длины.
  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Недействительный сервисный ключ',
    });
    return;
  }

  next();
};

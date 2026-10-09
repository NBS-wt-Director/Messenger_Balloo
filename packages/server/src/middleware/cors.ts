import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from '../config/env';

// CORS настройка.
//
// Origin — ТОЛЬКО явный список из CORS_ORIGIN (тик. 1791489922, решение владельца
// 09.10.2026). Ветки `origin: true` для CORS_ORIGIN='*' больше нет: вместе с
// `credentials: true` она возвращала Access-Control-Allow-Origin = origin
// запроса, то есть любой сайт получал доступ к API с cookie пользователя.
// Значение '*' отклоняет сама схема env (config/env.ts), поэтому до сюда
// оно не доходит; пустой список после разбора тоже закрыт.
const allowedOrigins = env.CORS_ORIGIN.split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  throw new Error(
    'CORS_ORIGIN содержит только пустые значения — укажите origin\'ы через запятую',
  );
}

export const corsMiddleware = cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 600, // preflight cache 10 минут
});

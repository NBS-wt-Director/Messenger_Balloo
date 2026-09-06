import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors';
import { applyRateLimit } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import {
  securityHeaders,
  hppMiddleware,
  csrfProtection,
  inputSanitizer,
  rateLimitLogger,
  securityLogger,
} from './middleware/security';
import { router as baseRouter } from './routes';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import * as Minio from 'minio';
import { env } from './config/env';

const app: Application = express();

// ============================================================
// Security Middleware — тикет №65 (Security audit)
// Порядок важен: security middleware ДО других
// ============================================================

// 1. Helmet — security headers (CSP, HSTS, X-Frame-Options, XSS Filter, etc.)
app.use(securityHeaders);

// 2. CORS — контроль источников (строгий режим)
app.use(corsMiddleware);

// 3. HPP — HTTP Parameter Pollution protection
app.use(hppMiddleware);

// 4. Body parser с лимитом
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Cookie parser — для чтения JWT из httpOnly cookie
app.use(cookieParser());

// 6. Input sanitizer — очистка от XSS в body/query/cookies
app.use(inputSanitizer);

// 7. Rate limiting — защита от brute-force и DoS
app.use(applyRateLimit);

// 8. Rate limit logging — логирование нарушений
app.use(rateLimitLogger);

// 9. Security logging — логирование подозрительных запросов
app.use(securityLogger);

// 10. CSRF protection — для stateful endpoints (fallback для JWT)
app.use(csrfProtection);

// 11. BigInt JSON serializer — ДО router
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const replacer = (_key: string, value: any) =>
      typeof value === 'bigint' ? value.toString() : value;
    return originalJson(JSON.parse(JSON.stringify(body, replacer)));
  };
  next();
});

// Health check endpoints — синглтоны для проверок
const healthPrisma = new PrismaClient();
const healthRedis = new Redis(env.REDIS_URL);
const healthMinio = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: Number(env.MINIO_PORT),
  useSSL: env.MINIO_USE_SSL === 'true',
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Readiness probe — проверка всех зависимостей (для Kubernetes/Docker)
app.get('/health/ready', async (_req, res) => {
  const checks: Record<string, { ok: boolean; error?: string }> = {};

  // 1. PostgreSQL
  try {
    await healthPrisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true };
  } catch (e) {
    checks.database = { ok: false, error: (e as Error).message };
  }

  // 2. Redis
  try {
    await healthRedis.ping();
    checks.redis = { ok: true };
  } catch (e) {
    checks.redis = { ok: false, error: (e as Error).message };
  }

  // 3. MinIO
  try {
    await healthMinio.listBuckets();
    checks.minio = { ok: true };
  } catch (e) {
    checks.minio = { ok: false, error: (e as Error).message };
  }

  const allOk = Object.values(checks).every(c => c.ok);
  const status = allOk ? 'ready' : 'not_ready';
  const httpStatus = allOk ? 200 : 503;

  res.status(httpStatus).json({ status, checks, timestamp: Date.now() });
});

// Базовый роутер
app.use('/', baseRouter);

// 404 handler
app.use(notFoundHandler);

// Глобальный errorHandler (должен быть последним)
app.use(errorHandler);

export { app };

import express, { Application } from 'express';
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

// 5. Input sanitizer — очистка от XSS в body/query/cookies
app.use(inputSanitizer);

// 6. Rate limiting — защита от brute-force и DoS
app.use(applyRateLimit);

// 7. Rate limit logging — логирование нарушений
app.use(rateLimitLogger);

// 8. Security logging — логирование подозрительных запросов
app.use(securityLogger);

// 9. CSRF protection — для stateful endpoints (fallback для JWT)
app.use(csrfProtection);

// 10. BigInt JSON serializer — ДО router
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const replacer = (_key: string, value: any) =>
      typeof value === 'bigint' ? value.toString() : value;
    return originalJson(JSON.parse(JSON.stringify(body, replacer)));
  };
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Базовый роутер
app.use('/', baseRouter);

// 404 handler
app.use(notFoundHandler);

// Глобальный errorHandler (должен быть последним)
app.use(errorHandler);

export { app };

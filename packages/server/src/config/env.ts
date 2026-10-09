import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Схема экспортирована отдельно: тесты проверяют отклонение значений (пустой/`*`
// CORS_ORIGIN) без падения модуля при импорте.
export const envSchema = z.object({
  // Server
  SERVER_PORT: z.string().regex(/^\d+$/).default('3000'),
  SERVER_HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().regex(/^\d+$/).default('900'), // 15 минут в секундах
  JWT_REFRESH_EXPIRES_IN: z.string().regex(/^\d+$/).default('2592000'), // 30 дней в секундах

  // Redis (для rate limiting и сессий)
  REDIS_URL: z.string().url().optional().default('redis://localhost:6379'),

  // CORS — РАЗРЕШИТЕЛЬНЫЙ СПИСОК origin'ов через запятую (Вариант C: каждый
  // поддомен = отдельный origin). Только для middleware/cors.ts и CSP connectSrc.
  // НЕ использовать как «адрес приложения» — для этого есть APP_URL.
  //
  // Переменная обязательна (решение владельца 09.10.2026, тикет 1791489922):
  // раньше был default '*', и middleware/cors.ts при '*' ставил `origin: true`
  // вместе с `credentials: true` — сервер отвечал ACAO любому origin, а браузер
  // пропускал запрос с cookie. Отсутствие переменной теперь роняет старт вместо
  // тихого открытия CORS на весь мир.
  CORS_ORIGIN: z
    .string({ required_error: 'CORS_ORIGIN не задан: укажите список origin\'ов через запятую' })
    .min(1, 'CORS_ORIGIN пустой: укажите список origin\'ов через запятую')
    .refine(
      (value) => value !== '*',
      'CORS_ORIGIN="*" запрещён: вместе с credentials это отдаёт токены любому сайту. ' +
        'Перечислите origin\'ы явно, например https://balloo.su,https://admin.balloo.su',
    ),

  // APP_URL — публичный origin ФРОНТЕНДА (куда возвращаем пользователя после
  // OAuth, откуда ссылки писем и возврат платежей). Один URL, не список.
  // Отделён от CORS_ORIGIN (2026-09-20, тикет №0 мультитикета поддоменов):
  // CORS_ORIGIN стал списком из 8 поддоменов, и использовать его как «адрес
  // приложения» больше нельзя — редирект/письма склеили бы весь список.
  APP_URL: z.string().default('https://balloo.su'),

  // MinIO (CDN/хранилище)
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.string().regex(/^\d+$/).default('9000'),
  MINIO_USE_SSL: z.string().default('false'),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET: z.string().default('balloo-media'),

  // Email (SMTP) — self-hosted Postfix по умолчанию
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().regex(/^\d+$/).default('25'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@balloo.su'),
  SMTP_TLS: z.string().default('false'),

  // Yandex OAuth
  YANDEX_CLIENT_ID: z.string().optional(),
  YANDEX_CLIENT_SECRET: z.string().optional(),
  YANDEX_REDIRECT_URI: z.string().optional(),

  // VK OAuth
  VK_CLIENT_ID: z.string().optional(),
  VK_CLIENT_SECRET: z.string().optional(),
  VK_REDIRECT_URI: z.string().optional(),

  // Mail.ru OAuth
  MAILRU_CLIENT_ID: z.string().optional(),
  MAILRU_CLIENT_SECRET: z.string().optional(),
  MAILRU_REDIRECT_URI: z.string().optional(),

  // VAPID (Web Push)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:admin@balloo.su'),

  // ЮKassa (платежи — заглушка, СБП по умолчанию)
  YOOKASSA_SHOP_ID: z.string().optional(),
  YOOKASSA_API_KEY: z.string().optional(),
  YOOKASSA_WEBHOOK_URL: z.string().optional(),

  // Setup password (для первоначальной настройки)
  SETUP_PASSWORD: z.string().default(''),

  // Admin install password
  ADMIN_INSTALL_PASSWORD: z.string().default(''),

  // File upload
  MAX_FILE_SIZE: z.string().default('52428800'),
});

export const env = envSchema.parse(process.env);

// Типизированный экспорт
export type Env = z.infer<typeof envSchema>;

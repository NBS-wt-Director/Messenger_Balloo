// InstallController — API для первичной установки Balloo
// Все endpoints НЕ требуют аутентификации (система ещё не настроена)
// После установки — только проверка пароля ADMIN_INSTALL_PASSWORD

import { Router, Request, Response } from 'express';
import {
  isInstalled,
  testDatabase,
  testRedis,
  testDomain,
  testApiKey,
  applyInstallConfig,
  restartServices,
  generateJwtSecret,
  hashPassword,
} from '../services/installService';
import type { InstallConfig } from '../services/installService';

const router: Router = Router();

// ============================================
// GET /api/install/status
// Статус системы
// ============================================
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    installed: isInstalled(),
    version: '1.0.0',
  });
});

// ============================================
// POST /api/install/verify-password
// Проверка пароля установки
// ============================================
router.post('/verify-password', (req: Request, res: Response) => {
  const { password } = req.body;
  const expected = process.env.ADMIN_INSTALL_PASSWORD || '131013';

  if (password === expected) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: 'Неверный пароль' });
  }
});

// ============================================
// POST /api/install/test-db
// Тест подключения к БД
// ============================================
router.post('/test-db', (req: Request, res: Response) => {
  const { dbHost, dbPort, dbName, dbUser, dbPassword } = req.body;

  if (!dbHost || !dbName || !dbUser) {
    return res.status(400).json({ ok: false, error: 'Не указаны обязательные поля' });
  }

  const result = testDatabase({
    dbHost,
    dbPort: parseInt(dbPort) || 5432,
    dbName,
    dbUser,
    dbPassword: dbPassword || '',
  });

  if (result.ok) {
    res.json({ ok: true, message: 'Подключение к PostgreSQL успешно' });
  } else {
    res.status(400).json({ ok: false, error: result.error });
  }
});

// ============================================
// POST /api/install/test-redis
// Тест подключения к Redis
// ============================================
router.post('/test-redis', (req: Request, res: Response) => {
  const { redisHost, redisPort, redisPassword } = req.body;

  if (!redisHost) {
    return res.status(400).json({ ok: false, error: 'Не указан Redis хост' });
  }

  const result = testRedis({
    redisHost,
    redisPort: parseInt(redisPort) || 6379,
    redisPassword: redisPassword || '',
  });

  if (result.ok) {
    res.json({ ok: true, message: 'Подключение к Redis успешно' });
  } else {
    res.status(400).json({ ok: false, error: result.error });
  }
});

// ============================================
// POST /api/install/test-domain
// Проверка доступности домена
// ============================================
router.post('/test-domain', (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ ok: false, error: 'Не указан URL' });
  }

  const result = testDomain(url);

  if (result.ok) {
    res.json({ ok: true, message: `Домен ${url} доступен` });
  } else {
    res.status(400).json({ ok: false, error: result.error });
  }
});

// ============================================
// POST /api/install/test-api-key
// Проверка ключа API
// ============================================
router.post('/test-api-key', (req: Request, res: Response) => {
  const { service, key } = req.body;

  if (!service || !key) {
    return res.status(400).json({ ok: false, error: 'Не указаны service и key' });
  }

  const result = testApiKey(service, key);

  if (result.ok) {
    res.json({ ok: true, message: `Ключ ${service} валиден` });
  } else {
    res.status(400).json({ ok: false, error: result.error });
  }
});

// ============================================
// POST /api/install/generate-jwt-secret
// Генерация JWT secret
// ============================================
router.post('/generate-jwt-secret', (_req: Request, res: Response) => {
  const secret = generateJwtSecret();
  res.json({ secret });
});

// ============================================
// POST /api/install/apply
// Применение всех настроек
// ============================================
router.post('/apply', (req: Request, res: Response) => {
  // Проверка пароля
  const { password, ...config } = req.body;
  const expected = process.env.ADMIN_INSTALL_PASSWORD || '131013';

  if (password !== expected) {
    return res.status(401).json({ ok: false, error: 'Неверный пароль установки' });
  }

  // Проверка обязательных полей
  if (!config.dbHost || !config.dbName || !config.dbUser || !config.dbPassword) {
    return res.status(400).json({ ok: false, error: 'Не заполнены обязательные поля БД' });
  }

  // Создаём InstallConfig
  const installConfig: InstallConfig = {
    // БД
    dbHost: config.dbHost,
    dbPort: parseInt(config.dbPort) || 5432,
    dbName: config.dbName,
    dbUser: config.dbUser,
    dbPassword: config.dbPassword,

    // Redis
    redisHost: config.redisHost || 'localhost',
    redisPort: parseInt(config.redisPort) || 6379,
    redisPassword: config.redisPassword || '',

    // Домены
    domains: config.domains || {},

    // OAuth
    yandexClientId: config.yandexClientId || '',
    yandexClientSecret: config.yandexClientSecret || '',
    vkClientId: config.vkClientId || '',
    vkClientSecret: config.vkClientSecret || '',
    mailruClientId: config.mailruClientId || '',
    mailruClientSecret: config.mailruClientSecret || '',

    // Payments
    yookassaShopId: config.yookassaShopId || '',
    yookassaApiKey: config.yookassaApiKey || '',

    // CDN
    minioEndpoint: config.minioEndpoint || 'localhost',
    minioPort: parseInt(config.minioPort) || 9000,
    minioAccessKey: config.minioAccessKey || 'minioadmin',
    minioSecretKey: config.minioSecretKey || 'minioadmin',
    minioBucket: config.minioBucket || 'balloo',

    // SMTP
    smtpHost: config.smtpHost || 'localhost',
    smtpPort: parseInt(config.smtpPort) || 25,
    smtpUser: config.smtpUser || '',
    smtpPassword: config.smtpPassword || '',
    smtpFromEmail: config.smtpFromEmail || 'noreply@balloo.su',
    smtpTls: config.smtpTls || 'false',

    // Push
    pushPublicKey: config.pushPublicKey || '',
    pushPrivateKey: config.pushPrivateKey || '',
    pushSubject: config.pushSubject || 'mailto:admin@balloo.su',

    // Security
    jwtSecret: config.jwtSecret || generateJwtSecret(),
    jwtAccessTtl: parseInt(config.jwtAccessTtl) || 900,
    jwtRefreshTtl: parseInt(config.jwtRefreshTtl) || 2592000,
    setupPassword: config.setupPassword || '06041996ОИА',
    adminInstallPassword: config.adminInstallPassword || '131013',
  };

  const result = applyInstallConfig(installConfig);

  if (result.ok) {
    // Перезапуск сервисов
    restartServices();

    res.json({
      ok: true,
      message: 'Настройки применены. Сервисы перезапускаются...',
      steps: result.steps,
    });
  } else {
    res.status(500).json({
      ok: false,
      error: result.error,
      steps: result.steps,
    });
  }
});

// ============================================
// POST /api/install/restart-services
// Перезапуск всех сервисов
// ============================================
router.post('/restart-services', (req: Request, res: Response) => {
  const { password } = req.body;
  const expected = process.env.ADMIN_INSTALL_PASSWORD || '131013';

  if (password !== expected) {
    return res.status(401).json({ ok: false, error: 'Неверный пароль' });
  }

  const result = restartServices();

  if (result.ok) {
    res.json({ ok: true, message: 'Сервисы перезапускаются...' });
  } else {
    res.status(500).json({ ok: false, error: result.error });
  }
});

export { router };

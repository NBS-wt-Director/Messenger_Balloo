// client-errors.test.ts — Тесты POST /api/client-errors (В-1…В-8, тикет 1791975722)
// Интеграционный: supertest + реальная локальная БД balloo.

import request from 'supertest';
import { app } from './helpers';

const prisma = new (require('@prisma/client').PrismaClient)();

describe('POST /api/client-errors', () => {
  const metricName = `client_error:test_${Date.now()}`;

  afterAll(async () => {
    // Удаляем тестовую метрику
    await prisma.serviceMetric.deleteMany({ where: { name: { startsWith: 'client_error:test_' } } });
    await prisma.$disconnect();
  });

  it('принимает корректный запрос без авторизации (публичный) → 201', async () => {
    const res = await request(app)
      .post('/api/client-errors')
      .send({
        code: 'test_404',
        url: 'https://balloo.su/#/nonexistent',
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
        timestamp: Math.floor(Date.now() / 1000),
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
  });

  it('создаёт ServiceMetric при первом событии', async () => {
    const code = `test_${Date.now()}`;
    await request(app)
      .post('/api/client-errors')
      .send({ code, url: '/test', timestamp: Math.floor(Date.now() / 1000) });

    const metric = await prisma.serviceMetric.findFirst({
      where: { name: `client_error:${code}` },
    });

    expect(metric).not.toBeNull();
    expect(metric!.value).toBe(1);
  });

  it('инкрементирует ServiceMetric при повторном событии', async () => {
    const code = `test_inc_${Date.now()}`;
    await request(app)
      .post('/api/client-errors')
      .send({ code, url: '/test', timestamp: Math.floor(Date.now() / 1000) });

    await request(app)
      .post('/api/client-errors')
      .send({ code, url: '/test', timestamp: Math.floor(Date.now() / 1000) });

    const metric = await prisma.serviceMetric.findFirst({
      where: { name: `client_error:${code}` },
    });

    expect(metric).not.toBeNull();
    expect(metric!.value).toBe(2);
  });

  it('принимает пустое тело (все поля опциональны) → 201', async () => {
    const res = await request(app)
      .post('/api/client-errors')
      .send({});

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
  });
});

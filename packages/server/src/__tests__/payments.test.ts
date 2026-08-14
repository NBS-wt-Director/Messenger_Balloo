import request from 'supertest';
import { app, registerTestUser } from './helpers';

describe('Payments API', () => {
  describe('GET /api/payments/config', () => {
    it('returns payment configuration (public)', async () => {
      const res = await request(app).get('/api/payments/config');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('mode');
      expect(['anonymous', 'yookassa']).toContain(res.body.mode);
      expect(res.body).toHaveProperty('sbpQrUrl');
      expect(res.body).toHaveProperty('sbpPhoneNumber');
    });
  });

  describe('GET /api/payments/tiers', () => {
    it('returns donation tiers (public)', async () => {
      const res = await request(app).get('/api/payments/tiers');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tiers');
    });
  });

  describe('POST /api/payments/donate', () => {
    it('creates a donation', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/payments/donate')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ amount: 500, currency: 'RUB' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('donationId');
      expect(res.body).toHaveProperty('mode');
    });

    it('rejects without auth', async () => {
      const res = await request(app)
        .post('/api/payments/donate')
        .send({ amount: 500 });

      expect(res.status).toBe(401);
    });

    it('rejects amount <= 0', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/payments/donate')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ amount: 0 });

      expect(res.status).toBe(400);
    });

    it('rejects without amount', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/payments/donate')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/payments/me/donations', () => {
    it('returns user donations history', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .get('/api/payments/me/donations')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/payments/me/donations');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/payments/webhook/yookassa', () => {
    it('accepts webhook (public endpoint)', async () => {
      const res = await request(app)
        .post('/api/payments/webhook/yookassa')
        .send({ type: 'notification', event: 'payment.succeeded', object: { id: 'test', status: 'succeeded', metadata: {} } });

      // Webhook without valid metadata returns error, but endpoint is reachable
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('Admin endpoints', () => {
    it('GET /api/payments/admin/config rejects without admin', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .get('/api/payments/admin/config')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(403);
    });

    it('GET /api/payments/admin/donations rejects without admin', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .get('/api/payments/admin/donations')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(403);
    });
  });
});

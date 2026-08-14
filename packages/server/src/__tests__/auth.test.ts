import request from 'supertest';
import { app, registerTestUser, loginTestUser } from './helpers';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `auth_test_${Date.now()}@test.balloo.ru`,
          password: 'Test1234',
          username: `authuser_${Date.now()}`,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('email');
    });

    it('rejects registration without email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'Test1234' });

      expect(res.status).toBe(400);
    });

    it('rejects registration without password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'nopass@test.balloo.ru' });

      expect(res.status).toBe(400);
    });

    it('rejects duplicate email', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: user.email,
          password: 'Test1234',
          username: `other_${Date.now()}`,
        });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.user.needs2FA).toBe(false);
    });

    it('rejects login with wrong password', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('rejects login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.balloo.ru', password: 'Test1234' });

      expect(res.status).toBe(401);
    });

    it('rejects login without email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Test1234' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('refreshes tokens successfully', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${user.refreshToken}`)
        .send({ refreshToken: user.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
    });

    it('rejects refresh without token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect([400, 401]).toContain(res.status);
    });

    it('rejects refresh with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('logs out successfully', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: user.refreshToken });

      expect(res.status).toBe(200);
    });

    it('rejects logout without token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/request-reset', () => {
    it('accepts reset request for existing email', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/auth/request-reset')
        .send({ email: user.email });

      expect(res.status).toBe(200);
    });

    it('rejects reset without email', async () => {
      const res = await request(app)
        .post('/api/auth/request-reset')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('Protected routes', () => {
    it('rejects 2fa/enable without auth', async () => {
      const res = await request(app)
        .post('/api/auth/2fa/enable')
        .send({ method: 'totp' });

      expect(res.status).toBe(401);
    });

    it('rejects devices endpoint without auth', async () => {
      const res = await request(app)
        .get('/api/auth/devices');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('returns health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});

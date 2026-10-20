/**
 * Тесты эндпоинтов смены пароля из настроек (тикет 1792477132-03)
 * POST /api/users/me/password/send-code
 * POST /api/users/me/password
 */
import request from 'supertest';
import { app, registerTestUser, generateToken } from './helpers';

describe('POST /api/users/me/password/send-code', () => {
  it('неавторизованный → 401', async () => {
    const res = await request(app).post('/api/users/me/password/send-code');
    expect(res.status).toBe(401);
  });

  it('успешная отправка кода → 200', async () => {
    const user = await registerTestUser();
    const token = generateToken(user.id, user.email, user.username);

    const res = await request(app)
      .post('/api/users/me/password/send-code')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('POST /api/users/me/password', () => {
  it('неавторизованный → 401', async () => {
    const res = await request(app).post('/api/users/me/password');
    expect(res.status).toBe(401);
  });

  it('короткий код → 400', async () => {
    const user = await registerTestUser();
    const token = generateToken(user.id, user.email, user.username);

    const res = await request(app)
      .post('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '12345', newPassword: 'newpassword123' });

    expect(res.status).toBe(400);
  });

  it('короткий пароль → 400', async () => {
    const user = await registerTestUser();
    const token = generateToken(user.id, user.email, user.username);

    const res = await request(app)
      .post('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123456', newPassword: 'short' });

    expect(res.status).toBe(400);
  });

  it('неверный код → 400', async () => {
    const user = await registerTestUser();
    const token = generateToken(user.id, user.email, user.username);

    const res = await request(app)
      .post('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000', newPassword: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Неверный');
  });
});

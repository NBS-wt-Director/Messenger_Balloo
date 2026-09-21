// P33 (регрессионный тест, 2026-09-21): OAuth-вход/привязка по email на
// НЕАКТИВНЫЙ аккаунт (deleted/banned/suspended) должна ОТКАЗЫВАТЬ, а не
// молча впускать под чужим аккаунтом. Сценарий бага: Яндекс-ящик владельца
// совпал с email мягко удалённого e2e-тестового аккаунта → oauthLogin
// привязал OAuth-аккаунт к deleted-пользователю и вошёл под ним.
//
// ⚠️ Порядок импортов ВАЖЕН (как в admin.test.ts): './helpers' ДО
// '@prisma/client'. Prisma при импорте грузит packages/shared/prisma/.env,
// где JWT_REFRESH_EXPIRES_IN в невалидном для config/env.ts формате —
// dotenv не перекрывает уже установленные переменные, и env-валидация падает.
import request from 'supertest';
import { app, registerTestUser } from './helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const now = () => BigInt(Math.floor(Date.now() / 1000));

describe('P33: OAuth login vs inactive account', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects OAuth binding by email when the user is deleted (403, no binding)', async () => {
    const user = await registerTestUser();

    // Мягкое удаление — ровно как это делает приложение (adminController)
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'deleted', updatedAt: now() },
    });

    const providerId = `p33_deleted_${Date.now()}`;

    const res = await request(app)
      .post('/api/auth/oauth/yandex')
      .send({
        provider: 'yandex',
        providerId,
        email: user.email,
        username: 'p33_deleted_user',
      });

    // Отказ, не вход: 403 + дружелюбное сообщение, не 500
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Аккаунт удалён');

    // Привязка НЕ создана — иначе следующий вход прошёл бы под deleted-аккаунтом
    const binding = await prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider: 'yandex', providerId } },
    });
    expect(binding).toBeNull();
  });

  it('rejects OAuth login when an existing binding belongs to a banned user', async () => {
    const user = await registerTestUser();
    const providerId = `p33_banned_${Date.now()}`;

    // Существующая привязка (пользователь раньше входил через OAuth)...
    await prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        provider: 'yandex',
        providerId,
        createdAt: now(),
        updatedAt: now(),
      },
    });

    // ...но аккаунт потом забанили
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'banned', updatedAt: now() },
    });

    const res = await request(app)
      .post('/api/auth/oauth/yandex')
      .send({ provider: 'yandex', providerId });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Аккаунт заблокирован');
    // Токены не выдаются
    const raw: unknown = res.headers['set-cookie'];
    const cookies: string[] = Array.isArray(raw) ? (raw as string[]) : [];
    expect(cookies.some((c) => c.startsWith('balloo-access-token='))).toBe(false);
  });

  it('still binds OAuth to an ACTIVE user by email (P2002-fix regression guard)', async () => {
    const user = await registerTestUser();
    const providerId = `p33_active_${Date.now()}`;

    const res = await request(app)
      .post('/api/auth/oauth/yandex')
      .send({
        provider: 'yandex',
        providerId,
        email: user.email,
        username: user.username,
      });

    // Активный пользователь — привязка и вход работают как до фикса
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);

    const binding = await prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider: 'yandex', providerId } },
    });
    expect(binding).not.toBeNull();
    expect(binding!.userId).toBe(user.id);
  });
});

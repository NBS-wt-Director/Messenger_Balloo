import { app, registerTestUser } from './helpers';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let userA: { id: string; accessToken: string };

beforeAll(async () => {
  userA = await registerTestUser();
});

afterAll(async () => {
  // cleanup
});

describe('B6-3: PATCH /api/users/me/onboarding', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .patch('/api/users/me/onboarding')
      .send({ completed: true });

    expect(res.status).toBe(401);
  });

  it('returns 400 for missing completed', async () => {
    const res = await request(app)
      .patch('/api/users/me/onboarding')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('sets onboardingCompleted=true', async () => {
    const res = await request(app)
      .patch('/api/users/me/onboarding')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.user.onboardingCompleted).toBe(true);
  });

  it('sets onboardingCompleted=false', async () => {
    // Сначала true
    await request(app)
      .patch('/api/users/me/onboarding')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ completed: true });

    // Потом false
    const res = await request(app)
      .patch('/api/users/me/onboarding')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ completed: false });

    expect(res.status).toBe(200);
    expect(res.body.user.onboardingCompleted).toBe(false);
  });

  it('persists to database', async () => {
    await request(app)
      .patch('/api/users/me/onboarding')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ completed: true });

    const user = await prisma.user.findUnique({ where: { id: userA.id } });
    expect(user?.onboardingCompleted).toBe(true);
  });
});

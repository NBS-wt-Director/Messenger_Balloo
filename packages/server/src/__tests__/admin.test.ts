import request from 'supertest';
import { app, registerTestUser, generateToken } from './helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser(): Promise<{ id: string; email: string; accessToken: string }> {
  const user = await registerTestUser();
  // Promote to admin
  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'admin' },
  });
  // Generate new token with admin role
  const accessToken = generateToken(user.id, user.email, user.username, 'admin');
  return { id: user.id, email: user.email, accessToken };
}

describe('Admin API', () => {
  describe('Access control', () => {
    it('rejects admin endpoints without auth', async () => {
      const res = await request(app).get('/api/admin/users');

      expect(res.status).toBe(401);
    });

    it('rejects admin endpoints for non-admin users', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('returns users list for admin', async () => {
      const admin = await createAdminUser();

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('pagination');
    });

    it('supports search query', async () => {
      const admin = await createAdminUser();

      const res = await request(app)
        .get('/api/admin/users?q=test')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
    });

    it('supports pagination', async () => {
      const admin = await createAdminUser();

      const res = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/admin/users/:id/ban', () => {
    it('bans a user', async () => {
      const admin = await createAdminUser();
      const target = await registerTestUser();

      const res = await request(app)
        .post(`/api/admin/users/${target.id}/ban`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Test ban' });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/admin/users/:id/unban', () => {
    it('unbans a user', async () => {
      const admin = await createAdminUser();
      const target = await registerTestUser();

      // Ban first
      await request(app)
        .post(`/api/admin/users/${target.id}/ban`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Test ban' });

      // Unban
      const res = await request(app)
        .post(`/api/admin/users/${target.id}/unban`)
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/reports', () => {
    it('returns reports list', async () => {
      const admin = await createAdminUser();

      const res = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/bans', () => {
    it('returns bans list', async () => {
      const admin = await createAdminUser();

      const res = await request(app)
        .get('/api/admin/bans')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/announcements', () => {
    it('returns announcements list', async () => {
      const admin = await createAdminUser();

      const res = await request(app)
        .get('/api/admin/announcements')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/feature-flags', () => {
    it('returns feature flags list', async () => {
      const admin = await createAdminUser();

      const res = await request(app)
        .get('/api/admin/feature-flags')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/metrics', () => {
    it('returns metrics', async () => {
      const admin = await createAdminUser();

      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/audit-logs', () => {
    it('returns audit logs', async () => {
      const admin = await createAdminUser();

      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(res.status).toBe(200);
    });
  });
});

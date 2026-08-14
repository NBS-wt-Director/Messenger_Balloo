import request from 'supertest';
import { app, registerTestUser } from './helpers';

describe('Users API', () => {
  describe('GET /api/users/me', () => {
    it('returns current user with auth', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(user.email);
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/me', () => {
    it('updates user profile', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ displayName: 'Updated Name', bio: 'New bio' });

      expect(res.status).toBe(200);
    });

    it('rejects without auth', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .send({ displayName: 'Test' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/search', () => {
    it('returns search results', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .get(`/api/users/search?q=${user.username}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/users/:id/block', () => {
    it('blocks a user', async () => {
      const user1 = await registerTestUser();
      const user2 = await registerTestUser();

      const res = await request(app)
        .post(`/api/users/${user2.id}/block`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(res.status).toBe(200);
    });

    it('rejects without auth', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post(`/api/users/${user.id}/block`);

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/users/:id/block', () => {
    it('unblocks a user', async () => {
      const user1 = await registerTestUser();
      const user2 = await registerTestUser();

      // Block first
      await request(app)
        .post(`/api/users/${user2.id}/block`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      // Then unblock
      const res = await request(app)
        .delete(`/api/users/${user2.id}/block`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/users/me/blocked', () => {
    it('returns blocked users list', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .get('/api/users/me/blocked')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/users/me/blocked');

      expect(res.status).toBe(401);
    });
  });
});

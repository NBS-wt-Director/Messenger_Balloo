import request from 'supertest';
import { app, registerTestUser } from './helpers';

describe('Chats API', () => {
  describe('POST /api/chats', () => {
    it('creates a group chat', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'group', name: 'Test Group' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('group');
      expect(res.body.name).toBe('Test Group');
    });

    it('creates a channel', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'channel', name: 'Test Channel' });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('channel');
    });

    it('rejects without auth', async () => {
      const res = await request(app)
        .post('/api/chats')
        .send({ type: 'group', name: 'Test' });

      expect(res.status).toBe(401);
    });

    it('rejects without type', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(400);
    });

    it('rejects without name', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'group' });

      expect(res.status).toBe(400);
    });

    it('rejects invalid type', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'invalid', name: 'Test' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/chats', () => {
    it('returns user chats list', async () => {
      const user = await registerTestUser();

      // Create a chat first
      await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'group', name: 'My Chat' });

      const res = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.chats || res.body)).toBe(true);
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/chats');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/chats/:id', () => {
    it('returns chat info', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'group', name: 'Info Chat' });

      const res = await request(app)
        .get(`/api/chats/${createRes.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });

    it('returns 404 for non-existent chat', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .get('/api/chats/nonexistent-id')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/chats/:id/invite', () => {
    it('creates invite link', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'group', name: 'Invite Chat' });

      const res = await request(app)
        .post(`/api/chats/${createRes.body.id}/invite`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('code');
    });
  });

  describe('POST /api/chats/:id/members', () => {
    it('adds a member to chat', async () => {
      const user1 = await registerTestUser();
      const user2 = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ type: 'group', name: 'Members Chat' });

      const res = await request(app)
        .post(`/api/chats/${createRes.body.id}/members`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ memberId: user2.id });

      expect([200, 201]).toContain(res.status);
    });
  });

  describe('PUT /api/chats/:id', () => {
    it('updates chat name', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'group', name: 'Old Name' });

      const res = await request(app)
        .put(`/api/chats/${createRes.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/chats/:id', () => {
    it('deletes a chat', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'group', name: 'Delete Chat' });

      const res = await request(app)
        .delete(`/api/chats/${createRes.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });
  });
});

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

  // ============================================================
  // GET /api/chats/:id/attachments — тик. 1792335000
  // ============================================================
  describe('GET /api/chats/:id/attachments', () => {
    it('returns empty array when no attachments', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'group', name: 'Attachments Test Chat' });

      const res = await request(app)
        .get(`/api/chats/${createRes.body.id}/attachments`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .query({ type: 'images' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('rejects without auth', async () => {
      const res = await request(app)
        .get('/api/chats/someid/attachments')
        .query({ type: 'images' });

      expect(res.status).toBe(401);
    });

    it('rejects missing type parameter', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'group', name: 'Attachments Test Chat' });

      const res = await request(app)
        .get(`/api/chats/${createRes.body.id}/attachments`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-member', async () => {
      const member = await registerTestUser();
      const outsider = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ type: 'group', name: 'Private Chat' });

      const res = await request(app)
        .get(`/api/chats/${createRes.body.id}/attachments`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .query({ type: 'images' });

      expect(res.status).toBe(404);
    });

    it('returns attachments filtered by type', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'group', name: 'Attachments Filter Chat' });

      const chatId = createRes.body.id;

      // Send a message with file attachment
      const msgRes = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          type: 'file',
          content: 'Test file message',
          attachments: [
            {
              type: 'file',
              url: 'https://example.com/file.pdf',
              name: 'report.pdf',
              size: 12345,
            },
          ],
        });

      expect(msgRes.status).toBe(201);

      // Now fetch file attachments
      const attRes = await request(app)
        .get(`/api/chats/${chatId}/attachments`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .query({ type: 'files' });

      expect(attRes.status).toBe(200);
      expect(Array.isArray(attRes.body)).toBe(true);
      expect(attRes.body.length).toBeGreaterThan(0);
      expect(attRes.body[0]).toHaveProperty('id');
      expect(attRes.body[0]).toHaveProperty('type', 'file');
      expect(attRes.body[0]).toHaveProperty('url');
      expect(attRes.body[0]).toHaveProperty('name', 'report.pdf');
      expect(attRes.body[0]).toHaveProperty('senderName');
    });

    it('supports search by name', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'group', name: 'Search Chat' });

      const chatId = createRes.body.id;

      // Send message with file attachment
      await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          type: 'file',
          content: 'Test',
          attachments: [
            { type: 'file', url: 'https://example.com/a.pdf', name: 'report.pdf', size: 100 },
            { type: 'file', url: 'https://example.com/b.pdf', name: 'photo.jpg', size: 200 },
          ],
        });

      // Search for "report"
      const res = await request(app)
        .get(`/api/chats/${chatId}/attachments`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .query({ type: 'files', q: 'report' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].name).toContain('report');
    });

    it('returns empty for unknown attachment type', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'group', name: 'Unknown Type Chat' });

      const res = await request(app)
        .get(`/api/chats/${createRes.body.id}/attachments`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .query({ type: 'links' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });
  });

  // ============================================================
  // B3: Роли участников и админов чата (тик. 1792335000)
  // ============================================================

  describe('PUT /api/chats/:id/members/:userId/role', () => {
    it('владелец меняет роль участника', async () => {
      const owner = await registerTestUser();
      const member = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ type: 'group', name: 'Role Test Chat' });

      const chatId = createRes.body.id;

      // Добавляем участника
      await request(app)
        .post(`/api/chats/${chatId}/members`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ memberId: member.id });

      // Меняем роль
      const res = await request(app)
        .put(`/api/chats/${chatId}/members/${member.id}/role`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ role: 'moderator' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('отклоняет невалидную роль', async () => {
      const owner = await registerTestUser();
      const member = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ type: 'group', name: 'Invalid Role Chat' });

      const chatId = createRes.body.id;

      await request(app)
        .post(`/api/chats/${chatId}/members`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ memberId: member.id });

      const res = await request(app)
        .put(`/api/chats/${chatId}/members/${member.id}/role`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ role: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('участник не может менять роли', async () => {
      const owner = await registerTestUser();
      const member = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ type: 'group', name: 'Member No Role Chat' });

      const chatId = createRes.body.id;

      await request(app)
        .post(`/api/chats/${chatId}/members`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ memberId: member.id });

      const res = await request(app)
        .put(`/api/chats/${chatId}/members/${member.id}/role`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/chats/:id/admins/:adminId', () => {
    it('владелец удаляет админа', async () => {
      const owner = await registerTestUser();
      const admin = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ type: 'group', name: 'Admin Remove Chat' });

      const chatId = createRes.body.id;

      // Добавляем как участника, потом меняем роль на admin
      await request(app)
        .post(`/api/chats/${chatId}/members`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ memberId: admin.id });

      await request(app)
        .put(`/api/chats/${chatId}/members/${admin.id}/role`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ role: 'admin' });

      const res = await request(app)
        .delete(`/api/chats/${chatId}/admins/${admin.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('возвращает 404 для несуществующего админа', async () => {
      const owner = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ type: 'group', name: 'No Admin Chat' });

      const chatId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/chats/${chatId}/admins/nonexistent`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/chats/:id/admins/:adminId/role', () => {
    it('владелец меняет роль админа', async () => {
      const owner = await registerTestUser();
      const admin = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ type: 'group', name: 'Admin Role Chat' });

      const chatId = createRes.body.id;

      await request(app)
        .post(`/api/chats/${chatId}/members`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ memberId: admin.id });

      await request(app)
        .put(`/api/chats/${chatId}/members/${admin.id}/role`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ role: 'admin' });

      const res = await request(app)
        .put(`/api/chats/${chatId}/admins/${admin.id}/role`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ role: 'moderator' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('отклоняет невалидную роль для админа', async () => {
      const owner = await registerTestUser();
      const admin = await registerTestUser();

      const createRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ type: 'group', name: 'Invalid Admin Role Chat' });

      const chatId = createRes.body.id;

      await request(app)
        .post(`/api/chats/${chatId}/members`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ memberId: admin.id });

      await request(app)
        .put(`/api/chats/${chatId}/members/${admin.id}/role`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ role: 'admin' });

      const res = await request(app)
        .put(`/api/chats/${chatId}/admins/${admin.id}/role`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ role: 'member' });

      expect(res.status).toBe(400);
    });
  });
});

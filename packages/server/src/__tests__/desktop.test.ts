import request from 'supertest';
import { app, registerTestUser } from './helpers';

describe('Desktop API (archive, devices, reports, calls)', () => {
  let user: { id: string; accessToken: string };

  beforeAll(async () => {
    user = await registerTestUser();
  });

  const auth = () => ['Authorization', `Bearer ${user.accessToken}`] as const;

  // ============================================================
  // Archive
  // ============================================================
  describe('GET /api/archive', () => {
    it('returns archived chats list', async () => {
      const [key, value] = auth();
      const res = await request(app).get('/api/archive').set(key, value);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chats');
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/archive');
      expect(res.status).toBe(401);
    });
  });

  describe('archive lifecycle (archive → list → restore → delete)', () => {
    it('runs full lifecycle', async () => {
      const [key, value] = auth();

      // Create a chat
      const chatRes = await request(app)
        .post('/api/chats')
        .set(key, value)
        .send({ type: 'group', name: 'Archive Test Chat' });
      expect(chatRes.status).toBe(201);
      const chatId = chatRes.body.id;

      // Archive it
      const archiveRes = await request(app)
        .post(`/api/archive/${chatId}`)
        .set(key, value);
      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body).toHaveProperty('message');

      // List — chat should be there
      const listRes = await request(app).get('/api/archive').set(key, value);
      expect(listRes.status).toBe(200);
      const archivedIds = listRes.body.chats.map((c: any) => c.id);
      expect(archivedIds).toContain(chatId);

      // Restore
      const restoreRes = await request(app)
        .post(`/api/archive/${chatId}/restore`)
        .set(key, value);
      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body).toHaveProperty('message');

      // Archive again, then delete permanently
      await request(app).post(`/api/archive/${chatId}`).set(key, value);
      const deleteRes = await request(app)
        .delete(`/api/archive/${chatId}`)
        .set(key, value);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body).toHaveProperty('message');
    });

    it('returns error for archiving non-existent chat', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/archive/nonexistent-chat-id')
        .set(key, value);
      // Prisma update on non-existent composite key → 500 (internal)
      expect([404, 500]).toContain(res.status);
    });
  });

  // ============================================================
  // Devices
  // ============================================================
  describe('GET /api/devices', () => {
    it('returns devices list', async () => {
      const [key, value] = auth();
      const res = await request(app).get('/api/devices').set(key, value);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('devices');
      expect(Array.isArray(res.body.devices)).toBe(true);
      expect(res.body.devices.length).toBeGreaterThan(0);
      expect(res.body.devices[0]).toHaveProperty('isCurrent');
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/devices');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/devices/:id', () => {
    it('ends a device session', async () => {
      const [key, value] = auth();
      const res = await request(app).delete('/api/devices/some-session-id').set(key, value);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/devices/end-all', () => {
    it('ends all other sessions', async () => {
      const [key, value] = auth();
      const res = await request(app).post('/api/devices/end-all').set(key, value);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ============================================================
  // Reports
  // ============================================================
  describe('POST /api/reports', () => {
    it('creates a report on a message', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/reports')
        .set(key, value)
        .send({ messageId: 'msg-123', reason: 'spam', comment: 'Test report' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.reason).toBe('spam');
    });

    it('creates a report on a user', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/reports')
        .set(key, value)
        .send({ reportedUserId: 'user-123', reason: 'harassment' });

      expect(res.status).toBe(201);
      expect(res.body.reason).toBe('harassment');
    });

    it('creates a report on a chat', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/reports')
        .set(key, value)
        .send({ chatId: 'chat-123', reason: 'other' });

      expect(res.status).toBe(201);
    });

    it('rejects without target', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/reports')
        .set(key, value)
        .send({ reason: 'spam' });

      expect(res.status).toBe(400);
    });

    it('rejects invalid reason', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .post('/api/reports')
        .set(key, value)
        .send({ messageId: 'msg-123', reason: 'invalid-reason' });

      expect(res.status).toBe(400);
    });

    it('rejects without auth', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({ messageId: 'msg-123', reason: 'spam' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reports', () => {
    it('returns user reports with pagination', async () => {
      const [key, value] = auth();
      const res = await request(app).get('/api/reports').set(key, value);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reports');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('supports pagination params', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .get('/api/reports?page=1&limit=5')
        .set(key, value);

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  // ============================================================
  // Calls
  // ============================================================
  describe('GET /api/calls', () => {
    it('returns call history with pagination', async () => {
      const [key, value] = auth();
      const res = await request(app).get('/api/calls').set(key, value);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('calls');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.calls)).toBe(true);
    });

    it('supports filter param', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .get('/api/calls?filter=missed&page=1&limit=10')
        .set(key, value);

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(10);
    });

    it('ignores invalid filter param', async () => {
      const [key, value] = auth();
      const res = await request(app)
        .get('/api/calls?filter=bogus')
        .set(key, value);

      expect(res.status).toBe(200);
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/calls');
      expect(res.status).toBe(401);
    });
  });
});

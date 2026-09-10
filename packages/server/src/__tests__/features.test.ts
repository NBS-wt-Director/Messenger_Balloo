import request from 'supertest';
import { app, registerTestUser } from './helpers';

describe('Features API (фич-реквесты)', () => {
  let user: { id: string; accessToken: string };

  beforeAll(async () => {
    user = await registerTestUser();
  });

  describe('GET /api/features', () => {
    it('returns paginated features list (public)', async () => {
      const res = await request(app).get('/api/features');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(res.body).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('supports filters and pagination params', async () => {
      const res = await request(app).get('/api/features').query({
        status: 'idea',
        category: 'messenger',
        search: 'test',
        sortBy: 'date',
        page: 1,
        limit: 5,
      });

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(5);
      expect(res.body.page).toBe(1);
    });

    it('supports sortBy=comments', async () => {
      const res = await request(app).get('/api/features').query({ sortBy: 'comments' });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/features/categories', () => {
    it('returns categories list (public)', async () => {
      const res = await request(app).get('/api/features/categories');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('slug');
    });
  });

  describe('GET /api/features/stats', () => {
    it('returns statistics (public)', async () => {
      const res = await request(app).get('/api/features/stats');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('byStatus');
      expect(res.body).toHaveProperty('totalVotes');
    });
  });

  describe('POST /api/features', () => {
    it('creates a feature request', async () => {
      const res = await request(app)
        .post('/api/features')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          title: 'Test Feature',
          description: 'Test description',
          category: 'messenger',
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Feature');
      expect(res.body.status).toBe('idea');
      expect(res.body.author).toBeDefined();
    });

    it('rejects without auth', async () => {
      const res = await request(app)
        .post('/api/features')
        .send({ title: 'X', description: 'Y', category: 'messenger' });

      expect(res.status).toBe(401);
    });

    it('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/features')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Only title' });

      expect(res.status).toBe(400);
    });

    it('rejects title longer than 80 chars', async () => {
      const res = await request(app)
        .post('/api/features')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          title: 'x'.repeat(81),
          description: 'desc',
          category: 'messenger',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('feature lifecycle (create → vote → update → delete)', () => {
    it('runs full lifecycle', async () => {
      // Create
      const createRes = await request(app)
        .post('/api/features')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          title: 'Lifecycle Feature',
          description: 'Lifecycle description',
          category: 'uiux',
        });
      expect(createRes.status).toBe(201);
      const featureId = createRes.body.id;

      // Get by id
      const getRes = await request(app).get(`/api/features/${featureId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.voteCount).toBe(0);
      expect(getRes.body.commentCount).toBe(0);

      // Vote
      const voteRes = await request(app)
        .post(`/api/features/${featureId}/vote`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(voteRes.status).toBe(200);

      // Duplicate vote → 409
      const dupRes = await request(app)
        .post(`/api/features/${featureId}/vote`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(dupRes.status).toBe(409);

      // Get by id — vote counted
      const getRes2 = await request(app).get(`/api/features/${featureId}`);
      expect(getRes2.status).toBe(200);
      expect(getRes2.body.voteCount).toBe(1);

      // Unvote
      const unvoteRes = await request(app)
        .delete(`/api/features/${featureId}/vote`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(unvoteRes.status).toBe(200);
      expect(unvoteRes.body.success).toBe(true);

      // Update
      const updateRes = await request(app)
        .put(`/api/features/${featureId}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Updated Feature', status: 'planned' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.title).toBe('Updated Feature');
      expect(updateRes.body.status).toBe('planned');

      // Delete
      const deleteRes = await request(app)
        .delete(`/api/features/${featureId}`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Get deleted → 404
      const getDeleted = await request(app).get(`/api/features/${featureId}`);
      expect(getDeleted.status).toBe(404);
    });

    it('returns 404 for non-existent feature', async () => {
      const res = await request(app).get('/api/features/nonexistent-id');
      expect(res.status).toBe(404);
    });

    it('returns 404 on update of non-existent feature', async () => {
      const res = await request(app)
        .put('/api/features/nonexistent-id')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Nope' });
      expect(res.status).toBe(404);
    });

    it('returns 404 on delete of non-existent feature', async () => {
      const res = await request(app)
        .delete('/api/features/nonexistent-id')
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(res.status).toBe(404);
    });

    it('rejects vote without auth', async () => {
      const res = await request(app).post('/api/features/some-id/vote');
      expect(res.status).toBe(401);
    });
  });
});

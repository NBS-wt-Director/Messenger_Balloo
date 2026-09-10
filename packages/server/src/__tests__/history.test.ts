import request from 'supertest';
import { app } from './helpers';

describe('History API (история версий)', () => {
  describe('GET /api/history/versions', () => {
    it('returns paginated versions list (public)', async () => {
      const res = await request(app).get('/api/history/versions');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(res.body).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('each item has enriched changelog fields', async () => {
      const res = await request(app).get('/api/history/versions?limit=1');

      expect(res.status).toBe(200);
      if (res.body.items.length > 0) {
        const item = res.body.items[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('version');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('summary');
      }
    });

    it('supports status=released filter', async () => {
      const res = await request(app).get('/api/history/versions?status=released');
      expect(res.status).toBe(200);
    });

    it('supports status=planned filter', async () => {
      const res = await request(app).get('/api/history/versions?status=planned');
      expect(res.status).toBe(200);
    });

    it('supports pagination params', async () => {
      const res = await request(app).get('/api/history/versions?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(5);
      expect(res.body.page).toBe(1);
    });
  });

  describe('GET /api/history/versions/:id', () => {
    it('returns 404 for non-existent version', async () => {
      const res = await request(app).get('/api/history/versions/nonexistent-id-123');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('returns version with parsed changelog if any version exists', async () => {
      const listRes = await request(app).get('/api/history/versions?limit=1');
      if (listRes.body.items.length === 0) return;

      const id = listRes.body.items[0].id;
      const res = await request(app).get(`/api/history/versions/${id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('changelog');
      expect(res.body.changelog).toHaveProperty('sections');
    });
  });

  describe('GET /api/history/versions/:id/neighbors', () => {
    it('returns 404 for non-existent version', async () => {
      const res = await request(app).get('/api/history/versions/nonexistent-id-123/neighbors');
      expect(res.status).toBe(404);
    });

    it('returns prev/next structure if any version exists', async () => {
      const listRes = await request(app).get('/api/history/versions?limit=1');
      if (listRes.body.items.length === 0) return;

      const id = listRes.body.items[0].id;
      const res = await request(app).get(`/api/history/versions/${id}/neighbors`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('prev');
      expect(res.body).toHaveProperty('next');
    });
  });

  describe('GET /api/history/compare', () => {
    it('returns 400 without v1/v2 params', async () => {
      const res = await request(app).get('/api/history/compare');
      expect(res.status).toBe(400);
    });

    it('returns 400 with only v1', async () => {
      const res = await request(app).get('/api/history/compare?v1=1.0.0');
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent versions', async () => {
      const res = await request(app).get('/api/history/compare?v1=nope-1&v2=nope-2');
      expect(res.status).toBe(404);
    });

    it('returns diff structure for two existing versions', async () => {
      const listRes = await request(app).get('/api/history/versions?limit=2');
      if (listRes.body.items.length < 2) return;

      const v1 = listRes.body.items[0].version;
      const v2 = listRes.body.items[1].version;
      const res = await request(app).get(`/api/history/compare?v1=${v1}&v2=${v2}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('v1');
      expect(res.body).toHaveProperty('v2');
      expect(res.body).toHaveProperty('diff');
      expect(res.body.v1).toHaveProperty('version');
      expect(res.body.v2).toHaveProperty('version');
    });
  });
});

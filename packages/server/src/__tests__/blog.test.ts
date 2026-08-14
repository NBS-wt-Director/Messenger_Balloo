import request from 'supertest';
import { app, registerTestUser } from './helpers';

describe('Blog API', () => {
  describe('POST /api/blog/posts', () => {
    it('creates a blog post', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/blog/posts')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Test Post', content: 'This is test content' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Post');
    });

    it('rejects without auth', async () => {
      const res = await request(app)
        .post('/api/blog/posts')
        .send({ title: 'Test', content: 'Content' });

      expect(res.status).toBe(401);
    });

    it('rejects without title', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/blog/posts')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ content: 'Content' });

      expect(res.status).toBe(400);
    });

    it('rejects without content', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/blog/posts')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Title' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/blog/posts', () => {
    it('returns list of posts', async () => {
      const res = await request(app).get('/api/blog/posts');

      expect(res.status).toBe(200);
    });

    it('supports pagination', async () => {
      const res = await request(app).get('/api/blog/posts?page=1&limit=10');

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/blog/posts/:id', () => {
    it('returns a single post', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/blog/posts')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Get Post', content: 'Content' });

      const res = await request(app).get(`/api/blog/posts/${createRes.body.id}`);

      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/blog/posts/:id', () => {
    it('updates a post', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/blog/posts')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Old Title', content: 'Content' });

      const res = await request(app)
        .put(`/api/blog/posts/${createRes.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'New Title' });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/blog/posts/:id', () => {
    it('deletes a post', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/blog/posts')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Delete Me', content: 'Content' });

      const res = await request(app)
        .delete(`/api/blog/posts/${createRes.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/blog/posts/:id/publish', () => {
    it('publishes a post', async () => {
      const user = await registerTestUser();

      const createRes = await request(app)
        .post('/api/blog/posts')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Publish Me', content: 'Content' });

      const res = await request(app)
        .post(`/api/blog/posts/${createRes.body.id}/publish`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Blog Channels', () => {
    it('creates a channel', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/blog/channels')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'Test Channel', description: 'A test channel' });

      expect(res.status).toBe(201);
    });

    it('returns channels list', async () => {
      const res = await request(app).get('/api/blog/channels');

      expect(res.status).toBe(200);
    });
  });
});

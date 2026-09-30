import request from 'supertest';
import { app, registerTestUser } from './helpers';

const futureTimestamp = () => Math.floor(Date.now() / 1000) + 86400;

async function createStory(accessToken: string) {
  const res = await request(app)
    .post('/api/stories')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      type: 'image',
      mediaUrl: 'https://cdn.balloo.su/test-story.jpg',
      thumbnail: 'https://cdn.balloo.su/test-story-thumb.jpg',
      expiresAt: futureTimestamp(),
    });
  return res;
}

describe('Stories API', () => {
  describe('POST /api/stories', () => {
    it('creates a story', async () => {
      const user = await registerTestUser();

      const res = await createStory(user.accessToken);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('image');
    });

    it('rejects without auth', async () => {
      const res = await request(app)
        .post('/api/stories')
        .send({
          type: 'image',
          mediaUrl: 'https://cdn.balloo.su/test.jpg',
          expiresAt: futureTimestamp(),
        });

      expect(res.status).toBe(401);
    });

    it('rejects without required fields', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'image' });

      expect(res.status).toBe(400);
    });

    it('rejects invalid type', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          type: 'audio',
          mediaUrl: 'https://cdn.balloo.su/test.mp3',
          expiresAt: futureTimestamp(),
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/stories', () => {
    it('returns stories list', async () => {
      const user = await registerTestUser();
      await createStory(user.accessToken);

      const res = await request(app)
        .get('/api/stories')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/stories');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/stories/:id/views', () => {
    it('returns story views', async () => {
      const user = await registerTestUser();
      const storyRes = await createStory(user.accessToken);

      const res = await request(app)
        .get(`/api/stories/${storyRes.body.id}/views`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/stories/:id/reactions', () => {
    it('adds a reaction to a story', async () => {
      const user = await registerTestUser();
      const storyRes = await createStory(user.accessToken);

      const res = await request(app)
        .post(`/api/stories/${storyRes.body.id}/reactions`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ emoji: '🔥' });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/stories/:id', () => {
    it('deletes a story', async () => {
      const user = await registerTestUser();
      const storyRes = await createStory(user.accessToken);

      const res = await request(app)
        .delete(`/api/stories/${storyRes.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  // В-116 (тикет 1790707718): StoriesScreen.handleView зовёт POST /api/stories/:id/view.
  // Маршрута не было — счётчик просмотров не рос. Модель StoryView и уникальность
  // storyId+viewerId в схеме уже существовали.
  describe('POST /api/stories/:id/view (В-116)', () => {
    it('records a story view', async () => {
      const user = await registerTestUser();
      const storyRes = await createStory(user.accessToken);

      const res = await request(app)
        .post(`/api/stories/${storyRes.body.id}/view`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.storyId).toBe(storyRes.body.id);
      expect(res.body.totalViews).toBe(1);
    });

    it('does not duplicate a repeat view (upsert)', async () => {
      const user = await registerTestUser();
      const storyRes = await createStory(user.accessToken);

      await request(app)
        .post(`/api/stories/${storyRes.body.id}/view`)
        .set('Authorization', `Bearer ${user.accessToken}`);
      const res = await request(app)
        .post(`/api/stories/${storyRes.body.id}/view`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalViews).toBe(1);
    });

    it('rejects without auth', async () => {
      const user = await registerTestUser();
      const storyRes = await createStory(user.accessToken);

      const res = await request(app)
        .post(`/api/stories/${storyRes.body.id}/view`);

      expect(res.status).toBe(401);
    });

    it('returns 404 for missing story', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/stories/nonexistent-id/view')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 410 for expired story', async () => {
      const user = await registerTestUser();
      const storyRes = await createStory(user.accessToken);

      // Создать историю с expiresAt в прошлом нельзя (валидация сервиса),
      // поэтому протухаем уже созданную напрямую в БД.
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      try {
        await prisma.story.update({
          where: { id: storyRes.body.id },
          data: { expiresAt: BigInt(Math.floor(Date.now() / 1000) - 3600) },
        });
      } finally {
        await prisma.$disconnect();
      }

      const viewRes = await request(app)
        .post(`/api/stories/${storyRes.body.id}/view`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(viewRes.status).toBe(410);
    });
  });
});

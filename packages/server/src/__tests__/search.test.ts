import { app, registerTestUser } from './helpers';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TS = Date.now();

let userA: { id: string; accessToken: string };
let userB: { id: string; accessToken: string };

beforeAll(async () => {
  userA = await registerTestUser({ username: `alice_${TS}` });
  userB = await registerTestUser({ username: `bob_${TS}` });

  const chat = await prisma.chat.create({
    data: {
      id: `chat_search_${TS}`,
      name: 'Search Test Chat',
      createdAt: Date.now(),
    },
  });

  await prisma.userChat.create({
    data: { userId: userA.id, chatId: chat.id, joinedAt: Date.now() },
  });

  await prisma.message.create({
    data: {
      id: `msg_search_${TS}`,
      chatId: chat.id,
      senderId: userA.id,
      content: 'Hello world search test',
      createdAt: Date.now(),
    },
  });
});

afterAll(async () => {
  await prisma.message.deleteMany({ where: { id: `msg_search_${TS}` } });
  await prisma.userChat.deleteMany({ where: { chatId: `chat_search_${TS}` } });
  await prisma.chat.deleteMany({ where: { id: `chat_search_${TS}` } });
});

describe('B6-1: GET /api/search', () => {
  it('returns 400 for q < 2', async () => {
    const res = await request(app)
      .get('/api/search?q=a')
      .set('Authorization', `Bearer ${userA.accessToken}`);
    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/search?q=test');
    expect(res.status).toBe(401);
  });

  it('finds users by username', async () => {
    const res = await request(app)
      .get(`/api/search?q=alice_${TS}`)
      .set('Authorization', `Bearer ${userA.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.results.some((r: any) => r.type === 'user' && r.username === `alice_${TS}`)).toBe(true);
  });

  it('finds chats (only participant)', async () => {
    const res = await request(app)
      .get('/api/search?q=Search')
      .set('Authorization', `Bearer ${userA.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.results.some((r: any) => r.type === 'chat' && r.name === 'Search Test Chat')).toBe(true);
  });

  it('finds messages (only participant chats)', async () => {
    const res = await request(app)
      .get('/api/search?q=Hello')
      .set('Authorization', `Bearer ${userA.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.results.some((r: any) => r.type === 'message' && r.content === 'Hello world search test')).toBe(true);
  });

  it('does not find chats of other users', async () => {
    const res = await request(app)
      .get('/api/search?q=Search')
      .set('Authorization', `Bearer ${userB.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.results.filter((r: any) => r.type === 'chat').length).toBe(0);
  });

  it('returns unified array with type field', async () => {
    const res = await request(app)
      .get('/api/search?q=search')
      .set('Authorization', `Bearer ${userA.accessToken}`);

    expect(res.status).toBe(200);
    for (const r of res.body.results) {
      expect(['user', 'chat', 'message']).toContain(r.type);
    }
  });

  it('supports pagination (limit + offset)', async () => {
    // Создаём несколько пользователей для пагинации
    const names: string[] = [];
    for (let i = 0; i < 10; i++) {
      const name = `pag_${TS}_${i}`;
      names.push(name);
      await prisma.user.create({
        data: {
          id: `user_pag_${TS}_${i}`,
          username: name,
          email: `pag_${TS}_${i}@test.balloo.ru`,
          passwordHash: 'x',
          createdAt: Date.now(),
        },
      });
    }

    const res1 = await request(app)
      .get(`/api/search?q=pag_${TS}&limit=3&offset=0`)
      .set('Authorization', `Bearer ${userA.accessToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.results.length).toBeLessThanOrEqual(3);

    const res2 = await request(app)
      .get(`/api/search?q=pag_${TS}&limit=3&offset=3`)
      .set('Authorization', `Bearer ${userA.accessToken}`);

    expect(res2.status).toBe(200);
    const ids1 = res1.body.results.map((r: any) => r.id);
    const ids2 = res2.body.results.map((r: any) => r.id);
    const overlap = ids1.filter((id: string) => ids2.includes(id));
    expect(overlap.length).toBe(0);
  });
});

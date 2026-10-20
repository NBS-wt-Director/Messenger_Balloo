import { app, registerTestUser } from './helpers';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let userA: { id: string; accessToken: string };
let userB: { id: string; accessToken: string };
let chat: { id: string };

beforeAll(async () => {
  userA = await registerTestUser();
  userB = await registerTestUser();

  chat = await prisma.chat.create({
    data: {
      id: 'chat_export_test',
      name: 'Export Test Chat',
      createdAt: Date.now(),
    },
  });

  // userA — участник
  await prisma.userChat.create({
    data: { userId: userA.id, chatId: chat.id, joinedAt: Date.now() },
  });

  // Сообщение
  await prisma.message.create({
    data: {
      id: 'msg_export_test',
      chatId: chat.id,
      senderId: userA.id,
      content: 'Hello export test',
      createdAt: Date.now(),
    },
  });
});

afterAll(async () => {
  await prisma.message.deleteMany({ where: { id: 'msg_export_test' } });
  await prisma.userChat.deleteMany({ where: { chatId: 'chat_export_test' } });
  await prisma.chat.deleteMany({ where: { id: 'chat_export_test' } });
});

describe('B6-2: GET /api/chats/:id/export', () => {
  it('returns HTML content-type', async () => {
    const res = await request(app)
      .get(`/api/chats/${chat.id}/export`)
      .set('Authorization', `Bearer ${userA.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('has Content-Disposition header', async () => {
    const res = await request(app)
      .get(`/api/chats/${chat.id}/export`)
      .set('Authorization', `Bearer ${userA.accessToken}`);

    expect(res.headers['content-disposition']).toContain('chat-chat_export_test');
  });

  it('returns HTML with chat name and messages', async () => {
    const res = await request(app)
      .get(`/api/chats/${chat.id}/export`)
      .set('Authorization', `Bearer ${userA.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Export Test Chat');
    expect(res.text).toContain('Hello export test');
    expect(res.text).toContain('<!DOCTYPE html>');
  });

  it('returns 403 for non-participant', async () => {
    const res = await request(app)
      .get(`/api/chats/${chat.id}/export`)
      .set('Authorization', `Bearer ${userB.accessToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .get(`/api/chats/${chat.id}/export`);

    expect(res.status).toBe(401);
  });

  it('returns 404 for non-existent chat', async () => {
    const res = await request(app)
      .get('/api/chats/nonexistent/export')
      .set('Authorization', `Bearer ${userA.accessToken}`);

    expect(res.status).toBe(404);
  });
});

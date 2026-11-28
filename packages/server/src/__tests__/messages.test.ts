import request from 'supertest';
import { app, registerTestUser } from './helpers';

async function createChatAndGetId(accessToken: string): Promise<string> {
  const res = await request(app)
    .post('/api/chats')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ type: 'group', name: 'Messages Test Chat' });
  return res.body.id;
}

describe('Messages API', () => {
  describe('POST /api/chats/:chatId/messages', () => {
    it('sends a text message', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'text', content: 'Hello World' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('Hello World');
      expect(res.body.type).toBe('text');
    });

    it('rejects without auth', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .send({ type: 'text', content: 'Hello' });

      expect(res.status).toBe(401);
    });

    it('rejects without type', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ content: 'Hello' });

      expect(res.status).toBe(400);
    });

    it('rejects invalid type', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'invalid', content: 'Hello' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/chats/:chatId/messages', () => {
    it('returns message history', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      // Send a message
      await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'text', content: 'Test message' });

      const res = await request(app)
        .get(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('messages');
      expect(res.body.messages.length).toBeGreaterThan(0);
    });

    it('supports pagination with cursor', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      // Send multiple messages
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/api/chats/${chatId}/messages`)
          .set('Authorization', `Bearer ${user.accessToken}`)
          .send({ type: 'text', content: `Message ${i}` });
      }

      const res = await request(app)
        .get(`/api/chats/${chatId}/messages?limit=2`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.messages.length).toBeLessThanOrEqual(2);
    });

    // Тик. 1795094089 (A2): до правки getMessages возвращал reactions: [] всегда.
    it('history includes reactions added to a message', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const sendRes = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'text', content: 'Reactions in history' });

      await request(app)
        .post(`/api/messages/${sendRes.body.id}/reactions`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ emoji: '🔥' });

      const res = await request(app)
        .get(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      const msg = res.body.messages.find((m: any) => m.id === sendRes.body.id);
      expect(msg).toBeDefined();
      expect(Array.isArray(msg.reactions)).toBe(true);
      expect(msg.reactions.length).toBe(1);
      expect(msg.reactions[0].emoji).toBe('🔥');
      expect(msg.reactions[0]).toHaveProperty('user');
    });
  });

  describe('PUT /api/messages/:id', () => {
    it('edits a message', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const sendRes = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'text', content: 'Original' });

      const res = await request(app)
        .put(`/api/messages/${sendRes.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ content: 'Edited' });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/messages/:id', () => {
    it('deletes a message', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const sendRes = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'text', content: 'To delete' });

      const res = await request(app)
        .delete(`/api/messages/${sendRes.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/messages/:id/reactions', () => {
    it('adds a reaction', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const sendRes = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'text', content: 'React to me' });

      const res = await request(app)
        .post(`/api/messages/${sendRes.body.id}/reactions`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ emoji: '👍' });

      expect([200, 201]).toContain(res.status);
    });
  });

  describe('GET /api/messages/:id/reactions', () => {
    it('returns reactions for a message', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const sendRes = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'text', content: 'React' });

      await request(app)
        .post(`/api/messages/${sendRes.body.id}/reactions`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ emoji: '❤' });

      const res = await request(app)
        .get(`/api/messages/${sendRes.body.id}/reactions`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/messages/:id/pin', () => {
    it('pins a message', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const sendRes = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'text', content: 'Pin me' });

      const res = await request(app)
        .post(`/api/messages/${sendRes.body.id}/pin`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  // Регрессия: routes/messages.ts объявляет пути уже с сегментом /messages
  // (/messages/:id/reactions) и с полным /api/chats/:chatId/messages, поэтому
  // routes/index.ts обязан монтировать его на '/api'. Монтирование на
  // '/api/messages' удваивало сегмент: сервер слушал /api/messages/messages/*,
  // а веб-клиент вызывал /api/messages/* — история чата молча уходила в 404.
  describe('route table matches the paths the web client calls', () => {
    it('serves the client paths without a doubled /api/messages prefix', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const sendRes = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ type: 'text', content: 'guard' });

      const clientPaths: [string, string][] = [
        ['get', `/api/chats/${chatId}/messages?limit=20`],
        ['get', `/api/messages/${sendRes.body.id}/reactions`],
        ['post', `/api/messages/${sendRes.body.id}/read`],
        ['post', `/api/messages/${sendRes.body.id}/pin`],
      ];

      for (const [method, path] of clientPaths) {
        const res = await (request(app) as any)[method](path).set(
          'Authorization',
          `Bearer ${user.accessToken}`,
        );
        // Маршрут смонтирован: ответ не 404 (валидация/конфликт допустимы).
        expect([404, 405]).not.toContain(res.status);
      }
    });

    it('does not expose the doubled /api/messages/messages prefix', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .get('/api/messages/messages/00000000-0000-4000-8000-000000000000/reactions')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  // Тик. 1795677071: не-файловые вложения (опрос/квиз/списки/персонали) —
  // url пустой, данные формы в attachment.data.
  describe('не-файловые вложения', () => {
    it('принимает poll-вложение с data и отдаёт его в ответе', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          type: 'poll',
          content: '',
          attachments: [
            {
              type: 'poll',
              url: '',
              data: { question: 'Где встречаемся?', options: ['Парк', 'Кафе'], multiple: false },
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('poll');
      expect(res.body.attachments).toHaveLength(1);
      expect(res.body.attachments[0]).toMatchObject({
        type: 'poll',
        url: '',
        data: { question: 'Где встречаемся?', options: ['Парк', 'Кафе'], multiple: false },
      });
    });

    it('сохраняет data в истории сообщений', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          type: 'quiz',
          content: '',
          attachments: [
            {
              type: 'quiz',
              url: '',
              data: { question: '2+2?', options: ['3', '4'], multiple: false, correctIndex: 1 },
            },
          ],
        });

      const res = await request(app)
        .get(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      const msg = res.body.messages.find((m: any) => m.type === 'quiz');
      expect(msg).toBeDefined();
      expect(msg.attachments[0].data).toMatchObject({
        question: '2+2?',
        options: ['3', '4'],
        correctIndex: 1,
      });
    });

    it('файл + опрос в одном сообщении: оба вложения сохраняются', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          type: 'poll',
          content: '',
          attachments: [
            { type: 'image', url: 'https://cdn.example.com/pic.png', name: 'pic.png', size: 100 },
            { type: 'poll', url: '', data: { question: 'Q?', options: ['A', 'B'], multiple: true } },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.attachments).toHaveLength(2);
      expect(res.body.attachments[0]).toMatchObject({ type: 'image', url: 'https://cdn.example.com/pic.png' });
      expect(res.body.attachments[1]).toMatchObject({ type: 'poll', url: '' });
      expect(res.body.attachments[1].data.question).toBe('Q?');
    });

    it('принимает все не-файловые типы сообщений', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      for (const type of ['poll', 'quiz', 'list_active', 'list_passive', 'personali']) {
        const res = await request(app)
          .post(`/api/chats/${chatId}/messages`)
          .set('Authorization', `Bearer ${user.accessToken}`)
          .send({
            type,
            content: '',
            attachments: [{ type, url: '', data: { title: 'T', items: ['A'] } }],
          });

        expect(res.status).toBe(201);
        expect(res.body.type).toBe(type);
      }
    });
  });
});

import request from 'supertest';
import { app, registerTestUser } from './helpers';

async function createChatAndGetId(accessToken: string): Promise<string> {
  const res = await request(app)
    .post('/api/chats')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ type: 'group', name: 'Polls Test Chat' });
  return res.body.id;
}

async function createPoll(accessToken: string, chatId: string) {
  return request(app)
    .post(`/api/polls/chats/${chatId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      question: 'What is your favorite color?',
      options: ['Red', 'Blue', 'Green'],
    });
}

describe('Polls API', () => {
  describe('POST /api/polls/chats/:chatId', () => {
    it('creates a poll in a chat', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const res = await createPoll(user.accessToken, chatId);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.question).toBe('What is your favorite color?');
    });

    it('rejects without auth', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const res = await request(app)
        .post(`/api/polls/chats/${chatId}`)
        .send({ question: 'Q?', options: ['A', 'B'] });

      expect(res.status).toBe(401);
    });

    it('rejects without question', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const res = await request(app)
        .post(`/api/polls/chats/${chatId}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ options: ['A', 'B'] });

      expect(res.status).toBe(400);
    });

    it('rejects without options', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const res = await request(app)
        .post(`/api/polls/chats/${chatId}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ question: 'Q?' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/polls/:id/vote', () => {
    it('votes in a poll', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);
      const pollRes = await createPoll(user.accessToken, chatId);

      const res = await request(app)
        .post(`/api/polls/${pollRes.body.id}/vote`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ optionIndex: 0 });

      expect(res.status).toBe(200);
    });

    it('rejects without optionIndex', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);
      const pollRes = await createPoll(user.accessToken, chatId);

      const res = await request(app)
        .post(`/api/polls/${pollRes.body.id}/vote`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/polls/:id/results', () => {
    it('returns poll results', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);
      const pollRes = await createPoll(user.accessToken, chatId);

      // Vote
      await request(app)
        .post(`/api/polls/${pollRes.body.id}/vote`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ optionIndex: 1 });

      const res = await request(app)
        .get(`/api/polls/${pollRes.body.id}/results`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/polls/:id', () => {
    it('deletes a poll', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);
      const pollRes = await createPoll(user.accessToken, chatId);

      const res = await request(app)
        .delete(`/api/polls/${pollRes.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  // В-115 (тикет 1790707718): PollScreen зовёт POST /api/polls и GET /api/polls/:id.
  // Раньше этих маршрутов не было — создание опроса молча падало в catch,
  // а открытие готового опроса показывало форму создания.
  describe('route table matches the paths the web client calls (В-115)', () => {
    it('serves POST /api/polls with chatId in body', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const res = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          chatId,
          question: 'Body route poll?',
          options: ['Yes', 'No'],
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeTruthy();
      expect(res.body.question).toBe('Body route poll?');
    });

    it('serves POST /api/polls with object options from CreatePollView', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      // CreatePollView шлёт варианты объектами {id, text, votes}
      const res = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          chatId,
          question: 'Object options?',
          options: [
            { id: 'opt1', text: 'First', votes: 0 },
            { id: 'opt2', text: 'Second', votes: 0 },
          ],
        });

      expect(res.status).toBe(201);
      expect(JSON.parse(JSON.stringify(res.body.options))).toEqual(['First', 'Second']);
    });

    it('rejects POST /api/polls without chatId', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ question: 'No chat?', options: ['A', 'B'] });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('chatId');
    });

    it('rejects POST /api/polls with empty option text', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);

      const res = await request(app)
        .post('/api/polls')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          chatId,
          question: 'Empty option?',
          options: [{ id: 'o1', text: '' }, 'B'],
        });

      expect(res.status).toBe(400);
    });

    it('serves GET /api/polls/:id (loadPoll route)', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);
      const pollRes = await createPoll(user.accessToken, chatId);

      const res = await request(app)
        .get(`/api/polls/${pollRes.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(pollRes.body.id);
      expect(res.body.question).toBe('What is your favorite color?');
    });

    it('returns 404 for missing poll on GET /api/polls/:id', async () => {
      const user = await registerTestUser();

      const res = await request(app)
        .get('/api/polls/nonexistent-id')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(404);
    });

    it('accepts optionIndices array (ViewPoll payload) on vote', async () => {
      const user = await registerTestUser();
      const chatId = await createChatAndGetId(user.accessToken);
      const pollRes = await createPoll(user.accessToken, chatId);

      const res = await request(app)
        .post(`/api/polls/${pollRes.body.id}/vote`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ optionIndices: [0] });

      expect(res.status).toBe(200);
    });
  });
});

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
});

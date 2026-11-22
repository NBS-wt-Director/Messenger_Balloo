// Личные чаты (тик. 1795369072): раньше direct-чат создавался только звонком,
// кнопки «Новый чат»/клик по контакту вели в никуда (navigate('/chat') = no-op),
// а сервер отклонял type='direct' («Поле type обязательно»).
import request from 'supertest';
import { app, registerTestUser } from './helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('POST /api/chats — личный чат (direct)', () => {
  it('создаёт direct-чат и добавляет собеседника', async () => {
    const me = await registerTestUser();
    const peer = await registerTestUser();

    const res = await request(app)
      .post('/api/chats')
      .set(auth(me.accessToken))
      .send({ type: 'direct', memberIds: [peer.id] });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe('direct');
    expect(res.body.id).toBeTruthy();
    expect(res.body.memberCount).toBe(2);
  });

  it('идемпотентен: повторный вызов отдаёт тот же чат', async () => {
    const me = await registerTestUser();
    const peer = await registerTestUser();

    const first = await request(app)
      .post('/api/chats')
      .set(auth(me.accessToken))
      .send({ type: 'direct', memberIds: [peer.id] });

    const second = await request(app)
      .post('/api/chats')
      .set(auth(me.accessToken))
      .send({ type: 'direct', memberIds: [peer.id] });

    expect(second.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);
  });

  it('без собеседника — 400', async () => {
    const me = await registerTestUser();

    const res = await request(app)
      .post('/api/chats')
      .set(auth(me.accessToken))
      .send({ type: 'direct', memberIds: [] });

    expect(res.status).toBe(400);
  });

  it('сам с собой — 400', async () => {
    const me = await registerTestUser();

    const res = await request(app)
      .post('/api/chats')
      .set(auth(me.accessToken))
      .send({ type: 'direct', memberIds: [me.id] });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/chats — direct-чат отдаёт peer и memberIds', () => {
  it('в списке есть собеседник и его id', async () => {
    const me = await registerTestUser();
    const peer = await registerTestUser();

    const created = await request(app)
      .post('/api/chats')
      .set(auth(me.accessToken))
      .send({ type: 'direct', memberIds: [peer.id] });

    const res = await request(app)
      .get('/api/chats')
      .set(auth(me.accessToken));

    expect(res.status).toBe(200);
    const chat = res.body.chats.find((c: any) => c.id === created.body.id);
    expect(chat).toBeTruthy();
    expect(chat.type).toBe('direct');
    expect(chat.peer).toBeTruthy();
    expect(chat.peer.id).toBe(peer.id);
    expect(chat.memberIds).toContain(peer.id);
    expect(chat.memberIds).toContain(me.id);
  });
});

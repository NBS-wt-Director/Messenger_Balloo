// Тесты чата с техподдержкой (тикет 1790572800-01)
// ТЗ: mockups/balloo-su/support.md — GET/POST /api/support/chat, GET /api/support/status,
// админская часть (ответ В-33): /api/admin/support/tickets[…/reply]
//
// Интеграционные: supertest + реальная локальная БД balloo (таблицы support_tickets /
// support_messages созданы миграцией 20260929125449_support_chat).

import request from 'supertest';
import { app, registerTestUser, TestUser, generateToken } from './helpers';

const prisma = new (require('@prisma/client').PrismaClient)();

let user: TestUser;
let adminId: string;

beforeAll(async () => {
  user = await registerTestUser();

  // Админ для проверки админских маршрутов (роль в JWT, не в БД — middleware
  // adminOnly смотрит на req.user.role из токена).
  const adminEmail = `support.admin.${Date.now()}@test.balloo.ru`;
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      username: `supportadmin${Date.now()}`,
      role: 'admin',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      updatedAt: BigInt(Math.floor(Date.now() / 1000)),
    },
  });
  adminId = admin.id;
});

afterAll(async () => {
  await prisma.supportMessage.deleteMany({ where: { ticket: { userId: user.id } } });
  await prisma.supportTicket.deleteMany({ where: { userId: user.id } });
  await prisma.user.deleteMany({ where: { id: { in: [adminId, user.id] } } });
  await prisma.$disconnect();
});

describe('Support — чат пользователя', () => {
  it('гость получает 401', async () => {
    const res = await request(app).get('/api/support/chat');
    expect(res.status).toBe(401);
  });

  it('первое обращение создаёт тикет и приветственный автоответ', async () => {
    const res = await request(app)
      .get('/api/support/chat')
      .set('Cookie', `balloo-access-token=${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ticket).toBeTruthy();
    expect(res.body.created).toBe(true);
    expect(res.body.ticket.priority).toBe('normal');
    expect(res.body.messages.length).toBe(1);
    expect(res.body.messages[0].text).toContain('Здравствуйте');
    expect(res.body.messages[0].isBot).toBe(true);
  });

  it('повторный GET не создаёт второй тикет', async () => {
    const res = await request(app)
      .get('/api/support/chat')
      .set('Cookie', `balloo-access-token=${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.created).toBe(false);
    expect(res.body.messages.length).toBe(1);
  });

  it('POST /chat сохраняет сообщение и повышает приоритет при повторном обращении', async () => {
    const sent = await request(app)
      .post('/api/support/chat')
      .set('Cookie', `balloo-access-token=${user.accessToken}`)
      .send({ text: 'Не могу подключить Яндекс Диск' });

    expect(sent.status).toBe(201);
    expect(sent.body.text).toBe('Не могу подключить Яндекс Диск');

    const chat = await request(app)
      .get('/api/support/chat')
      .set('Cookie', `balloo-access-token=${user.accessToken}`);

    expect(chat.body.messages.length).toBe(2);
    expect(chat.body.messages[1].text).toBe('Не могу подключить Яндекс Диск');
    expect(chat.body.messages[1].isBot).toBe(false);
  });

  it('пустой текст — 400', async () => {
    const res = await request(app)
      .post('/api/support/chat')
      .set('Cookie', `balloo-access-token=${user.accessToken}`)
      .send({ text: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('пуст');
  });

  it('GET /status отдаёт онлайн и среднее время ответа', async () => {
    const res = await request(app)
      .get('/api/support/status')
      .set('Cookie', `balloo-access-token=${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.online).toBe(true);
    expect(typeof res.body.avgResponseMinutes).toBe('number');
    expect(res.body.openTickets).toBeGreaterThan(0);
  });
});

describe('Support — админский контур (ответ В-33)', () => {
  it('обычный пользователь получает 403 на список тикетов', async () => {
    const res = await request(app)
      .get('/api/admin/support/tickets')
      .set('Cookie', `balloo-access-token=${user.accessToken}`);

    expect(res.status).toBe(403);
  });

  it('админ видит список тикетов', async () => {
    const adminToken = generateToken(adminId, 'admin@test.balloo.ru', 'admin', 'admin');
    const res = await request(app)
      .get('/api/admin/support/tickets')
      .set('Cookie', `balloo-access-token=${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    const ticket = res.body.tickets.find((t: any) => t.user.id === user.id);
    expect(ticket).toBeTruthy();
    expect(ticket.messagesCount).toBeGreaterThan(0);
  });

  it('админ отвечает в тикете, статус становится in_progress', async () => {
    const adminToken = generateToken(adminId, 'admin@test.balloo.ru', 'admin', 'admin');

    const list = await request(app)
      .get('/api/admin/support/tickets')
      .set('Cookie', `balloo-access-token=${adminToken}`);
    const ticket = list.body.tickets.find((t: any) => t.user.id === user.id);

    const reply = await request(app)
      .post(`/api/admin/support/tickets/${ticket.id}/reply`)
      .set('Cookie', `balloo-access-token=${adminToken}`)
      .send({ text: 'Попробуйте перепривязать аккаунт в настройках' });

    expect(reply.status).toBe(201);
    expect(reply.body.isInternal).toBe(false);

    const detail = await request(app)
      .get(`/api/admin/support/tickets/${ticket.id}`)
      .set('Cookie', `balloo-access-token=${adminToken}`);

    expect(detail.status).toBe(200);
    expect(detail.body.status).toBe('in_progress');
    expect(detail.body.messages.length).toBe(3);
  });

  it('внутренняя заметка админа не видна пользователю', async () => {
    const adminToken = generateToken(adminId, 'admin@test.balloo.ru', 'admin', 'admin');

    const list = await request(app)
      .get('/api/admin/support/tickets')
      .set('Cookie', `balloo-access-token=${adminToken}`);
    const ticket = list.body.tickets.find((t: any) => t.user.id === user.id);

    await request(app)
      .post(`/api/admin/support/tickets/${ticket.id}/reply`)
      .set('Cookie', `balloo-access-token=${adminToken}`)
      .send({ text: 'Внутренняя заметка: проверить логи', isInternal: true });

    const userChat = await request(app)
      .get('/api/support/chat')
      .set('Cookie', `balloo-access-token=${user.accessToken}`);

    const texts = userChat.body.messages.map((m: any) => m.text);
    expect(texts).not.toContain('Внутренняя заметка: проверить логи');
    expect(texts).toContain('Попробуйте перепривязать аккаунт в настройках');
  });
});

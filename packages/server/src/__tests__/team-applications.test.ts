// Заявки в команду Balloo и выдача прав (тик. 1795888510).
//
// Проверяем: первый пользователь = superadmin, подача заявки (идемпотентность),
// доступ админов, принятие (выдаёт роль + сообщение заявителю), отклонение,
// сообщение из формы заявки, смену роли только суперадмином.

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app, registerTestUser, generateToken } from './helpers';
import { registrationRole } from '../services/authService';

const prisma = new PrismaClient();

/** Токен с ролью admin/superadmin — роль в JWT читает middleware auth. */
function tokenFor(user: { id: string; email: string; username: string }, role: string) {
  return generateToken(user.id, user.email, user.username, role);
}

/** Удаляет созданные в тесте заявки и восстанавливает роль пользователя. */
async function cleanup(userIds: string[]) {
  if (userIds.length === 0) return;
  await prisma.teamApplication.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.updateMany({ where: { id: { in: userIds } }, data: { role: 'user' } });
}

describe('registrationRole — первый пользователь (тик. 1795888510)', () => {
  it('без администраторов новый пользователь становится суперадмином', () => {
    expect(registrationRole(0)).toBe('superadmin');
  });

  it('при наличии администратора новый пользователь остаётся пользователем', () => {
    expect(registrationRole(1)).toBe('user');
    expect(registrationRole(5)).toBe('user');
  });
});

describe('Заявки в команду (тик. 1795888510)', () => {
  const createdUserIds: string[] = [];

  afterAll(async () => {
    await cleanup(createdUserIds);
    await prisma.$disconnect();
  });

  it('POST /api/team-applications без авторизации — 401', async () => {
    const res = await request(app).post('/api/team-applications').send({ message: 'hi' });
    expect(res.status).toBe(401);
  });

  it('подача заявки сохраняет id Balloo и возвращает статус new', async () => {
    const user = await registerTestUser();
    createdUserIds.push(user.id);

    const res = await request(app)
      .post('/api/team-applications')
      .set('Authorization', `Bearer ${tokenFor(user, 'user')}`)
      .send({ message: 'Хочу помочь проекту' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      userId: user.id,
      username: user.username,
      status: 'new',
      message: 'Хочу помочь проекту',
    });
    expect(typeof res.body.createdAt).toBe('number');
  });

  it('повторная подача при активной заявке не создаёт дубль', async () => {
    const user = await registerTestUser();
    createdUserIds.push(user.id);
    const auth = { Authorization: `Bearer ${tokenFor(user, 'user')}` };

    const first = await request(app)
      .post('/api/team-applications')
      .set(auth)
      .send({ message: 'первая' });
    const second = await request(app)
      .post('/api/team-applications')
      .set(auth)
      .send({ message: 'вторая' });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
    expect(second.body.message).toBe('первая');

    const count = await prisma.teamApplication.count({
      where: { userId: user.id, status: 'new' },
    });
    expect(count).toBe(1);
  });

  it('GET /api/admin/team-applications: не-админ — 403, админ — 200', async () => {
    const user = await registerTestUser();
    createdUserIds.push(user.id);

    const denied = await request(app)
      .get('/api/admin/team-applications')
      .set('Authorization', `Bearer ${tokenFor(user, 'user')}`);
    expect(denied.status).toBe(403);

    const allowed = await request(app)
      .get('/api/admin/team-applications')
      .set('Authorization', `Bearer ${tokenFor(user, 'admin')}`);
    expect(allowed.status).toBe(200);
    expect(Array.isArray(allowed.body.applications)).toBe(true);
  });

  it('принятие выдаёт роль admin, закрывает заявку и создаёт сообщение заявителю', async () => {
    const applicant = await registerTestUser();
    const reviewer = await registerTestUser();
    createdUserIds.push(applicant.id, reviewer.id);

    const created = await request(app)
      .post('/api/team-applications')
      .set('Authorization', `Bearer ${tokenFor(applicant, 'user')}`)
      .send({ message: 'В команду' });
    expect(created.status).toBe(201);

    const res = await request(app)
      .post(`/api/admin/team-applications/${created.body.id}/accept`)
      .set('Authorization', `Bearer ${tokenFor(reviewer, 'superadmin')}`);

    expect(res.status).toBe(200);
    expect(res.body.granted).toBe(true);
    expect(res.body.application.status).toBe('accepted');

    const applicantRow = await prisma.user.findUnique({ where: { id: applicant.id } });
    expect(applicantRow?.role).toBe('admin');

    // Сообщение должно лежать в direct-чате между ревьюером и заявителем.
    const chat = await prisma.chat.findFirst({
      where: {
        type: 'direct',
        AND: [
          { members: { some: { userId: reviewer.id } } },
          { members: { some: { userId: applicant.id } } },
        ],
      },
    });
    expect(chat).not.toBeNull();
    const message = await prisma.message.findFirst({
      where: { chatId: chat!.id, senderId: reviewer.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(message?.content).toContain('принята');
  });

  it('отклонение меняет статус и не выдаёт роль', async () => {
    const applicant = await registerTestUser();
    const reviewer = await registerTestUser();
    createdUserIds.push(applicant.id, reviewer.id);

    const created = await request(app)
      .post('/api/team-applications')
      .set('Authorization', `Bearer ${tokenFor(applicant, 'user')}`)
      .send({ message: 'Заявка' });

    const res = await request(app)
      .post(`/api/admin/team-applications/${created.body.id}/reject`)
      .set('Authorization', `Bearer ${tokenFor(reviewer, 'admin')}`);

    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe('rejected');

    const applicantRow = await prisma.user.findUnique({ where: { id: applicant.id } });
    expect(applicantRow?.role).toBe('user');
  });

  it('сообщение из формы заявки уходит заявителю и обновляет lastMessageAt', async () => {
    const applicant = await registerTestUser();
    const reviewer = await registerTestUser();
    createdUserIds.push(applicant.id, reviewer.id);

    const created = await request(app)
      .post('/api/team-applications')
      .set('Authorization', `Bearer ${tokenFor(applicant, 'user')}`)
      .send({ message: 'Вопрос' });

    const res = await request(app)
      .post(`/api/admin/team-applications/${created.body.id}/message`)
      .set('Authorization', `Bearer ${tokenFor(reviewer, 'admin')}`)
      .send({ text: 'Расскажите о себе подробнее' });

    expect(res.status).toBe(201);
    expect(res.body.message).toHaveProperty('id');

    const row = await prisma.teamApplication.findUnique({ where: { id: created.body.id } });
    expect(Number(row?.lastMessageAt)).toBeGreaterThan(0);
  });

  it('сообщение без текста — 400', async () => {
    const applicant = await registerTestUser();
    const reviewer = await registerTestUser();
    createdUserIds.push(applicant.id, reviewer.id);

    const created = await request(app)
      .post('/api/team-applications')
      .set('Authorization', `Bearer ${tokenFor(applicant, 'user')}`)
      .send({ message: 'Вопрос' });

    const res = await request(app)
      .post(`/api/admin/team-applications/${created.body.id}/message`)
      .set('Authorization', `Bearer ${tokenFor(reviewer, 'admin')}`)
      .send({ text: '   ' });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/admin/users/:id/role (тик. 1795888510)', () => {
  const createdUserIds: string[] = [];

  afterAll(async () => {
    await cleanup(createdUserIds);
    await prisma.$disconnect();
  });

  it('суперадмин выдаёт роль admin', async () => {
    const actor = await registerTestUser();
    const target = await registerTestUser();
    createdUserIds.push(actor.id, target.id);

    const res = await request(app)
      .patch(`/api/admin/users/${target.id}/role`)
      .set('Authorization', `Bearer ${tokenFor(actor, 'superadmin')}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');

    const row = await prisma.user.findUnique({ where: { id: target.id } });
    expect(row?.role).toBe('admin');
  });

  it('admin не может менять роли — 403', async () => {
    const actor = await registerTestUser();
    const target = await registerTestUser();
    createdUserIds.push(actor.id, target.id);

    const res = await request(app)
      .patch(`/api/admin/users/${target.id}/role`)
      .set('Authorization', `Bearer ${tokenFor(actor, 'admin')}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(403);
  });

  it('недопустимая роль — 400', async () => {
    const actor = await registerTestUser();
    const target = await registerTestUser();
    createdUserIds.push(actor.id, target.id);

    const res = await request(app)
      .patch(`/api/admin/users/${target.id}/role`)
      .set('Authorization', `Bearer ${tokenFor(actor, 'superadmin')}`)
      .send({ role: 'superadmin' });

    expect(res.status).toBe(400);
  });

  it('нельзя изменить собственную роль — 400', async () => {
    const actor = await registerTestUser();
    createdUserIds.push(actor.id);

    const res = await request(app)
      .patch(`/api/admin/users/${actor.id}/role`)
      .set('Authorization', `Bearer ${tokenFor(actor, 'superadmin')}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(400);
  });
});

// invites-link-flow.test.ts — приглашения по ссылке (тик. 1795270823)
//
// Проверяет: предпросмотр (публичный), принятие по коду, мульти-группы,
// авто-контакты (ensureMutualContacts), рефералы.

import request from 'supertest';
import { app, registerTestUser } from './helpers';
import { PrismaClient } from '@prisma/client';
import { ensureMutualContacts } from '../services/userService';

const prisma = new PrismaClient();

describe('Invites link flow (тик. 1795270823)', () => {
  let inviter: { id: string; accessToken: string };
  let invitee: { id: string; accessToken: string };
  let groupId: string;
  let extraGroupId: string;
  let code: string;

  beforeAll(async () => {
    inviter = await registerTestUser();
    invitee = await registerTestUser();

    const g1 = await request(app)
      .post('/api/chats')
      .set('Authorization', `Bearer ${inviter.accessToken}`)
      .send({ type: 'group', name: `Invite group ${Date.now()}` });
    groupId = g1.body.id;

    const g2 = await request(app)
      .post('/api/chats')
      .set('Authorization', `Bearer ${inviter.accessToken}`)
      .send({ type: 'group', name: `Invite group2 ${Date.now()}` });
    extraGroupId = g2.body.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('ensureMutualContacts идемпотентна (нет дублей)', async () => {
    await ensureMutualContacts(inviter.id, invitee.id);
    await ensureMutualContacts(inviter.id, invitee.id); // повторно — не должно дублировать

    const forward = await prisma.contact.count({ where: { userId: inviter.id, contactId: invitee.id } });
    const backward = await prisma.contact.count({ where: { userId: invitee.id, contactId: inviter.id } });
    expect(forward).toBe(1);
    expect(backward).toBe(1);
  });

  it('создаёт приглашение с группами, контактами и текстом', async () => {
    const res = await request(app)
      .post('/api/invites')
      .set('Authorization', `Bearer ${inviter.accessToken}`)
      .send({
        chatId: groupId,
        groupIds: [extraGroupId],
        addToContacts: true,
        message: 'Привет! Присоединяйся',
      });

    expect(res.status).toBe(201);
    expect(res.body.code).toBeTruthy();
    expect(res.body.url).toContain('/join/');
    code = res.body.code;
  });

  it('публичный предпросмотр отдаёт пригласившего, группы и текст', async () => {
    const res = await request(app).get(`/api/invites/preview/${code}`);

    expect(res.status).toBe(200);
    expect(res.body.messenger).toBe('Balloo');
    expect(res.body.inviter.id).toBe(inviter.id);
    expect(res.body.message).toBe('Привет! Присоединяйся');
    expect(res.body.addToContacts).toBe(true);
    const ids = res.body.groups.map((g: any) => g.id);
    expect(ids).toContain(groupId);
    expect(ids).toContain(extraGroupId);
  });

  it('несуществующий код → 404', async () => {
    const res = await request(app).get('/api/invites/preview/no-such-code');
    expect(res.status).toBe(404);
  });

  it('принятие по коду: вступает во все группы и засчитывается рефералом', async () => {
    // Гарантируем чистый старт по контактам
    await prisma.contact.deleteMany({
      where: {
        OR: [
          { userId: inviter.id, contactId: invitee.id },
          { userId: invitee.id, contactId: inviter.id },
        ],
      },
    });

    const res = await request(app)
      .post(`/api/invites/accept/${code}`)
      .set('Authorization', `Bearer ${invitee.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.joinedChatIds).toEqual(expect.arrayContaining([groupId, extraGroupId]));
    expect(res.body.addedToContacts).toBe(true);

    // Контакты созданы (флаг addToContacts)
    const forward = await prisma.contact.count({ where: { userId: inviter.id, contactId: invitee.id } });
    expect(forward).toBe(1);

    // Реферал записан
    const referral = await prisma.inviteAcceptance.findFirst({
      where: { inviterId: inviter.id, userId: invitee.id },
    });
    expect(referral).not.toBeNull();

    // Оба чата в membership
    const memberships = await prisma.userChat.count({
      where: { userId: invitee.id, chatId: { in: [groupId, extraGroupId] } },
    });
    expect(memberships).toBe(2);
  });

  it('GET /api/invites/referrals показывает приглашённого', async () => {
    const res = await request(app)
      .get('/api/invites/referrals')
      .set('Authorization', `Bearer ${inviter.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    const ids = res.body.referrals.map((r: any) => r.userId);
    expect(ids).toContain(invitee.id);
  });

  it('приглашающий не может принять своё приглашение', async () => {
    const res = await request(app)
      .post(`/api/invites/accept/${code}`)
      .set('Authorization', `Bearer ${inviter.accessToken}`);
    expect(res.status).toBe(400);
  });

  it('регистрация с inviteCode засчитывает реферал', async () => {
    const newUser = await registerTestUser();
    // Регистрируем ещё одного и применяем приглашение через сервис напрямую
    const { applyInviteOnRegister } = await import('../services/inviteService');
    await applyInviteOnRegister(code, newUser.id);

    const referral = await prisma.inviteAcceptance.findFirst({
      where: { inviterId: inviter.id, userId: newUser.id },
    });
    expect(referral).not.toBeNull();
  });
});

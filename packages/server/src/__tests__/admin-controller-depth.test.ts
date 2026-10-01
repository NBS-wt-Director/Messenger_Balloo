/**
 * Depth-тесты adminController (тикет 1790479920-02, п.7, В-93 (а)).
 *
 * admin.test.ts покрывает только smoke-пути. Здесь — ветки:
 *  - listUsers: поиск q, фильтры role/status, сортировка asc/desc, пагинация
 *    (totalPages, limit<=100);
 *  - banUser: 400 без reason, 404 P2025, бан с duration (expiresAt),
 *    запись UserBan + AuditLog;
 *  - unbanUser: снятие permanent и future-банов, AuditLog;
 *  - suspendUser: 400 без reason, default duration 3600, custom duration;
 *  - deleteUser: soft delete status=deleted, 404;
 *  - listReports: фильтры status/targetType, пагинация;
 *  - resolveReport: 400 неверный action, 404, dismiss-ветка, ban-ветка
 *    (user.banned + UserBan);
 *  - listBans: фильтры userId/adminId;
 *  - createAnnouncement: 400 без title/content, activeFrom/activeUntil;
 *  - toggleFeatureFlag: 404 несуществующий, toggle false→true→false;
 *  - publishVersion: 400 без version, isLatest-переключение предыдущей;
 *  - getMetrics: summary-счётчики;
 *  - listAuditLogs: фильтры action/adminId/target.
 */
import request from 'supertest';
import { app, registerTestUser, generateToken } from './helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const now = () => BigInt(Math.floor(Date.now() / 1000));

async function createAdmin() {
  const user = await registerTestUser();
  await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } });
  return { ...user, adminToken: generateToken(user.id, user.email, user.username, 'admin') };
}

describe('Admin controller depth (В-93 а)', () => {
  let admin: Awaited<ReturnType<typeof createAdmin>>;

  beforeAll(async () => {
    admin = await createAdmin();
  });

  afterAll(async () => {
    // чистим данные с тестовым маркером
    await prisma.auditLog.deleteMany({ where: { adminId: admin?.id } });
    await prisma.userBan.deleteMany({ where: { adminId: admin?.id } });
    await prisma.announcement.deleteMany({ where: { title: { startsWith: '[depth]' } } });
    await prisma.featureFlag.deleteMany({ where: { name: { startsWith: 'depth_' } } });
    await prisma.serviceVersion.deleteMany({ where: { version: { startsWith: '9.9.' } } });
    await prisma.report.deleteMany({ where: { reporterId: admin?.id } });
    await prisma.$disconnect();
  });

  describe('GET /api/admin/users (listUsers)', () => {
    it('поиск q по email/username', async () => {
      const target = await registerTestUser();
      const res = await request(app)
        .get(`/api/admin/users?q=${encodeURIComponent(target.email.split('@')[0])}`)
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      const ids = res.body.users.map((u: { id: string }) => u.id);
      expect(ids).toContain(target.id);
      // _count включён
      expect(res.body.users[0]).toHaveProperty('_count');
    });

    it('фильтр role=admin и status=active', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=admin&status=active')
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      for (const u of res.body.users) {
        expect(u.role).toBe('admin');
        expect(u.status).toBe('active');
      }
    });

    it('сортировка sortOrder=asc по createdAt', async () => {
      const res = await request(app)
        .get('/api/admin/users?sortBy=createdAt&sortOrder=asc&limit=5')
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      const list = res.body.users as { createdAt: string }[];
      for (let i = 1; i < list.length; i++) {
        expect(Number(list[i].createdAt) >= Number(list[i - 1].createdAt)).toBe(true);
      }
    });

    it('пагинация: totalPages и limit cap 100', async () => {
      const res = await request(app)
        .get('/api/admin/users?page=2&limit=999')
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(100); // Math.min(999,100)
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination).toHaveProperty('totalPages');
    });
  });

  describe('POST /api/admin/users/:id/ban', () => {
    it('без reason → 400 «Причина бана обязательна»', async () => {
      const target = await registerTestUser();
      const res = await request(app)
        .post(`/api/admin/users/${target.id}/ban`)
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Причина');
    });

    it('несуществующий пользователь → 404 P2025', async () => {
      const res = await request(app)
        .post('/api/admin/users/no-such-id/ban')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ reason: 'x' });
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('не найден');
    });

    it('бан с duration (дни) → expiresAt в UserBan', async () => {
      const target = await registerTestUser();
      const res = await request(app)
        .post(`/api/admin/users/${target.id}/ban`)
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ reason: 'depth test ban', duration: 7, global: true });
      expect(res.status).toBe(200);
      expect(res.body.user.status).toBe('banned');
      const ban = await prisma.userBan.findFirst({ where: { userId: target.id } });
      expect(ban).toBeTruthy();
      expect(ban!.expiresAt).toBeTruthy();
      // 7 дней = 604800 секунд, допуск ±5с
      const delta = Number(ban!.expiresAt) - Number(now());
      expect(delta).toBeGreaterThan(604800 - 10);
      expect(delta).toBeLessThan(604800 + 10);
      expect(ban!.global).toBe(true);
      // audit log записан
      const log = await prisma.auditLog.findFirst({ where: { action: 'BAN_USER', target: target.id } });
      expect(log).toBeTruthy();
    });

    it('бан без duration → expiresAt null (permanent)', async () => {
      const target = await registerTestUser();
      const res = await request(app)
        .post(`/api/admin/users/${target.id}/ban`)
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ reason: 'perm ban' });
      expect(res.status).toBe(200);
      const ban = await prisma.userBan.findFirst({ where: { userId: target.id, reason: 'perm ban' } });
      expect(ban!.expiresAt).toBeNull();
    });
  });

  describe('POST /api/admin/users/:id/unban', () => {
    it('снимает permanent и future-баны', async () => {
      const target = await registerTestUser();
      // permanent ban
      await prisma.userBan.create({
        data: { userId: target.id, adminId: admin.id, reason: 'perm', expiresAt: null, createdAt: now() },
      });
      // future ban
      await prisma.userBan.create({
        data: { userId: target.id, adminId: admin.id, reason: 'future', expiresAt: now() + 3600n, createdAt: now() },
      });
      await prisma.user.update({ where: { id: target.id }, data: { status: 'banned' } });

      const res = await request(app)
        .post(`/api/admin/users/${target.id}/unban`)
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.status).toBe('active');
      const remaining = await prisma.userBan.findMany({ where: { userId: target.id } });
      expect(remaining).toHaveLength(0);
      const log = await prisma.auditLog.findFirst({ where: { action: 'UNBAN_USER', target: target.id } });
      expect(log).toBeTruthy();
    });

    it('несуществующий пользователь → 404', async () => {
      const res = await request(app)
        .post('/api/admin/users/no-such-id/unban')
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/admin/users/:id/suspend', () => {
    it('без reason → 400', async () => {
      const target = await registerTestUser();
      const res = await request(app)
        .post(`/api/admin/users/${target.id}/suspend`)
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Причина');
    });

    it('default duration 3600 (1 час)', async () => {
      const target = await registerTestUser();
      const res = await request(app)
        .post(`/api/admin/users/${target.id}/suspend`)
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ reason: 'cool down' });
      expect(res.status).toBe(200);
      expect(res.body.user.status).toBe('suspended');
      const delta = Number(res.body.user.suspendedUntil) - Number(now());
      expect(delta).toBeGreaterThan(3600 - 10);
      expect(delta).toBeLessThan(3600 + 10);
      const log = await prisma.auditLog.findFirst({ where: { action: 'SUSPEND_USER', target: target.id } });
      expect(log).toBeTruthy();
    });

    it('custom duration (минуты) → 30 мин', async () => {
      const target = await registerTestUser();
      const res = await request(app)
        .post(`/api/admin/users/${target.id}/suspend`)
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ reason: 'short', duration: 30 });
      expect(res.status).toBe(200);
      const delta = Number(res.body.user.suspendedUntil) - Number(now());
      expect(delta).toBeGreaterThan(1800 - 10);
      expect(delta).toBeLessThan(1800 + 10);
    });

    it('несуществующий пользователь → 404', async () => {
      const res = await request(app)
        .post('/api/admin/users/no-such-id/suspend')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ reason: 'x' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/admin/users/:id/delete', () => {
    it('soft delete → status=deleted + audit log', async () => {
      const target = await registerTestUser();
      const res = await request(app)
        .post(`/api/admin/users/${target.id}/delete`)
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('удалён');
      const u = await prisma.user.findUnique({ where: { id: target.id } });
      expect(u!.status).toBe('deleted');
      const log = await prisma.auditLog.findFirst({ where: { action: 'DELETE_USER', target: target.id } });
      expect(log).toBeTruthy();
    });

    it('несуществующий пользователь → 404', async () => {
      const res = await request(app)
        .post('/api/admin/users/no-such-id/delete')
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/admin/reports + POST resolve', () => {
    it('фильтры status/targetType + пагинация', async () => {
      const report = await prisma.report.create({
        data: {
          reporterId: admin.id, targetId: admin.id, targetType: 'user',
          reason: '[depth] test report', status: 'open', createdAt: now(), updatedAt: now(),
        },
      });
      const res = await request(app)
        .get('/api/admin/reports?status=open&targetType=user&limit=10&page=1')
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pagination');
      const ids = res.body.reports.map((r: { id: string }) => r.id);
      expect(ids).toContain(report.id);
      // reporter включён
      const found = res.body.reports.find((r: { id: string }) => r.id === report.id);
      expect(found.reporter).toBeTruthy();
    });

    it('resolve: неверный action → 400', async () => {
      const report = await prisma.report.create({
        data: {
          reporterId: admin.id, targetId: admin.id, targetType: 'user',
          reason: '[depth] resolve', status: 'open', createdAt: now(), updatedAt: now(),
        },
      });
      const res = await request(app)
        .post(`/api/admin/reports/${report.id}/resolve`)
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ action: 'explode' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('dismiss');
    });

    it('resolve: dismiss → status=resolved, resolvedBy/At', async () => {
      const report = await prisma.report.create({
        data: {
          reporterId: admin.id, targetId: admin.id, targetType: 'user',
          reason: '[depth] dismiss', status: 'open', createdAt: now(), updatedAt: now(),
        },
      });
      const res = await request(app)
        .post(`/api/admin/reports/${report.id}/resolve`)
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ action: 'dismiss', comment: 'no issue' });
      expect(res.status).toBe(200);
      const updated = await prisma.report.findUnique({ where: { id: report.id } });
      expect(updated!.status).toBe('resolved');
      expect(updated!.resolvedBy).toBe(admin.id);
      expect(updated!.action).toBe('dismiss');
      const log = await prisma.auditLog.findFirst({ where: { action: 'RESOLVE_REPORT', target: report.id } });
      expect(log).toBeTruthy();
    });

    it('resolve: ban на targetType=user → юзер забанен + UserBan', async () => {
      const target = await registerTestUser();
      const report = await prisma.report.create({
        data: {
          reporterId: admin.id, targetId: target.id, targetType: 'user',
          reason: '[depth] ban', status: 'open', createdAt: now(), updatedAt: now(),
        },
      });
      const res = await request(app)
        .post(`/api/admin/reports/${report.id}/resolve`)
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ action: 'ban', comment: 'bad actor' });
      expect(res.status).toBe(200);
      const u = await prisma.user.findUnique({ where: { id: target.id } });
      expect(u!.status).toBe('banned');
      const ban = await prisma.userBan.findFirst({ where: { userId: target.id } });
      expect(ban!.reason).toContain(report.id);
      // чистим статус, чтобы не влиять на другие наборы
      await prisma.user.update({ where: { id: target.id }, data: { status: 'active' } });
      await prisma.userBan.deleteMany({ where: { userId: target.id } });
    });

    it('resolve: несуществующая жалоба → 404', async () => {
      const res = await request(app)
        .post('/api/admin/reports/no-such-id/resolve')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ action: 'dismiss' });
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('не найдена');
    });
  });

  describe('GET /api/admin/bans (listBans)', () => {
    it('фильтр userId', async () => {
      const target = await registerTestUser();
      await prisma.userBan.create({
        data: { userId: target.id, adminId: admin.id, reason: 'filter test', expiresAt: null, createdAt: now() },
      });
      const res = await request(app)
        .get(`/api/admin/bans?userId=${target.id}`)
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      for (const b of res.body.bans) expect(b.userId).toBe(target.id);
      expect(res.body.bans.length).toBeGreaterThanOrEqual(1);
      // include user
      expect(res.body.bans[0].user).toBeTruthy();
      await prisma.userBan.deleteMany({ where: { userId: target.id } });
    });

    it('фильтр adminId', async () => {
      const res = await request(app)
        .get(`/api/admin/bans?adminId=${admin.id}`)
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      for (const b of res.body.bans) expect(b.adminId).toBe(admin.id);
    });
  });

  describe('POST/GET /api/admin/announcements', () => {
    it('без title/content → 400', async () => {
      const res = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Заголовок');
    });

    it('создание с activeFrom/activeUntil + audit log', async () => {
      const res = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ title: '[depth] test', content: 'hello', targetAudience: 'users', activeFrom: now().toString(), activeUntil: (now() + 3600n).toString() });
      expect(res.status).toBe(201);
      expect(res.body.targetAudience).toBe('users');
      const a = await prisma.announcement.findUnique({ where: { id: res.body.id } });
      expect(a!.activeUntil).toBe(now() + 3600n);
      const log = await prisma.auditLog.findFirst({ where: { action: 'CREATE_ANNOUNCEMENT', target: res.body.id } });
      expect(log).toBeTruthy();
    });

    it('создание без activeFrom → по умолчанию now; без targetAudience → all', async () => {
      const res = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ title: '[depth] defaults', content: 'hi' });
      expect(res.status).toBe(201);
      expect(res.body.targetAudience).toBe('all');
      const delta = Number(res.body.activeFrom) - Number(now());
      expect(Math.abs(delta)).toBeLessThan(10);
    });

    it('список объявлений отсортирован по activeFrom desc', async () => {
      const res = await request(app)
        .get('/api/admin/announcements')
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      const list = res.body.announcements as { activeFrom: string }[];
      for (let i = 1; i < list.length; i++) {
        expect(Number(list[i].activeFrom) <= Number(list[i - 1].activeFrom)).toBe(true);
      }
    });
  });

  describe('GET/POST /api/admin/feature-flags', () => {
    it('toggle несуществующего → 404', async () => {
      const res = await request(app)
        .post('/api/admin/feature-flags/no-such-id/toggle')
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('не найден');
    });

    it('toggle false→true→false + audit log', async () => {
      const flag = await prisma.featureFlag.create({
        data: { name: `depth_flag_${Date.now()}`, enabled: false, createdAt: now(), updatedAt: now() },
      });
      const r1 = await request(app)
        .post(`/api/admin/feature-flags/${flag.id}/toggle`)
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(r1.status).toBe(200);
      expect(r1.body.flag.enabled).toBe(true);
      const r2 = await request(app)
        .post(`/api/admin/feature-flags/${flag.id}/toggle`)
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(r2.body.flag.enabled).toBe(false);
      const log = await prisma.auditLog.findFirst({ where: { action: 'TOGGLE_FEATURE_FLAG', target: flag.id } });
      expect(log).toBeTruthy();
    });

    it('список отсортирован по name asc', async () => {
      const res = await request(app)
        .get('/api/admin/feature-flags')
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      const names = res.body.flags.map((f: { name: string }) => f.name);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });
  });

  describe('GET/POST /api/admin/versions', () => {
    it('без version → 400', async () => {
      const res = await request(app)
        .post('/api/admin/versions')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Версия');
    });

    it('публикация: isLatest снимает флаг у предыдущей', async () => {
      const v1 = await request(app)
        .post('/api/admin/versions')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ version: `9.9.${Date.now() % 1000}`, changelog: 'first', isLatest: true });
      expect(v1.status).toBe(201);
      const v2 = await request(app)
        .post('/api/admin/versions')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .send({ version: `9.9.${(Date.now() + 1) % 1000}`, changelog: 'second' });
      expect(v2.status).toBe(201);
      expect(v2.body.isLatest).toBe(true);
      const first = await prisma.serviceVersion.findUnique({ where: { version: v1.body.version } });
      expect(first!.isLatest).toBe(false);
      const log = await prisma.auditLog.findFirst({ where: { action: 'PUBLISH_VERSION', target: v2.body.id } });
      expect(log).toBeTruthy();
    });

    it('список версий с take 50', async () => {
      const res = await request(app)
        .get('/api/admin/versions')
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.versions.length).toBeLessThanOrEqual(50);
    });
  });

  describe('GET /api/admin/metrics', () => {
    it('summary содержит 8 счётчиков', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      const s = res.body.summary;
      for (const k of ['totalUsers', 'activeUsers', 'totalChats', 'totalMessages', 'totalReports', 'openReports', 'totalBans', 'activeBans']) {
        expect(s).toHaveProperty(k);
        expect(typeof s[k]).toBe('number');
      }
      expect(res.body).toHaveProperty('recentMetrics');
    });
  });

  describe('GET /api/admin/audit-logs', () => {
    it('фильтры action/adminId/target + пагинация', async () => {
      const res = await request(app)
        .get(`/api/admin/audit-logs?action=BAN_USER&adminId=${admin.id}&limit=10&page=1`)
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      for (const l of res.body.logs) expect(l.action).toBe('BAN_USER');
      expect(res.body).toHaveProperty('pagination');
      // include admin
      if (res.body.logs.length > 0) expect(res.body.logs[0].admin).toBeTruthy();
    });

    it('фильтр target', async () => {
      const res = await request(app)
        .get(`/api/admin/audit-logs?target=no-such-target-xyz`)
        .set('Authorization', `Bearer ${admin.adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });
  });
});
/**
 * Тесты APK self-update pipeline (тикеты 1791927977).
 *
 * Покрывает:
 *  - POST /api/downloads/upload-mobile-file: 401/403, отсутствие файла,
 *    невалидные version/versionCode/arch/format, успех (файл на диске в
 *    DOWNLOADS_DIR/android с каноническим именем, sha256+size в БД,
 *    versionCode, canonical URL);
 *  - GET /api/downloads/android/latest: 404 пусто / 200 по versionCode desc /
 *    400 невалидный arch;
 *  - статика /downloads: 200 c apk mime + attachment, листинг каталога 404.
 *
 * Тестовые записи — версия с префиксом 9.8. (не пересекается с 9.9. из
 * download-controller-depth.test.ts). beforeAll чистит platform
 * android-apk-universal/arm64-v8a полностью: latest ищет по всей таблице,
 * и посторонняя запись с бо́льшим versionCode сделала бы тест нестабильным.
 */
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { app, registerTestUser, generateToken } from './helpers';
import { PrismaClient } from '@prisma/client';
import { paths } from '../config/paths';
import { env } from '../config/env';

const prisma = new PrismaClient();

// Фейковый APK: содержимое сервер не интерпретирует, считает только sha256/size
const APK_BUF = Buffer.concat([Buffer.from('PK\x03\x04fake-apk-'), Buffer.alloc(4096, 0x42)]);
const APK_SHA256 = crypto.createHash('sha256').update(APK_BUF).digest('hex');

const downloadsDir = paths.downloads;

async function createAdmin() {
  const user = await registerTestUser();
  await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } });
  return { ...user, adminToken: generateToken(user.id, user.email, user.username, 'admin') };
}

let admin: Awaited<ReturnType<typeof createAdmin>>;

describe('APK self-update pipeline (1791927977)', () => {
  beforeAll(async () => {
    admin = await createAdmin();
    await prisma.downloadFile.deleteMany({ where: { version: { startsWith: '9.8.' } } });
    // latest выбирает MAX по всей таблице — убираем записи своих platform,
    // чтобы остаточные данные не влияли на «versionCode desc»
    await prisma.downloadFile.deleteMany({
      where: { platform: { in: ['android-apk-universal', 'android-apk-arm64-v8a'] } },
    });
  });

  afterAll(async () => {
    await prisma.downloadFile.deleteMany({ where: { version: { startsWith: '9.8.' } } });
    // файлы теста из DOWNLOADS_DIR
    const dir = path.join(downloadsDir, 'android');
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        if (f.includes('9.8.')) fs.rmSync(path.join(dir, f));
      }
    }
    await prisma.$disconnect();
  });

  describe('POST /api/downloads/upload-mobile-file', () => {
    it('без auth → 401', async () => {
      const res = await request(app)
        .post('/api/downloads/upload-mobile-file')
        .attach('file', APK_BUF, 'app-release.apk');
      expect(res.status).toBe(401);
    });

    it('не-админ → 403', async () => {
      const user = await registerTestUser();
      const res = await request(app)
        .post('/api/downloads/upload-mobile-file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', APK_BUF, 'app-release.apk')
        .field('version', '9.8.1')
        .field('versionCode', '90801');
      expect(res.status).toBe(403);
    });

    it('без поля file → 400', async () => {
      const res = await request(app)
        .post('/api/downloads/upload-mobile-file')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .field('version', '9.8.1')
        .field('versionCode', '90801');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('file');
    });

    it('не-semver version → 400', async () => {
      const res = await request(app)
        .post('/api/downloads/upload-mobile-file')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .attach('file', APK_BUF, 'app-release.apk')
        .field('version', 'v9.8')
        .field('versionCode', '90801');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('version');
    });

    it('versionCode не-целое → 400', async () => {
      const res = await request(app)
        .post('/api/downloads/upload-mobile-file')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .attach('file', APK_BUF, 'app-release.apk')
        .field('version', '9.8.1')
        .field('versionCode', 'abc');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('versionCode');
    });

    it('невалидный arch → 400', async () => {
      const res = await request(app)
        .post('/api/downloads/upload-mobile-file')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .attach('file', APK_BUF, 'app-release.apk')
        .field('version', '9.8.1')
        .field('versionCode', '90801')
        .field('arch', 'mips');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('arch');
    });

    it('файл не .apk/.aab → 400 (fileFilter)', async () => {
      const res = await request(app)
        .post('/api/downloads/upload-mobile-file')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .attach('file', Buffer.from('not an apk'), 'notes.txt')
        .field('version', '9.8.1')
        .field('versionCode', '90801');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('apk');
    });

    it('успех: файл на диске, sha256/size/versionCode в БД, canonical URL', async () => {
      const res = await request(app)
        .post('/api/downloads/upload-mobile-file')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .attach('file', APK_BUF, 'app-release.apk')
        .field('version', '9.8.1')
        .field('versionCode', '90801');

      expect(res.status).toBe(201);
      expect(res.body.data.platform).toBe('android-apk-universal');
      expect(res.body.data.version).toBe('9.8.1');
      expect(res.body.data.versionCode).toBe(90801);
      expect(res.body.data.checksum).toBe(APK_SHA256);
      expect(res.body.data.size).toBe(String(APK_BUF.length));
      expect(res.body.data.url).toBe(
        `${env.DOWNLOAD_BASE_URL.replace(/\/+$/, '')}/downloads/android/balloo-v9.8.1-universal.apk`,
      );

      // файл реально лежит в DOWNLOADS_DIR/android с каноническим именем
      const onDisk = path.join(downloadsDir, 'android', 'balloo-v9.8.1-universal.apk');
      expect(fs.existsSync(onDisk)).toBe(true);
      expect(fs.readFileSync(onDisk).equals(APK_BUF)).toBe(true);

      // запись в БД
      const rec = await prisma.downloadFile.findUnique({ where: { id: res.body.data.id } });
      expect(rec?.versionCode).toBe(90801);
      expect(rec?.size).toBe(BigInt(APK_BUF.length));
      expect(rec?.checksum).toBe(APK_SHA256);
    });

    it('повторная загрузка той же версии перезаписывает файл без дубля имён', async () => {
      const res = await request(app)
        .post('/api/downloads/upload-mobile-file')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .attach('file', APK_BUF, 'app-release.apk')
        .field('version', '9.8.1')
        .field('versionCode', '90801');
      expect(res.status).toBe(201);
      const dir = path.join(downloadsDir, 'android');
      const sameName = fs.readdirSync(dir).filter((f) => f === 'balloo-v9.8.1-universal.apk');
      expect(sameName.length).toBe(1);
    });
  });

  describe('GET /api/downloads/android/latest', () => {
    it('невалидный arch → 400', async () => {
      const res = await request(app).get('/api/downloads/android/latest?arch=mips');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('arch');
    });

    it('записей для arch нет → 404', async () => {
      const res = await request(app).get('/api/downloads/android/latest?arch=armeabi-v7a');
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('armeabi-v7a');
    });

    it('есть запись → 200 с version/versionCode/url', async () => {
      const res = await request(app).get('/api/downloads/android/latest');
      expect(res.status).toBe(200);
      expect(res.body.version).toBe('9.8.1');
      expect(res.body.versionCode).toBe(90801);
      expect(res.body.url).toContain('/downloads/android/balloo-v9.8.1-universal.apk');
      expect(res.body.arch).toBe('universal');
    });

    it('versionCode desc: более новая сборка становится latest', async () => {
      const up = await request(app)
        .post('/api/downloads/upload-mobile-file')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .attach('file', APK_BUF, 'app-release.apk')
        .field('version', '9.8.2')
        .field('versionCode', '90802');
      expect(up.status).toBe(201);

      const res = await request(app).get('/api/downloads/android/latest');
      expect(res.status).toBe(200);
      expect(res.body.version).toBe('9.8.2');
      expect(res.body.versionCode).toBe(90802);
    });

    it('arch=arm64-v8a изолирован от universal', async () => {
      const up = await request(app)
        .post('/api/downloads/upload-mobile-file')
        .set('Authorization', `Bearer ${admin.adminToken}`)
        .attach('file', APK_BUF, 'app-arm64-v8a-release.apk')
        .field('version', '9.8.3')
        .field('versionCode', '90803')
        .field('arch', 'arm64-v8a');
      expect(up.status).toBe(201);

      const arm = await request(app).get('/api/downloads/android/latest?arch=arm64-v8a');
      expect(arm.status).toBe(200);
      expect(arm.body.version).toBe('9.8.3');

      const uni = await request(app).get('/api/downloads/android/latest');
      expect(uni.body.version).toBe('9.8.2'); // universal не изменился
    });
  });

  describe('Статика /downloads (express.static, без листинга)', () => {
    it('GET /downloads/android/<file> → 200, apk mime, attachment', async () => {
      const res = await request(app).get('/downloads/android/balloo-v9.8.1-universal.apk');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.android.package-archive');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('balloo-v9.8.1-universal.apk');
      // supertest не буферизует бинарное тело по умолчанию — размер как доказательство
      expect(Number(res.headers['content-length'])).toBe(APK_BUF.length);
    });

    it('несуществующий файл → не 200', async () => {
      const res = await request(app).get('/downloads/android/no-such-file.apk');
      expect(res.status).not.toBe(200);
    });

    it('листинг каталога /downloads/ → не 200', async () => {
      const res = await request(app).get('/downloads/');
      expect(res.status).not.toBe(200);
    });
  });
});

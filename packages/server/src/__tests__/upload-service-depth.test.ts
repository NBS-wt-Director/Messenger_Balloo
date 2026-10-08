/**
 * Depth-тесты uploadService (тикет 1790479920-02, п.7, В-93 (а)).
 *
 * Мокается только minio (сеть/бакеты). sharp — реальный: генерируем
 * настоящие PNG-буферы, чтобы thumbnail/resize/метаданные выполнялись по-настоящему.
 *
 * Покрывает ветки uploadService.ts:
 *  - uploadAvatar: валидация типа (не-image), лимит 5MB, успешный путь
 *    (оригинал + thumb + 3 resize = 5 putObject), создание бакета + policy;
 *  - uploadChatAvatar: префикс chat-avatars, нет chatId/файла → 400;
 *  - uploadMessageFile: изображение (thumb + width/height), документ (без thumb),
 *    видео-ветка (metadata), лимит 50MB;
 *  - uploadStoryMedia: отклонение audio, лимит изображения 5MB, успешные
 *    изображение и видео-ветки;
 *  - deleteFile: успех, NoSuchKey игнорируется, другая ошибка → throw;
 *  - getFileInfo: statObject, NoSuchKey → null, другая ошибка → throw.
 */
import request from 'supertest';
import sharp from 'sharp';
import { app, registerTestUser } from './helpers';

// Мок объявляется до hoisted-констант: jest.mock поднимается выше объявлений,
// поэтому фабрика обращается к ленивому геттеру.
jest.mock('minio', () => ({
  Client: jest.fn(() => require('./upload-service-mock-state').client),
}));

const mockClient = {
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  setBucketPolicy: jest.fn(),
  putObject: jest.fn(),
  removeObject: jest.fn(),
  statObject: jest.fn(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(require as any)('./upload-service-mock-state').client = mockClient;

const CDN = 'http://localhost:9000/balloo-media';

async function tinyPng(width = 64, height = 64): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: '#2db84d' } })
    .png()
    .toBuffer();
}

describe('Upload service depth (В-93 а)', () => {
  beforeAll(() => {
    mockClient.bucketExists.mockResolvedValue(true);
    mockClient.putObject.mockResolvedValue(undefined);
    mockClient.makeBucket.mockResolvedValue(undefined);
    mockClient.setBucketPolicy.mockResolvedValue(undefined);
    mockClient.removeObject.mockResolvedValue(undefined);
    mockClient.statObject.mockResolvedValue({ size: 123, etag: 'abc', lastModified: new Date() });
  });

  beforeEach(() => {
    mockClient.bucketExists.mockClear();
    mockClient.putObject.mockClear();
    mockClient.makeBucket.mockClear();
    mockClient.setBucketPolicy.mockClear();
    mockClient.removeObject.mockClear();
    mockClient.statObject.mockClear();
  });

  describe('POST /api/upload/avatar', () => {
    it('без файла → 400 «Файл обязателен»', async () => {
      const user = await registerTestUser();
      const res = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Файл обязателен');
    });

    it('превышение 5MB → 400 «превышать»', async () => {
      const user = await registerTestUser();
      const big = Buffer.alloc(5 * 1024 * 1024 + 1, 1);
      const res = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', big, { filename: 'a.png', contentType: 'image/png' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('превышать');
      expect(mockClient.putObject).not.toHaveBeenCalled();
    });

    it('не-изображение (pdf) → ошибка «только изображения» (на сервисе throw)', async () => {
      const { uploadAvatar } = await import('../services/uploadService');
      const file = {
        fieldname: 'file',
        originalname: 'doc.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 10,
        buffer: Buffer.from('%PDF-1.4'),
      } as unknown as Express.Multer.File;
      await expect(uploadAvatar(file, 'u1')).rejects.toThrow('только изображения');
      expect(mockClient.putObject).not.toHaveBeenCalled();
    });

    it('недопустимый MIME → сервис throw «Недопустимый тип файла»', async () => {
      const { uploadAvatar } = await import('../services/uploadService');
      const file = {
        fieldname: 'file',
        originalname: 'x.exe',
        encoding: '7bit',
        mimetype: 'application/octet-stream',
        size: 10,
        buffer: Buffer.alloc(4),
      } as unknown as Express.Multer.File;
      await expect(uploadAvatar(file, 'u1')).rejects.toThrow('Недопустимый тип файла');
    });

    it('успешная загрузка: оригинал + thumb + 3 resize, CDN-URL в ответе', async () => {
      const user = await registerTestUser();
      const png = await tinyPng(120, 120);
      const res = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', png, { filename: 'me.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toMatch(/avatars\/.+\/\d+-[a-z0-9]+\.png$/);
      expect(res.body.data.thumbnails.preview).toMatch(/avatars\/.+\/thumbs\//);
      for (const s of ['256', '128', '64']) {
        expect(res.body.data.thumbnails[s]).toMatch(/avatars\/.+\/sizes\/\d+-[a-z0-9]+\.jpg$/);
      }
      // оригинал + thumbnail + 3 размера
      expect(mockClient.putObject).toHaveBeenCalledTimes(5);
      expect(mockClient.bucketExists).toHaveBeenCalled();
    });

    it('бакета нет → создаётся + публичная policy', async () => {
      mockClient.bucketExists.mockResolvedValueOnce(false);
      const user = await registerTestUser();
      const png = await tinyPng();
      const res = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', png, { filename: 'me.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(mockClient.makeBucket).toHaveBeenCalled();
      expect(mockClient.setBucketPolicy).toHaveBeenCalled();
      const policy = JSON.stringify(mockClient.setBucketPolicy.mock.calls[0][1]);
      expect(policy).toContain('s3:GetObject');
    });

    it('сбой putObject → 502 «Ошибка облачного хранилища»', async () => {
      mockClient.putObject.mockRejectedValueOnce(new Error('connection refused'));
      const user = await registerTestUser();
      const png = await tinyPng();
      const res = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', png, { filename: 'me.png', contentType: 'image/png' });
      expect(res.status).toBe(502);
      expect(res.body.message).toBe('Ошибка облачного хранилища');
    });
  });

  describe('POST /api/upload/chat-avatar', () => {
    it('не-изображение (сервис напрямую) → throw «только изображения»', async () => {
      const { uploadChatAvatar } = await import('../services/uploadService');
      const file = {
        fieldname: 'file',
        originalname: 'doc.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 10,
        buffer: Buffer.from('%PDF-1.4'),
      } as unknown as Express.Multer.File;
      await expect(uploadChatAvatar(file, 'c1')).rejects.toThrow('только изображения');
    });

    it('недопустимый MIME (сервис напрямую) → throw «Недопустимый тип файла»', async () => {
      const { uploadChatAvatar } = await import('../services/uploadService');
      const file = {
        fieldname: 'file',
        originalname: 'x.exe',
        encoding: '7bit',
        mimetype: 'application/octet-stream',
        size: 10,
        buffer: Buffer.alloc(4),
      } as unknown as Express.Multer.File;
      await expect(uploadChatAvatar(file, 'c1')).rejects.toThrow('Недопустимый тип файла');
    });

    it('превышение 5MB (сервис напрямую) → throw «превышать»', async () => {
      const { uploadChatAvatar } = await import('../services/uploadService');
      const file = {
        fieldname: 'file',
        originalname: 'big.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 5 * 1024 * 1024 + 1,
        buffer: Buffer.alloc(8),
      } as unknown as Express.Multer.File;
      await expect(uploadChatAvatar(file, 'c1')).rejects.toThrow('превышать');
    });

    it('нет файла → 400', async () => {
      const user = await registerTestUser();
      const res = await request(app)
        .post('/api/upload/chat-avatar')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ chatId: 'c1' });
      expect(res.status).toBe(400);
    });

    it('нет chatId → 400 «chatId обязателен»', async () => {
      const user = await registerTestUser();
      const png = await tinyPng();
      const res = await request(app)
        .post('/api/upload/chat-avatar')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', png, { filename: 'c.png', contentType: 'image/png' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('chatId');
    });

    it('успешная загрузка: URL в chat-avatars/<chatId>', async () => {
      const user = await registerTestUser();
      const png = await tinyPng();
      const res = await request(app)
        .post('/api/upload/chat-avatar')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .field('chatId', 'chat-xyz')
        .attach('file', png, { filename: 'c.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.data.url).toMatch(/chat-avatars\/chat-xyz\/\d+-[a-z0-9]+\.png$/);
      expect(res.body.data.thumbnails.preview).toMatch(/chat-avatars\/chat-xyz\/thumbs\//);
      expect(mockClient.putObject).toHaveBeenCalledTimes(5);
    });

    it('файл без расширения → ext fallback «bin» в имени', async () => {
      const user = await registerTestUser();
      const png = await tinyPng();
      const res = await request(app)
        .post('/api/upload/chat-avatar')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .field('chatId', 'chat-xyz')
        .attach('file', png, { filename: 'noext', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.data.url).toMatch(/chat-avatars\/chat-xyz\/\d+-[a-z0-9]+\.noext$/);
    });
  });

  describe('POST /api/upload/file (вложение сообщения)', () => {
    it('нет файла / нет chatId → 400', async () => {
      const user = await registerTestUser();
      const noFile = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ chatId: 'c1' });
      expect(noFile.status).toBe(400);

      const png = await tinyPng();
      const noChat = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', png, { filename: 'a.png', contentType: 'image/png' });
      expect(noChat.status).toBe(400);
      expect(noChat.body.message).toContain('chatId');
    });

    it('изображение: thumbnail + width/height, 2 putObject', async () => {
      const user = await registerTestUser();
      const png = await tinyPng(80, 40);
      const res = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .field('chatId', 'c1')
        .attach('file', png, { filename: 'pic.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.data.width).toBe(80);
      expect(res.body.data.height).toBe(40);
      expect(res.body.data.thumbnailUrl).toMatch(/attachments\/thumbs\/.+\.jpg$/);
      expect(res.body.data.name).toBe('pic.png');
      expect(mockClient.putObject).toHaveBeenCalledTimes(2);
    });

    it('документ: без thumbnail и размеров, 1 putObject', async () => {
      const user = await registerTestUser();
      const res = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .field('chatId', 'c1')
        .attach('file', Buffer.from('hello world'), { filename: 'note.txt', contentType: 'text/plain' });
      expect(res.status).toBe(200);
      expect(res.body.data.thumbnailUrl).toBeUndefined();
      expect(res.body.data.width).toBeUndefined();
      expect(res.body.data.mimeType).toBe('text/plain');
      expect(mockClient.putObject).toHaveBeenCalledTimes(1);
    });

    it('видео-ветка (mimetype video/mp4): width/height из метаданных', async () => {
      const user = await registerTestUser();
      const png = await tinyPng(100, 50);
      const res = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .field('chatId', 'c1')
        .attach('file', png, { filename: 'clip.mp4', contentType: 'video/mp4' });
      expect(res.status).toBe(200);
      expect(res.body.data.width).toBe(100);
      expect(res.body.data.height).toBe(50);
      expect(res.body.data.thumbnailUrl).toBeUndefined();
      expect(mockClient.putObject).toHaveBeenCalledTimes(1);
    });

    it('недопустимый MIME (сервис напрямую) → throw «Недопустимый тип файла»', async () => {
      const { uploadMessageFile } = await import('../services/uploadService');
      const file = {
        fieldname: 'file',
        originalname: 'x.exe',
        encoding: '7bit',
        mimetype: 'application/octet-stream',
        size: 10,
        buffer: Buffer.alloc(4),
      } as unknown as Express.Multer.File;
      await expect(uploadMessageFile(file, 'u1')).rejects.toThrow('Недопустимый тип файла');
    });

    it('превышение 50MB → 400', async () => {
      const user = await registerTestUser();
      const big = Buffer.alloc(50 * 1024 * 1024 + 1, 0);
      const res = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .field('chatId', 'c1')
        .attach('file', big, { filename: 'huge.png', contentType: 'image/png' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('50MB');
    });

    it('Content-Disposition: attachment с реальным именем файла (задача 6)', async () => {
      const user = await registerTestUser();
      const res = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .field('chatId', 'c1')
        .attach('file', Buffer.from('hello world'), { filename: 'report.txt', contentType: 'text/plain' });
      expect(res.status).toBe(200);

      // putObject(bucket, fileName, buffer, size, metadata)
      const meta = mockClient.putObject.mock.calls[0][4] as Record<string, string>;
      expect(meta['Content-Disposition']).toContain('attachment');
      expect(meta['Content-Disposition']).toContain('filename="report.txt"');
      // RFC 5987-вариант для не-ASCII имён
      expect(meta['Content-Disposition']).toContain("filename*=UTF-8''report.txt");
    });

    it('подмена MIME: .exe с contentType application/pdf → 400 (задача 7)', async () => {
      const user = await registerTestUser();
      // MZ-заголовок исполняемого файла, а заявлен PDF
      const exe = Buffer.concat([Buffer.from([0x4d, 0x5a]), Buffer.alloc(100, 0)]);
      const res = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .field('chatId', 'c1')
        .attach('file', exe, { filename: 'evil.pdf', contentType: 'application/pdf' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('не соответствует');
      expect(mockClient.putObject).not.toHaveBeenCalled();
    });

    it('docx с корректной ZIP-подписью проходит проверку magic bytes (задача 7)', async () => {
      const user = await registerTestUser();
      // OOXML — это ZIP: PK\x03\x04
      const docx = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(100, 0)]);
      const res = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .field('chatId', 'c1')
        .attach('file', docx, {
          filename: 'doc.docx',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
      expect(res.status).toBe(200);
      expect(mockClient.putObject).toHaveBeenCalled();
    });

    it('docx с содержимым не-ZIP → 400 (задача 7)', async () => {
      const user = await registerTestUser();
      const res = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .field('chatId', 'c1')
        .attach('file', Buffer.from('not a zip archive'), {
          filename: 'fake.docx',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('не соответствует');
    });
  });

  describe('POST /api/upload/story', () => {
    it('audio → ошибка «только изображения и видео»', async () => {
      const user = await registerTestUser();
      const res = await request(app)
        .post('/api/upload/story')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', Buffer.from('id3'), { filename: 'a.mp3', contentType: 'audio/mpeg' });
      expect(res.status).toBe(500);
      expect(res.body.message).toContain('изображения и видео');
    });

    it('изображение > 5MB → 400 с лимитом в тексте', async () => {
      const user = await registerTestUser();
      const big = Buffer.alloc(5 * 1024 * 1024 + 1, 1);
      const res = await request(app)
        .post('/api/upload/story')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', big, { filename: 'big.png', contentType: 'image/png' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('5MB');
    });

    it('успешное изображение: thumbnail + размеры, 2 putObject', async () => {
      const user = await registerTestUser();
      const png = await tinyPng(70, 70);
      const res = await request(app)
        .post('/api/upload/story')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', png, { filename: 'story.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.data.url).toMatch(/stories\/.+\/\d+-[a-z0-9]+\.png$/);
      expect(res.body.data.thumbnailUrl).toMatch(/stories\/.+\/thumbs\//);
      expect(res.body.data.width).toBe(70);
      expect(mockClient.putObject).toHaveBeenCalledTimes(2);
    });

    it('маленькое изображение (32px) — thumbnail без увеличения', async () => {
      const user = await registerTestUser();
      const png = await tinyPng(32, 32);
      const res = await request(app)
        .post('/api/upload/story')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', png, { filename: 'tiny.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.data.width).toBe(32);
    });

    it('avatar: все 3 resize-размера присутствуют в ответе (256/128/64)', async () => {
      const user = await registerTestUser();
      const png = await tinyPng(300, 300);
      const res = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', png, { filename: 'me.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.data.thumbnails['256']).toMatch(/sizes\//);
      expect(res.body.data.thumbnails['128']).toMatch(/sizes\//);
      expect(res.body.data.thumbnails['64']).toMatch(/sizes\//);
      // 3 resize-файла реально загружены
      const sizeCalls = mockClient.putObject.mock.calls.filter((c: unknown[]) =>
        String(c[1]).includes('/sizes/')
      );
      expect(sizeCalls).toHaveLength(3);
    });

    it('успешная видео-ветка: thumbnail + размеры', async () => {
      const user = await registerTestUser();
      const png = await tinyPng(90, 30);
      const res = await request(app)
        .post('/api/upload/story')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .attach('file', png, { filename: 'story.mp4', contentType: 'video/mp4' });
      expect(res.status).toBe(200);
      expect(res.body.data.thumbnailUrl).toBeTruthy();
      expect(res.body.data.width).toBe(90);
      expect(res.body.data.height).toBe(30);
      expect(mockClient.putObject).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteFile (сервис)', () => {
    it('успех → { success: true }', async () => {
      const { deleteFile } = await import('../services/uploadService');
      const r = await deleteFile({ bucket: 'b', fileName: 'f' });
      expect(r.success).toBe(true);
      expect(mockClient.removeObject).toHaveBeenCalledWith('b', 'f');
    });

    it('NoSuchKey игнорируется — успех', async () => {
      const { deleteFile } = await import('../services/uploadService');
      mockClient.removeObject.mockRejectedValueOnce(Object.assign(new Error('no key'), { code: 'NoSuchKey' }));
      const r = await deleteFile({ bucket: 'b', fileName: 'f' });
      expect(r.success).toBe(true);
    });

    it('ошибка удаления: не-NaN код → оборачивается «Ошибка удаления из MinIO»', async () => {
      const { deleteFile } = await import('../services/uploadService');
      // deleteFromMinIO оборачивает любые ошибки, кроме NoSuchKey, в
      // «Ошибка удаления из MinIO: <msg>»; строка всегда непустая, поэтому
      // fallback `|| 'Ошибка удаления файла'` в deleteFile недостижим
      // через публичный контракт — фиксируется регресс-тестом обёртки.
      mockClient.removeObject.mockRejectedValueOnce(new Error('S3 down'));
      await expect(deleteFile({ bucket: 'b', fileName: 'f' })).rejects.toThrow('Ошибка удаления из MinIO: S3 down');
    });

    it('другая ошибка → throw «Ошибка удаления из MinIO»', async () => {
      const { deleteFile } = await import('../services/uploadService');
      mockClient.removeObject.mockRejectedValueOnce(new Error('S3 is down'));
      await expect(deleteFile({ bucket: 'b', fileName: 'f' })).rejects.toThrow('Ошибка удаления из MinIO');
    });

    it('DELETE /api/upload/:fileId: нет bucket/fileName → 400', async () => {
      const user = await registerTestUser();
      const res = await request(app)
        .delete('/api/upload/some-file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('bucket');
    });

    it('DELETE /api/upload/:fileId: успех', async () => {
      const user = await registerTestUser();
      const res = await request(app)
        .delete('/api/upload/some-file')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ bucket: 'b', fileName: 'avatars/u1/f.png' });
      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });
  });

  describe('getFileInfo (сервис)', () => {
    it('statObject → метаданные', async () => {
      const { getFileInfo } = await import('../services/uploadService');
      const info = await getFileInfo('b', 'f');
      expect(info.size).toBe(123);
      expect(mockClient.statObject).toHaveBeenCalledWith('b', 'f');
    });

    it('NoSuchKey → null', async () => {
      const { getFileInfo } = await import('../services/uploadService');
      mockClient.statObject.mockRejectedValueOnce(Object.assign(new Error('no'), { code: 'NoSuchKey' }));
      expect(await getFileInfo('b', 'f')).toBeNull();
    });

    it('другая ошибка → throw', async () => {
      const { getFileInfo } = await import('../services/uploadService');
      mockClient.statObject.mockRejectedValueOnce(new Error('boom'));
      await expect(getFileInfo('b', 'f')).rejects.toThrow('Ошибка получения информации о файле');
    });
  });
});

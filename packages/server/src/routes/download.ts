import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { authRequired, adminOnly } from '../middleware/auth';
import { paths } from '../config/paths';
import {
  uploadMobile,
  uploadMobileFile,
  getAndroidLatest,
  listAndroidDownloads,
  getAndroidArchPackage,
  listIosDownloads,
  uploadDesktop,
  listDesktopDownloads,
  getDesktopPlatformPackages,
  getDesktopPlatformFormat,
  getDownloads,
  getPlatformDownloads,
  getDownloadUrl,
  recordDownload,
} from '../controllers/downloadController';

const router = Router() as import('express').Router;

// ============================================================
// Загрузка APK/AAB файлов (тикеты 1791927977): multer diskStorage пишет
// во временное имя в DOWNLOADS_DIR/android, контроллер переименовывает
// в каноническое balloo-v<version>-<arch>.<ext>.
// ============================================================
const mobileFileUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(paths.downloads, 'android');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() === '.aab' ? '.aab' : '.apk';
      cb(null, `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 }, // APK до 200 МБ
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ext === '.apk' || ext === '.aab') {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только файлы .apk и .aab'));
    }
  },
});

// Ошибки multer (размер/тип) превращаем в понятный 4xx, а не 500
const uploadMobileFileMw = (req: Request, res: Response, next: NextFunction) => {
  mobileFileUpload.single('file')(req, res, (err?: any) => {
    if (err) {
      const tooBig = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE';
      res.status(tooBig ? 413 : 400).json({
        error: tooBig ? 'Payload Too Large' : 'Bad Request',
        message: err.message,
      });
      return;
    }
    next();
  });
};

// Admin-only: загрузить артефакт мобильной сборки
router.post('/upload-mobile', authRequired, adminOnly, uploadMobile);

// Admin-only: загрузить сам файл APK/AAB (multipart) — запись в БД + раздача
router.post('/upload-mobile-file', authRequired, adminOnly, uploadMobileFileMw, uploadMobileFile);

// Admin-only: загрузить артефакт Desktop сборки
router.post('/upload-desktop', authRequired, adminOnly, uploadDesktop);

// Публичные: общий список и конкретные платформы (регистрируем специфичные раньше)
router.get('/', getDownloads);
router.get('/desktop', listDesktopDownloads);
router.get('/desktop/:platform', getDesktopPlatformPackages);
router.get('/desktop/:platform/:format', getDesktopPlatformFormat);
router.get('/android', listAndroidDownloads);
// latest — раньше /android/:arch, иначе "latest" уйдёт в :arch и получит 400
router.get('/android/latest', getAndroidLatest);
router.get('/android/:arch', getAndroidArchPackage);
router.get('/ios', listIosDownloads);

// Мобильные пакеты по платформе (android/ios) — после специфичных маршрутов
router.get('/:platform', getPlatformDownloads);

// Получить ссылку и записать статистику
router.get('/:id/url', getDownloadUrl);
router.post('/:id/download', recordDownload);

export { router };

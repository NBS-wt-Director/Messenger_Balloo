import { Router } from 'express';
import { authRequired, adminOnly } from '../middleware/auth';
import {
  uploadMobile,
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

// Admin-only: загрузить артефакт мобильной сборки
router.post('/upload-mobile', authRequired, adminOnly, uploadMobile);

// Admin-only: загрузить артефакт Desktop сборки
router.post('/upload-desktop', authRequired, adminOnly, uploadDesktop);

// Публичные: общий список и конкретные платформы (регистрируем специфичные раньше)
router.get('/', getDownloads);
router.get('/desktop', listDesktopDownloads);
router.get('/desktop/:platform', getDesktopPlatformPackages);
router.get('/desktop/:platform/:format', getDesktopPlatformFormat);
router.get('/android', listAndroidDownloads);
router.get('/android/:arch', getAndroidArchPackage);
router.get('/ios', listIosDownloads);

// Мобильные пакеты по платформе (android/ios) — после специфичных маршрутов
router.get('/:platform', getPlatformDownloads);

// Получить ссылку и записать статистику
router.get('/:id/url', getDownloadUrl);
router.post('/:id/download', recordDownload);

export { router };

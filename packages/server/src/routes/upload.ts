import { Router } from 'express';
import multer from 'multer';
import {
  uploadAvatar,
  uploadChatAvatar,
  uploadMessageFile,
  uploadStoryMedia,
  deleteFileEndpoint,
} from '../controllers/uploadController';
import { authRequired } from '../middleware/auth';

const router = Router() as import('express').Router;

// ============================================================
// Multer storage — храним в памяти (buffer), т.к. уже есть буфер в сервисе
// ============================================================

const storage = multer.memoryStorage();

// Limits
const limits = {
  fileSize: 100 * 1024 * 1024, // 100MB — максимум для историй
};

// File filter — разрешённые типы
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    // Изображения
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    // Видео
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // Аудио
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    // Документы
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Недопустимый тип файла: ${file.mimetype}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

// ============================================================
// POST /api/upload/avatar — аватарка пользователя
// ============================================================
router.post(
  '/avatar',
  authRequired,
  upload.single('file'),
  uploadAvatar
);

// ============================================================
// POST /api/upload/chat-avatar — аватарка чата
// ============================================================
router.post(
  '/chat-avatar',
  authRequired,
  upload.single('file'),
  uploadChatAvatar
);

// ============================================================
// POST /api/upload/file — вложение в сообщение
// ============================================================
router.post(
  '/file',
  authRequired,
  upload.single('file'),
  uploadMessageFile
);

// ============================================================
// POST /api/upload/story — медиа для истории
// ============================================================
router.post(
  '/story',
  authRequired,
  upload.single('file'),
  uploadStoryMedia
);

// ============================================================
// DELETE /api/upload/:fileId — удаление файла
// ============================================================
router.delete(
  '/:fileId',
  authRequired,
  deleteFileEndpoint
);

export { router };

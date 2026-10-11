import { Request, Response, NextFunction } from 'express';
import {
  uploadAvatar as uploadAvatarService,
  uploadChatAvatar as uploadChatAvatarService,
  uploadMessageFile as uploadMessageFileService,
  uploadStoryMedia as uploadStoryMediaService,
  deleteFile as deleteFileService,
} from '../services/uploadService';
import { AuthenticatedRequest } from '../middleware/auth';
import { internalError } from '../middleware/errorHandler';

// ============================================================
// Загрузить аватарку пользователя (POST /api/upload/avatar)
// ============================================================

export const uploadAvatar = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'Bad Request', message: 'Файл обязателен' });
      return;
    }

    const result = await uploadAvatarService(file, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (
      error.message.includes('недопустимый тип') ||
      error.message.includes('превышать') ||
      // magic bytes не совпали с заявленным MIME — это ошибка клиента, не 500
      error.message.includes('не соответствует')
    ) {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else if (error.message.includes('MinIO')) {
      res.status(502).json({ error: 'Bad Gateway', message: 'Ошибка облачного хранилища' });
    } else {
      internalError(res, error, 'uploadController.uploadAvatar');
    }
  }
};

// ============================================================
// Загрузить аватарку чата (POST /api/upload/chat-avatar)
// ============================================================

export const uploadChatAvatar = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { chatId } = req.body;

    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'Bad Request', message: 'Файл обязателен' });
      return;
    }

    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'chatId обязателен' });
      return;
    }

    // Проверка прав: пользователь должен быть owner/admin чата
    // Для простоты — пока пропускаем, в будущем добавить проверку в сервисе
    const result = await uploadChatAvatarService(file, chatId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (
      error.message.includes('недопустимый тип') ||
      error.message.includes('превышать') ||
      // magic bytes не совпали с заявленным MIME — это ошибка клиента, не 500
      error.message.includes('не соответствует')
    ) {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else if (error.message.includes('MinIO')) {
      res.status(502).json({ error: 'Bad Gateway', message: 'Ошибка облачного хранилища' });
    } else {
      internalError(res, error, 'uploadController.uploadChatAvatar');
    }
  }
};

// ============================================================
// Загрузить вложение в сообщение (POST /api/upload/file)
// ============================================================

export const uploadMessageFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { chatId } = req.body;

    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'Bad Request', message: 'Файл обязателен' });
      return;
    }

    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'chatId обязателен' });
      return;
    }

    const result = await uploadMessageFileService(file, userId);

    res.json({
      success: true,
      data: {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        name: result.name,
        size: result.size,
        mimeType: result.mimeType,
        width: result.width,
        height: result.height,
        duration: result.duration,
      },
    });
  } catch (error: any) {
    if (
      error.message.includes('недопустимый тип') ||
      error.message.includes('превышать') ||
      // magic bytes не совпали с заявленным MIME — это ошибка клиента, не 500
      error.message.includes('не соответствует')
    ) {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else if (error.message.includes('MinIO')) {
      res.status(502).json({ error: 'Bad Gateway', message: 'Ошибка облачного хранилища' });
    } else {
      internalError(res, error, 'uploadController.uploadMessageFile');
    }
  }
};

// ============================================================
// Загрузить медиа для истории (POST /api/upload/story)
// ============================================================

export const uploadStoryMedia = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'Bad Request', message: 'Файл обязателен' });
      return;
    }

    const result = await uploadStoryMediaService(file, userId);

    res.json({
      success: true,
      data: {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        name: result.name,
        size: result.size,
        mimeType: result.mimeType,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error: any) {
    if (
      error.message.includes('недопустимый тип') ||
      error.message.includes('превышать') ||
      // magic bytes не совпали с заявленным MIME — это ошибка клиента, не 500
      error.message.includes('не соответствует') ||
      // валидация типа для историй (uploadService) — тоже ошибка клиента
      error.message.includes('только изображения и видео')
    ) {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else if (error.message.includes('MinIO')) {
      res.status(502).json({ error: 'Bad Gateway', message: 'Ошибка облачного хранилища' });
    } else {
      internalError(res, error, 'uploadController.uploadStoryMedia');
    }
  }
};

// ============================================================
// Удалить файл (DELETE /api/upload/:fileId)
// ============================================================

export const deleteFileEndpoint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { fileId } = req.params;
    const { bucket, fileName } = req.body;

    if (!bucket || !fileName) {
      res.status(400).json({ error: 'Bad Request', message: 'Необходимы параметры bucket и fileName' });
      return;
    }

    const result = await deleteFileService({ bucket, fileName });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message.includes('удаления')) {
      internalError(res, error, 'uploadController.deleteFileEndpoint');
    } else {
      internalError(res, error, 'uploadController.deleteFileEndpoint');
    }
  }
};

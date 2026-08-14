import { Request, Response, NextFunction } from 'express';
import {
  sendMessage as sendMessageService,
  getMessages as getMessagesService,
  updateMessage as updateMessageService,
  deleteMessage as deleteMessageService,
  addReaction as addReactionService,
  removeReaction as removeReactionService,
  getReactions as getReactionsService,
  markAsRead as markAsReadService,
  getReadStatus as getReadStatusService,
  pinMessage as pinMessageService,
  searchMessages as searchMessagesService,
} from '../services/messageService';
import { AuthenticatedRequest } from '../middleware/auth';

// ============================================================
// POST /api/chats/:chatId/messages — отправка сообщения
// ============================================================

export const sendMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { chatId } = req.params;
    const { type, content, replyToId, attachments } = req.body;

    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }

    if (!type || !['text', 'image', 'file', 'voice', 'video', 'poll', 'system'].includes(type)) {
      res.status(400).json({ error: 'Bad Request', message: 'Поле type обязательно (text, image, file, voice, video, poll, system)' });
      return;
    }

    const data = await sendMessageService(userId, {
      chatId,
      type: type as any,
      content: content || undefined,
      replyToId: replyToId || undefined,
      attachments: attachments || undefined,
    });

    res.status(201).json(data);
  } catch (error: any) {
    if (error.message.includes('не являетесь участником')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else if (error.message.includes('не найдено')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message.includes('заблокировали уведомления')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// GET /api/chats/:chatId/messages — история сообщений
// ============================================================

export const getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { cursor, limit, before, after, search } = req.query;

    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }

    const data = await getMessagesService({
      chatId,
      cursor: cursor as string | undefined,
      limit: parseInt(String(limit), 10) || 50,
      before: before ? BigInt(parseInt(String(before), 10)) : undefined,
      after: after ? BigInt(parseInt(String(after), 10)) : undefined,
      search: search as string | undefined,
    });

    res.json(data);
  } catch (error: any) {
    if (error.message.includes('не найден')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// PUT /api/messages/:id — редактирование сообщения
// ============================================================

export const updateMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: messageId } = req.params;
    const { content } = req.body;

    if (!messageId) {
      res.status(400).json({ error: 'Bad Request', message: 'Message ID обязателен' });
      return;
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Поле content обязательно' });
      return;
    }

    const data = await updateMessageService(userId, messageId, { content: content.trim() });
    res.json(data);
  } catch (error: any) {
    if (error.message.includes('не найдено')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message.includes('Доступ запрещён')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// DELETE /api/messages/:id — удаление сообщения
// ============================================================

export const deleteMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: messageId } = req.params;

    if (!messageId) {
      res.status(400).json({ error: 'Bad Request', message: 'Message ID обязателен' });
      return;
    }

    const data = await deleteMessageService(userId, messageId);
    res.json(data);
  } catch (error: any) {
    if (error.message.includes('не найдено')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message.includes('Доступ запрещён')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// POST /api/messages/:id/reactions — реакция на сообщение
// ============================================================

export const addReaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: messageId } = req.params;
    const { emoji } = req.body;

    if (!messageId) {
      res.status(400).json({ error: 'Bad Request', message: 'Message ID обязателен' });
      return;
    }

    if (!emoji || typeof emoji !== 'string' || emoji.trim().length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Поле emoji обязательно' });
      return;
    }

    const data = await addReactionService(userId, messageId, emoji.trim());
    res.status(201).json(data);
  } catch (error: any) {
    if (error.message.includes('не найдено')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// DELETE /api/messages/:id/reactions — удаление реакции
// ============================================================

export const removeReaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: messageId } = req.params;
    const { emoji } = req.query;

    if (!messageId) {
      res.status(400).json({ error: 'Bad Request', message: 'Message ID обязателен' });
      return;
    }

    if (!emoji || typeof emoji !== 'string' || emoji.toString().trim().length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Query параметр emoji обязателен' });
      return;
    }

    const data = await removeReactionService(userId, messageId, emoji.toString().trim());
    res.json(data);
  } catch (error: any) {
    if (error.message.includes('не найдена')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// GET /api/messages/:id/reactions — список реакций
// ============================================================

export const getReactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: messageId } = req.params;

    if (!messageId) {
      res.status(400).json({ error: 'Bad Request', message: 'Message ID обязателен' });
      return;
    }

    const data = await getReactionsService(messageId);
    res.json(data);
  } catch (error: any) {
    if (error.message.includes('не найдено')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// POST /api/messages/:id/read — отметить как прочитанное
// ============================================================

export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: messageId } = req.params;

    if (!messageId) {
      res.status(400).json({ error: 'Bad Request', message: 'Message ID обязателен' });
      return;
    }

    const data = await markAsReadService(userId, messageId);
    res.json(data);
  } catch (error: any) {
    if (error.message.includes('не найдено')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// GET /api/messages/:id/read — статус прочтения
// ============================================================

export const getReadStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: messageId } = req.params;

    if (!messageId) {
      res.status(400).json({ error: 'Bad Request', message: 'Message ID обязателен' });
      return;
    }

    const data = await getReadStatusService(messageId);
    res.json(data);
  } catch (error: any) {
    if (error.message.includes('не найдено')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// POST /api/messages/:id/pin — закрепление сообщения
// ============================================================

export const pinMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: messageId } = req.params;

    if (!messageId) {
      res.status(400).json({ error: 'Bad Request', message: 'Message ID обязателен' });
      return;
    }

    const data = await pinMessageService(userId, messageId);
    res.json(data);
  } catch (error: any) {
    if (error.message.includes('не найдено')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message.includes('Доступ запрещён')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// GET /api/chats/:chatId/messages/search — поиск по сообщениям
// ============================================================

export const searchMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { q, limit } = req.query;

    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Query параметр q обязателен' });
      return;
    }

    const data = await searchMessagesService(chatId, q, parseInt(String(limit), 10) || 20);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// supportController.ts — Контроллер чата с техподдержкой (тикет 1790572800-01)
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  getChat,
  sendMessage,
  getStatus,
  listTickets,
  getTicketForAdmin,
  replyAsAdmin,
} from '../services/supportService';

function sendError(res: Response, error: any): void {
  switch (error?.message) {
    case 'EMPTY_MESSAGE':
      res.status(400).json({ error: 'Bad Request', message: 'Текст сообщения пуст' });
      return;
    case 'MESSAGE_TOO_LONG':
      res.status(400).json({ error: 'Bad Request', message: 'Сообщение слишком длинное (макс. 5000)' });
      return;
    case 'TICKET_NOT_FOUND':
      res.status(404).json({ error: 'Not Found', message: 'Тикет не найден' });
      return;
    default:
      res.status(500).json({ error: 'Internal Error', message: error?.message ?? 'Ошибка сервера' });
  }
}

// GET /api/support/chat — история чата поддержки (создаёт тикет при первом обращении)
export const getChatCtrl = async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    res.json(await getChat(userId));
  } catch (error: any) {
    sendError(res, error);
  }
};

// POST /api/support/chat — отправка сообщения в поддержку
export const sendMessageCtrl = async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { text } = req.body ?? {};
    const message = await sendMessage(userId, text);
    res.status(201).json(message);
  } catch (error: any) {
    sendError(res, error);
  }
};

// GET /api/support/status — онлайн + среднее время ответа
export const getStatusCtrl = async (_req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    res.json(await getStatus());
  } catch (error: any) {
    sendError(res, error);
  }
};

// ============================================================
// Админские обработчики (ответ В-33 — страница в дашборде админки)
// ============================================================

// GET /api/admin/support/tickets — список тикетов
export const listTicketsCtrl = async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const page = parseInt(String(req.query.page ?? '1'), 10) || 1;
    const limit = parseInt(String(req.query.limit ?? '20'), 10) || 20;
    res.json(await listTickets({ status, page, limit }));
  } catch (error: any) {
    sendError(res, error);
  }
};

// GET /api/admin/support/tickets/:id — тикет с перепиской
export const getTicketCtrl = async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    res.json(await getTicketForAdmin(req.params.id));
  } catch (error: any) {
    sendError(res, error);
  }
};

// POST /api/admin/support/tickets/:id/reply — ответ администратора
export const replyCtrl = async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { text, isInternal } = req.body ?? {};
    const message = await replyAsAdmin(req.params.id, adminId, text, Boolean(isInternal));
    res.status(201).json(message);
  } catch (error: any) {
    sendError(res, error);
  }
};

// Контроллер заявок в команду Balloo (тикет 1795888510).

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { internalError } from '../middleware/errorHandler';
import {
  createTeamApplication,
  listTeamApplications,
  acceptTeamApplication,
  rejectTeamApplication,
  messageTeamApplicant,
  setUserRole,
} from '../services/teamApplicationService';

/** Ошибки сервиса, которые являются ответом клиенту, а не сбоем сервера. */
function respondServiceError(res: Response, error: any): boolean {
  const message = String(error?.message ?? '');
  if (message.includes('не найден')) {
    res.status(404).json({ error: 'Not Found', message });
    return true;
  }
  if (
    message.includes('уже') ||
    message.includes('Нельзя') ||
    message.includes('неактивен') ||
    message.includes('обязателен') ||
    message.includes('превышать') ||
    message.includes('только активный')
  ) {
    res.status(400).json({ error: 'Bad Request', message });
    return true;
  }
  return false;
}

// POST /api/team-applications — подать заявку в команду
export const submitTeamApplication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message } = req.body ?? {};
    const result = await createTeamApplication(req.user!.id, message);
    res.status(result.created ? 201 : 200).json(result.application);
  } catch (error: any) {
    if (!respondServiceError(res, error)) {
      internalError(res, error, 'teamApplicationController.submit');
    }
  }
};

// GET /api/admin/team-applications — список заявок
export const listTeamApplicationsCtrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const applications = await listTeamApplications(status);
    res.json({ applications });
  } catch (error: any) {
    if (!respondServiceError(res, error)) {
      internalError(res, error, 'teamApplicationController.list');
    }
  }
};

// POST /api/admin/team-applications/:id/accept
export const acceptTeamApplicationCtrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await acceptTeamApplication(req.params.id, req.user!.id);
    res.json(result);
  } catch (error: any) {
    if (!respondServiceError(res, error)) {
      internalError(res, error, 'teamApplicationController.accept');
    }
  }
};

// POST /api/admin/team-applications/:id/reject
export const rejectTeamApplicationCtrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await rejectTeamApplication(req.params.id, req.user!.id);
    res.json(result);
  } catch (error: any) {
    if (!respondServiceError(res, error)) {
      internalError(res, error, 'teamApplicationController.reject');
    }
  }
};

// POST /api/admin/team-applications/:id/message — написать заявителю
export const messageTeamApplicantCtrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text } = req.body ?? {};
    const message = await messageTeamApplicant(req.params.id, req.user!.id, text);
    res.status(201).json({ message });
  } catch (error: any) {
    if (!respondServiceError(res, error)) {
      internalError(res, error, 'teamApplicationController.message');
    }
  }
};

// PATCH /api/admin/users/:id/role — назначение роли (только superadmin)
export const setUserRoleCtrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role } = req.body ?? {};
    if (role !== 'admin' && role !== 'user') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Поле role должно быть admin или user',
      });
      return;
    }
    const updated = await setUserRole(req.user!.id, req.params.id, role);
    res.json(updated);
  } catch (error: any) {
    if (!respondServiceError(res, error)) {
      internalError(res, error, 'teamApplicationController.setUserRole');
    }
  }
};

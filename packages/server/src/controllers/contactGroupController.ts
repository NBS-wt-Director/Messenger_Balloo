// contactGroupController.ts — Контроллер для управления группами контактов
// Тикет 1794850879

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { internalError } from '../middleware/errorHandler';
import {
  createContactGroup,
  getContactGroups,
  getContactGroupDetail,
  updateContactGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  deleteContactGroup,
} from '../services/contactGroupService';

// ============================================================
// GET /api/users/contact-groups — список групп владельца
// ============================================================

export const listContactGroupsCtrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const groups = await getContactGroups(req.user!.id);
    res.json(groups);
  } catch (error: any) {
    internalError(res, error, 'contactGroupController.listContactGroupsCtrl');
  }
};

// ============================================================
// POST /api/users/contact-groups — создать группу
// ============================================================

export const createContactGroupCtrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, emoji, description, memberIds } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ message: 'Название группы обязательно' });
      return;
    }

    if (name.length > 60) {
      res.status(400).json({ message: 'Название не должно превышать 60 символов' });
      return;
    }

    const group = await createContactGroup(req.user!.id, {
      name: name.trim(),
      emoji: typeof emoji === 'string' ? emoji.slice(0, 8) : undefined,
      description:
        typeof description === 'string' ? description.slice(0, 200) : undefined,
      memberIds: Array.isArray(memberIds) ? memberIds : undefined,
    });

    res.status(201).json(group);
  } catch (error: any) {
    internalError(res, error, 'contactGroupController.createContactGroupCtrl');
  }
};

// ============================================================
// GET /api/users/contact-groups/:id — детальная информация
// ============================================================

export const getContactGroupCtrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const group = await getContactGroupDetail(req.params.id, req.user!.id);
    res.json(group);
  } catch (error: any) {
    if (error.message === 'Группа не найдена') {
      res.status(404).json({ message: 'Группа не найдена' });
      return;
    }
    internalError(res, error, 'contactGroupController.getContactGroupCtrl');
  }
};

// ============================================================
// PATCH /api/users/contact-groups/:id — обновить группу
// ============================================================

export const updateContactGroupCtrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, emoji, description } = req.body;
    const group = await updateContactGroup(req.params.id, req.user!.id, {
      name,
      emoji,
      description,
    });
    res.json(group);
  } catch (error: any) {
    internalError(res, error, 'contactGroupController.updateContactGroupCtrl');
  }
};

// ============================================================
// POST /api/users/contact-groups/:id/members — добавить участника
// ============================================================

export const addMemberCtrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { memberId } = req.body;
    if (!memberId || typeof memberId !== 'string') {
      res.status(400).json({ message: 'memberId обязателен' });
      return;
    }
    await addMemberToGroup(req.params.id, req.user!.id, memberId);
    res.json({ message: 'Участник добавлен' });
  } catch (error: any) {
    internalError(res, error, 'contactGroupController.addMemberCtrl');
  }
};

// ============================================================
// DELETE /api/users/contact-groups/:id/members/:memberId — удалить участника
// ============================================================

export const removeMemberCtrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await removeMemberFromGroup(req.params.id, req.user!.id, req.params.memberId);
    res.json({ message: 'Участник удалён' });
  } catch (error: any) {
    internalError(res, error, 'contactGroupController.removeMemberCtrl');
  }
};

// ============================================================
// DELETE /api/users/contact-groups/:id — удалить группу
// ============================================================

export const deleteContactGroupCtrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await deleteContactGroup(req.params.id, req.user!.id);
    res.json({ message: 'Группа удалена' });
  } catch (error: any) {
    internalError(res, error, 'contactGroupController.deleteContactGroupCtrl');
  }
};

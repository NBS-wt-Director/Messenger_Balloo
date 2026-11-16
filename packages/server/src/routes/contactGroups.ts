// contactGroups.ts — маршруты для групп контактов
// Тикет 1794850879

import { Router } from 'express';
import { authRequired } from '../middleware/auth';
import {
  listContactGroupsCtrl,
  createContactGroupCtrl,
  getContactGroupCtrl,
  updateContactGroupCtrl,
  addMemberCtrl,
  removeMemberCtrl,
  deleteContactGroupCtrl,
} from '../controllers/contactGroupController';

const router = Router() as import('express').Router;

// Все маршруты требуют аутентификации. authRequired — на каждый маршрут
// отдельно: `router.use(authRequired)` внутри этого роутера перехватывал бы
// запросы соседнего usersRouter (публичный GET /api/users/search давал 401).

// GET /api/users/contact-groups — список групп
router.get('/contact-groups', authRequired, listContactGroupsCtrl);

// POST /api/users/contact-groups — создать группу
router.post('/contact-groups', authRequired, createContactGroupCtrl);

// GET /api/users/contact-groups/:id — детальная информация
router.get('/contact-groups/:id', authRequired, getContactGroupCtrl);

// PATCH /api/users/contact-groups/:id — обновить группу
router.patch('/contact-groups/:id', authRequired, updateContactGroupCtrl);

// DELETE /api/users/contact-groups/:id — удалить группу
router.delete('/contact-groups/:id', authRequired, deleteContactGroupCtrl);

// POST /api/users/contact-groups/:id/members — добавить участника
router.post('/contact-groups/:id/members', authRequired, addMemberCtrl);

// DELETE /api/users/contact-groups/:id/members/:memberId — удалить участника
router.delete('/contact-groups/:id/members/:memberId', authRequired, removeMemberCtrl);

export { router };

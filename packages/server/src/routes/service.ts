import { Router } from 'express';
import { serviceAuth } from '../middleware/serviceAuth';
import {
  health,
  listUsers,
  createUser,
  setUserRole,
  deleteUser,
  createChat,
  deleteChat,
  createMessage,
  addAttachments,
  deleteMessage,
  createCall,
  deleteCall,
  createStory,
  deleteStory,
} from '../controllers/serviceController';

// ============================================================
// Service API — /api/service/*
//
// Все маршруты закрыты длинным ключом (serviceAuth, заголовок X-Service-Key).
// Назначение: просмотр пользователей/ролей, выдача ролей и создание
// искусственных сущностей для эмуляции и проверок.
// ============================================================

const router = Router() as import('express').Router;

// Ключ проверяется для всех маршрутов ниже
router.use(serviceAuth);

// Проверка ключа
router.get('/health', health);

// Пользователи
router.get('/users', listUsers);
router.post('/users', createUser);
router.post('/users/:id/role', setUserRole);
router.delete('/users/:id', deleteUser);

// Чаты / группы / каналы
router.post('/chats', createChat);
router.post('/groups', createChat); // то же, по умолчанию type=group
router.delete('/chats/:id', deleteChat);

// Сообщения и вложения
router.post('/messages', createMessage);
router.post('/messages/:id/attachments', addAttachments);
router.delete('/messages/:id', deleteMessage);

// Звонки (в историю)
router.post('/calls', createCall);
router.delete('/calls/:id', deleteCall);

// Истории
router.post('/stories', createStory);
router.delete('/stories/:id', deleteStory);

export { router };

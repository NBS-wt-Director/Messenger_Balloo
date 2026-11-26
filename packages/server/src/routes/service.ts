import { Router } from 'express';
import type { Request, Response } from 'express';
import { serviceAuth } from '../middleware/serviceAuth';
import { internalError } from '../middleware/errorHandler';
import { announceUpdate } from '../services/notificationService';
import {
  health,
  listUsers,
  createUser,
  setUserRole,
  deleteUser,
  createChat,
  listChats,
  getChat,
  deleteChat,
  createMessage,
  listMessages,
  addAttachments,
  deleteMessage,
  createCall,
  deleteCall,
  createStory,
  deleteStory,
  addContact,
  deleteContact,
  addMutualContacts,
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
router.get('/chats', listChats);
router.get('/chats/:id', getChat);
router.post('/chats', createChat);
router.post('/groups', createChat); // то же, по умолчанию type=group
router.delete('/chats/:id', deleteChat);

// Сообщения и вложения
router.get('/messages', listMessages);
router.post('/messages', createMessage);
router.post('/messages/:id/attachments', addAttachments);
router.delete('/messages/:id', deleteMessage);

// Звонки (в историю)
router.post('/calls', createCall);
router.delete('/calls/:id', deleteCall);

// Истории
router.post('/stories', createStory);
router.delete('/stories/:id', deleteStory);

// Контакты (эмуляция: user → contact)
router.post('/contacts/mutual', addMutualContacts);
router.post('/users/:id/contacts', addContact);
router.delete('/users/:id/contacts/:contactId', deleteContact);

// Объявление обновления всем онлайн (тик. 1795677854, шаг 7):
// показывается в морзе-тикере подвала у подключённых пользователей.
router.post('/announce-update', async (req: Request, res: Response) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    res.status(400).json({ error: 'Bad Request', message: 'Нужен text' });
    return;
  }
  try {
    const result = await announceUpdate(text);
    res.json(result);
  } catch (error) {
    internalError(res, error, 'service.announceUpdate');
  }
});

export { router };

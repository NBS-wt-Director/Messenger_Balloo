import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createChat as createChatService,
  getChats as getChatsService,
  getChatInfo as getChatInfoService,
  updateChat as updateChatService,
  deleteChat as deleteChatService,
  addMember as addMemberService,
  removeMember as removeMemberService,
  joinByInvite as joinByInviteService,
  createInviteLink as createInviteLinkService,
  leaveChat as leaveChatService,
} from '../services/chatService';
import { getChatAttachments as getChatAttachmentsService } from '../services/messageService';
import { AuthenticatedRequest } from '../middleware/auth';
import { internalError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const createChat = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type, name, description, avatarUrl, memberIds, groupType, settings, mediaCert } = req.body;
    if (!type || !['group', 'channel'].includes(type)) {
      res.status(400).json({ error: 'Bad Request', message: 'Поле type обязательно' });
      return;
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Поле name обязательно' });
      return;
    }

    // Validate media group: media type requires media certificate
    if (groupType === 'media' && !mediaCert) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Для группы типа «СМИ» обязательна заявка с свидетельством о регистрации (ст. 9 Закона РФ «О СМИ»)',
      });
      return;
    }

    const data = await createChatService(userId, {
      type: type as 'group' | 'channel',
      name: name.trim(),
      description: description || undefined,
      avatarUrl: avatarUrl || undefined,
      memberIds: memberIds || undefined,
    });

    // Update chat with groupType if provided
    if (groupType) {
      await prisma.chat.update({
        where: { id: data.id },
        data: { groupType },
      });
    }

    // Update settings with rules if provided
    if (settings?.requireRules || settings?.rules) {
      await prisma.chatSettings.upsert({
        where: { chatId: data.id },
        update: {
          requireRules: !!settings.requireRules,
          rulesText: settings.rules || null,
        },
        create: {
          chatId: data.id,
          requireRules: !!settings.requireRules,
          rulesText: settings.rules || null,
        },
      });
    }

    // Create GroupMediaRequest for media groups
    if (groupType === 'media' && mediaCert) {
      await prisma.groupMediaRequest.create({
        data: {
          groupId: data.id,
          submittedById: userId,
          certNumber: mediaCert.certNumber || null,
          certIssuedAt: mediaCert.certIssuedAt ? BigInt(mediaCert.certIssuedAt) : null,
          certIssuer: mediaCert.certIssuer || null,
          certMediaName: mediaCert.certMediaName || null,
          certFounder: mediaCert.certFounder || null,
          certInn: mediaCert.certInn || null,
          certOgrn: mediaCert.certOgrn || null,
          documents: mediaCert.documents || [],
          status: 'pending',
          createdAt: BigInt(Math.floor(Date.now() / 1000)),
          updatedAt: BigInt(Math.floor(Date.now() / 1000)),
        },
      });
    }

    res.status(201).json(data);
  } catch (error: any) {
    internalError(res, error, 'chatController.createChat');
  }
};

export const getChats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page, limit, sortBy, search } = req.query;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = Math.min(parseInt(String(limit), 10) || 20, 50);
    const validSortBy = ['lastMessage', 'name', 'unread', 'createdAt'].includes(String(sortBy)) ? String(sortBy) : 'lastMessage';
    const result = await getChatsService({ userId, page: pageNum, limit: limitNum, sortBy: validSortBy as any, search: search as string | undefined });
    res.json(result);
  } catch (error: any) {
    internalError(res, error, 'chatController.getChats');
  }
};

export const getChatInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: chatId } = req.params;
    const userId = req.user!.id;
    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }
    const data = await getChatInfoService(chatId, userId);
    res.json(data);
  } catch (error: any) {
    if (error.message === 'Чат не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      internalError(res, error, 'chatController.getChatInfo');
    }
  }
};

export const updateChat = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId } = req.params;
    const { name, description, avatarUrl } = req.body;
    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }
    if (!name && !avatarUrl) {
      res.status(400).json({ error: 'Bad Request', message: 'Передите хотя бы одно поле для обновления' });
      return;
    }
    const data = await updateChatService(chatId, userId, { name, description, avatarUrl });
    res.json(data);
  } catch (error: any) {
    if (error.message.includes('Доступ запрещён')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      internalError(res, error, 'chatController.updateChat');
    }
  }
};

export const deleteChat = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId } = req.params;
    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }
    const result = await deleteChatService(chatId, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('Доступ запрещён')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      internalError(res, error, 'chatController.deleteChat');
    }
  }
};

export const addMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId } = req.params;
    const { memberId } = req.body;
    if (!chatId || !memberId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID и member ID обязательны' });
      return;
    }
    const result = await addMemberService(chatId, userId, memberId);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('не найден')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message.includes('уже является участником')) {
      res.status(409).json({ error: 'Conflict', message: error.message });
    } else if (error.message.includes('заблокирован')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else if (error.message.includes('Доступ запрещён')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      internalError(res, error, 'chatController.addMember');
    }
  }
};

export const removeMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId, userId: memberId } = req.params;
    if (!chatId || !memberId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID и member ID обязательны' });
      return;
    }
    const result = await removeMemberService(chatId, userId, memberId);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('не найден') || error.message.includes('не является участником')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message.includes('Доступ запрещён')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      internalError(res, error, 'chatController.removeMember');
    }
  }
};

export const joinByInvite = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { code } = req.params;
    if (!code) {
      res.status(400).json({ error: 'Bad Request', message: 'Invite code обязателен' });
      return;
    }
    const inviteLinkData = await prisma.inviteLink.findFirst({ where: { code } });
    if (!inviteLinkData) {
      res.status(404).json({ error: 'Not Found', message: 'Ссылка не найдена' });
      return;
    }
    const result = await joinByInviteService(inviteLinkData.chatId, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('не найден') || error.message.includes('Ссылка не найдена')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message.includes('уже являетесь участником')) {
      res.status(409).json({ error: 'Conflict', message: error.message });
    } else if (error.message.includes('заблокированы')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      internalError(res, error, 'chatController.joinByInvite');
    }
  }
};

export const createInviteLink = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId } = req.params;
    const { maxUses, expiresAt } = req.body;
    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }
    const result = await createInviteLinkService(chatId, userId, {
      maxUses: maxUses !== undefined ? parseInt(String(maxUses), 10) || null : null,
      expiresAt: expiresAt !== undefined ? parseInt(String(expiresAt), 10) || null : null,
    });
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message.includes('не найден')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message.includes('Доступ запрещён')) {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      internalError(res, error, 'chatController.createInviteLink');
    }
  }
};

export const leaveChat = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId } = req.params;
    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }
    const result = await leaveChatService(chatId, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('не являетесь участником')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message.includes('Владелец не может выйти')) {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else {
      internalError(res, error, 'chatController.leaveChat');
    }
  }
};

// ============================================================
// GET /api/chats/:id/attachments — вложения чата
// ============================================================

export const getChatAttachments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId } = req.params;
    const type = req.query.type as string;
    const query = req.query.q as string | undefined;

    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }

    if (!type || typeof type !== 'string') {
      res.status(400).json({ error: 'Bad Request', message: 'Query параметр type обязателен' });
      return;
    }

    const attachments = await getChatAttachmentsService(chatId, userId, type, query);
    res.json(attachments);
  } catch (error: any) {
    if (error.message.includes('не являетесь участником') || error.message.includes('не найден')) {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      internalError(res, error, 'chatController.getChatAttachments');
    }
  }
};

// ============================================================
// PUT /api/chats/:id/members/:userId/role — изменить роль участника
// ============================================================

export const updateMemberRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId, userId: memberUserId } = req.params;
    const { role } = req.body;

    const validRoles = ['owner', 'admin', 'moderator', 'member'];
    if (!role || !validRoles.includes(role)) {
      res.status(400).json({ error: 'Bad Request', message: 'role должен быть: owner, admin, moderator, member' });
      return;
    }

    // Проверяем, что пользователь — участник чата
    const member = await prisma.userChat.findUnique({
      where: { userId_chatId: { userId: memberUserId, chatId } },
    });

    if (!member) {
      res.status(404).json({ error: 'Not Found', message: 'Пользователь не является участником чата' });
      return;
    }

    // Проверяем права текущего пользователя (userId) в этом чате
    const currentMember = await prisma.userChat.findUnique({
      where: { userId_chatId: { userId, chatId } },
    });

    if (!currentMember) {
      res.status(404).json({ error: 'Not Found', message: 'Вы не являетесь участником этого чата' });
      return;
    }

    if (!['owner', 'admin'].includes(currentMember.role)) {
      res.status(403).json({ error: 'Forbidden', message: 'Только владелец или админ может менять роли' });
      return;
    }

    // Owner нельзя понизить (если только сам owner не меняет)
    if (memberUserId === req.user!.id && role !== 'owner') {
      res.status(400).json({ error: 'Bad Request', message: 'Нельзя снять роль owner с себя' });
      return;
    }

    await prisma.userChat.update({
      where: { userId_chatId: { userId: memberUserId, chatId } },
      data: { role },
    });

    res.json({ message: `Роль участника изменена на ${role}` });
  } catch (error: any) {
    internalError(res, error, 'chatController.updateMemberRole');
  }
};

// ============================================================
// DELETE /api/chats/:id/admins/:adminId — удалить админа
// ============================================================

export const removeAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId, adminId } = req.params;

    // Проверяем права
    const currentMember = await prisma.userChat.findUnique({
      where: { userId_chatId: { userId, chatId } },
    });

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      res.status(403).json({ error: 'Forbidden', message: 'Только владелец или админ может удалять админов' });
      return;
    }

    // Проверяем, что админ существует
    const admin = await prisma.userChat.findUnique({
      where: { userId_chatId: { userId: adminId, chatId } },
    });

    if (!admin) {
      res.status(404).json({ error: 'Not Found', message: 'Админ не найден в этом чате' });
      return;
    }

    // Нельзя удалить себя
    if (adminId === userId) {
      res.status(400).json({ error: 'Bad Request', message: 'Нельзя удалить себя из админов через этот эндпоинт' });
      return;
    }

    // Если это owner — меняем на admin, иначе удаляем запись
    if (admin.role === 'owner') {
      await prisma.userChat.update({
        where: { userId_chatId: { userId: adminId, chatId } },
        data: { role: 'admin' },
      });
      res.json({ message: 'Роль owner изменена на admin' });
    } else {
      await prisma.userChat.delete({
        where: { userId_chatId: { userId: adminId, chatId } },
      });
      res.json({ message: 'Админ удалён из чата' });
    }
  } catch (error: any) {
    internalError(res, error, 'chatController.removeAdmin');
  }
};

// ============================================================
// PUT /api/chats/:id/admins/:adminId/role — изменить роль админа
// ============================================================

export const updateAdminRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId, adminId } = req.params;
    const { role } = req.body;

    const validRoles = ['owner', 'admin', 'moderator'];
    if (!role || !validRoles.includes(role)) {
      res.status(400).json({ error: 'Bad Request', message: 'role должен быть: owner, admin, moderator' });
      return;
    }

    // Проверяем права
    const currentMember = await prisma.userChat.findUnique({
      where: { userId_chatId: { userId, chatId } },
    });

    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      res.status(403).json({ error: 'Forbidden', message: 'Только владелец или админ может менять роли админов' });
      return;
    }

    // Проверка, что админ существует
    const admin = await prisma.userChat.findUnique({
      where: { userId_chatId: { userId: adminId, chatId } },
    });

    if (!admin) {
      res.status(404).json({ error: 'Not Found', message: 'Пользователь не найден в этом чате' });
      return;
    }

    await prisma.userChat.update({
      where: { userId_chatId: { userId: adminId, chatId } },
      data: { role },
    });

    res.json({ message: `Роль админа изменена на ${role}` });
  } catch (error: any) {
    internalError(res, error, 'chatController.updateAdminRole');
  }
};

// ============================================================
// GET /api/chats/:id/export — экспорт чата (HTML)
// ============================================================

export const exportChat = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: chatId } = req.params;

    if (!chatId) {
      res.status(400).json({ error: 'Bad Request', message: 'Chat ID обязателен' });
      return;
    }

    // Получаем чат и сообщения
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          where: { deleted: false },
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, displayName: true, username: true } },
            attachments: { select: { url: true, type: true, name: true } },
          },
        },
      },
    });

    if (!chat) {
      res.status(404).json({ error: 'Not Found', message: 'Чат не найден' });
      return;
    }

    // Проверяем, что пользователь — участник чата
    const member = await prisma.userChat.findUnique({
      where: { userId_chatId: { userId, chatId } },
    });
    if (!member) {
      res.status(403).json({ error: 'Forbidden', message: 'Вы не являетесь участником этого чата' });
      return;
    }

    // Генерируем HTML
    const html = generateChatHTML(chat);
    const size = Buffer.byteLength(html, 'utf-8');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="chat-${chatId}.html"`);
    res.send(html);
  } catch (error: any) {
    internalError(res, error, 'chatController.exportChat');
  }
};

// Генерация HTML-экспорта чата
function generateChatHTML(chat: any): string {
  const chatName = chat.name || 'Без названия';
  const messages = chat.messages || [];

  const htmlMessages = messages.map((msg: any) => {
    const senderName = msg.sender?.displayName || msg.sender?.username || 'Unknown';
    const date = new Date(Number(msg.createdAt) || 0).toLocaleString('ru-RU');
    const isOwn = false;
    const content = escapeHtml(msg.content || '');
    const attachments = (msg.attachments || []).map((a: any) => {
      if (a.type === 'image') {
        return `<div class="attachment"><img src="${escapeHtml(a.url)}" alt="${escapeHtml(a.name || '')}"></div>`;
      }
      return `<div class="attachment"><a href="${escapeHtml(a.url)}" download>${escapeHtml(a.name || 'Файл')}</a></div>`;
    }).join('');

    return `<div class="message ${isOwn ? 'sender' : 'receiver'}">
      <div class="sender-name">${escapeHtml(senderName)}</div>
      <div class="message-text">${content}</div>
      ${attachments}
      <div class="message-date">${escapeHtml(date)}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(chatName)} — Экспорт чата</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #e0e0e0; }
    h1 { color: #2db84d; border-bottom: 2px solid #2db84d; padding-bottom: 10px; }
    .message { margin: 10px 0; padding: 10px; border-radius: 4px; }
    .sender { background: #2db84d20; margin-left: 10%; }
    .receiver { background: #16213e; margin-right: 10%; }
    .sender-name { font-weight: bold; color: #2db84d; font-size: 0.85em; }
    .message-text { margin: 5px 0; word-wrap: break-word; }
    .message-date { font-size: 0.75em; color: #888; }
    .attachment img { max-width: 300px; border-radius: 4px; }
    .attachment a { color: #2db84d; }
  </style>
</head>
<body>
  <h1>${escapeHtml(chatName)}</h1>
  <p>Экспортировано: ${new Date().toLocaleString('ru-RU')}</p>
  <p>Сообщений: ${messages.length}</p>
  ${htmlMessages}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

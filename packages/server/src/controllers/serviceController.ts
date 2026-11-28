import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { REGISTRATION_BONUS } from '@balloo/shared';
import { internalError } from '../middleware/errorHandler';
import { addContact as addContactService, removeContact as removeContactService, ensureMutualContacts } from '../services/userService';
import { joinNewsChannel } from '../services/authService';

// ============================================================
// Service API — внутренние эмуляционные эндпоинты (/api/service/*).
//
// Доступ закрыт длинным секретом (см. middleware/serviceAuth.ts).
// Назначение: просмотр пользователей с ролями, выдача ролей и создание
// искусственных сущностей (пользователи, чаты/группы, сообщения, вложения
// всех типов, звонки в историю, истории) для эмуляции и проверок.
//
// Все ответы сериализуются глобальным BigInt-сериализатором (app.ts), поэтому
// BigInt-поля (createdAt и т.п.) уходят клиенту строками.
// ============================================================

const prisma = new PrismaClient();

const ALLOWED_ROLES = ['user', 'moderator', 'admin'] as const;
const USER_STATUSES = ['active', 'banned', 'suspended', 'deleted'] as const;
const CHAT_TYPES = ['direct', 'group', 'channel'] as const;
const GROUP_TYPES = ['ordinary', 'public', 'media', 'corporate'] as const;
const CHAT_MEMBER_ROLES = ['owner', 'admin', 'moderator', 'member'] as const;
const MESSAGE_TYPES = [
  'text',
  'image',
  'file',
  'voice',
  'video',
  'poll',
  'quiz',
  'list_active',
  'list_passive',
  'personali',
  'system',
] as const;
const CALL_TYPES = ['audio', 'video'] as const;
const CALL_STATUSES = ['ongoing', 'ended', 'missed', 'declined'] as const;
const STORY_TYPES = ['image', 'video'] as const;
const STORY_VISIBILITIES = ['all', 'friends', 'self', 'selective'] as const;

const nowSec = (): bigint => BigInt(Math.floor(Date.now() / 1000));

const badRequest = (res: Response, message: string, details?: unknown): void => {
  res.status(400).json({ error: 'Bad Request', message, ...(details ? { details } : {}) });
};

const handlePrismaError = (res: Response, error: any, notFoundMessage: string): void => {
  if (error?.code === 'P2025') {
    res.status(404).json({ error: 'Not Found', message: notFoundMessage });
    return;
  }
  if (error?.code === 'P2002') {
    res.status(409).json({
      error: 'Conflict',
      message: `Нарушение уникальности: ${Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : error.meta?.target ?? ''}`,
    });
    return;
  }
  if (error?.code === 'P2003') {
    res.status(409).json({ error: 'Conflict', message: 'На запись ссылаются другие данные (нарушение внешнего ключа)' });
    return;
  }
  internalError(res, error, 'serviceController');
};

// ============================================================
// Общие схемы
// ============================================================

const attachmentSchema = z.object({
  type: z.string().min(1).max(20),
  // Не-файловые вложения (тик. 1795677071) приходят без ссылки — данные в `data`.
  url: z.string().max(500).optional().default(''),
  thumbnail: z.string().max(500).optional(),
  size: z.number().int().nonnegative().optional(),
  name: z.string().max(255).optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  duration: z.number().int().optional(),
  storage: z.string().max(20).optional(),
  meta: z.any().optional(),
  data: z.any().optional(),
});

const attachmentsSchema = z.array(attachmentSchema).min(1).max(50);

// Prisma create-input для вложения (size — BigInt, createdAt — BigInt)
const attachmentCreateData = (att: z.infer<typeof attachmentSchema>, createdAt: bigint) => ({
  type: att.type,
  url: att.url,
  thumbnail: att.thumbnail ?? null,
  size: BigInt(att.size ?? 0),
  name: att.name ?? null,
  width: att.width ?? null,
  height: att.height ?? null,
  duration: att.duration ?? null,
  storage: att.storage ?? null,
  meta: att.meta ?? undefined,
  data: att.data ?? undefined,
  createdAt,
});

// ============================================================
// Health — проверка ключа
// ============================================================

export const health = (_req: Request, res: Response): void => {
  res.json({ ok: true, service: 'balloo-service-api', time: Number(nowSec()) });
};

// ============================================================
// Пользователи
// ============================================================

// GET /api/service/users — полный список пользователей с ролями
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '1000'), 10) || 1000, 1), 10000);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0);

    const where: Record<string, any> = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          status: true,
          language: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { userChats: true, messages: true, stories: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, limit, offset });
  } catch (error: any) {
    internalError(res, error, 'serviceController.listUsers');
  }
};

const createUserSchema = z.object({
  email: z.string().email().max(255).optional(),
  username: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_.]+$/, 'username: только буквы, цифры, _ и .').optional(),
  displayName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().max(500).optional(),
  role: z.enum(ALLOWED_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  language: z.string().max(10).optional(),
  password: z.string().min(6).max(200).optional(),
});

// POST /api/service/users — создать искусственного пользователя
export const createUser = async (req: Request, res: Response): Promise<void> => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, 'Неверные данные пользователя', parsed.error.errors);
    return;
  }

  const data = parsed.data;
  if (!data.email && !data.username) {
    badRequest(res, 'Нужен хотя бы email или username');
    return;
  }

  try {
    const now = nowSec();
    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;

    const user = await prisma.user.create({
      data: {
        email: data.email ?? null,
        username: data.username ?? null,
        displayName: data.displayName ?? data.username ?? null,
        phone: data.phone ?? null,
        avatarUrl: data.avatarUrl ?? null,
        role: data.role ?? 'user',
        status: data.status ?? 'active',
        language: data.language ?? 'ru',
        passwordHash,
        createdAt: now,
        balancePoints: REGISTRATION_BONUS,
        updatedAt: now,
        ...(data.username
          ? {
              publicProfile: {
                create: {
                  username: data.username,
                  displayName: data.displayName ?? data.username,
                  avatarUrl: data.avatarUrl ?? null,
                  createdAt: now,
                  updatedAt: now,
                },
              },
            }
          : {}),
      },
    });

    res.status(201).json({ user });

    // Fire-and-forget: авто-вступление в новостной канал (не блокирует создание)
    joinNewsChannel(user.id);
  } catch (error: any) {
    handlePrismaError(res, error, 'Пользователь не найден');
  }
};

const setRoleSchema = z.object({ role: z.enum(ALLOWED_ROLES) });

// POST /api/service/users/:id/role — задать роль конкретному пользователю
export const setUserRole = async (req: Request, res: Response): Promise<void> => {
  const parsed = setRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, 'role: user | moderator | admin', parsed.error.errors);
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: parsed.data.role, updatedAt: nowSec() },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    res.json({ user });
  } catch (error: any) {
    handlePrismaError(res, error, 'Пользователь не найден');
  }
};

// DELETE /api/service/users/:id — удалить пользователя (жёстко, каскадом)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ deleted: true, id: req.params.id });
  } catch (error: any) {
    handlePrismaError(res, error, 'Пользователь не найден');
  }
};

// ============================================================
// Чаты / группы / каналы
// ============================================================

const chatSettingsSchema = z
  .object({
    allowMessages: z.boolean().optional(),
    allowMedia: z.boolean().optional(),
    allowPolls: z.boolean().optional(),
    allowStories: z.boolean().optional(),
    requiredApprove: z.boolean().optional(),
    requireRules: z.boolean().optional(),
    rulesText: z.string().optional(),
    whoCanWrite: z.enum(['admin', 'admin_moderators', 'all']).optional(),
    editPosts: z.enum(['24h', 'forever', 'never']).optional(),
    allowForward: z.boolean().optional(),
    hideSubscribers: z.boolean().optional(),
    enableDiscussion: z.boolean().optional(),
  })
  .optional();

const chatMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(CHAT_MEMBER_ROLES).optional(),
});

const createChatSchema = z.object({
  type: z.enum(CHAT_TYPES).optional().default('group'),
  name: z.string().max(255).optional(),
  avatarUrl: z.string().max(500).optional(),
  description: z.string().optional(),
  groupType: z.enum(GROUP_TYPES).optional(),
  slug: z.string().max(100).optional(),
  memberLimit: z.number().int().positive().optional(),
  isVerified: z.boolean().optional(),
  ownerId: z.string().optional(),
  memberIds: z.array(z.string().min(1)).optional(),
  members: z.array(chatMemberSchema).optional(),
  settings: chatSettingsSchema,
});

// GET /api/service/chats — список чатов (фильтры type/memberId/q) для проверок
export const listChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const memberId = typeof req.query.memberId === 'string' ? req.query.memberId : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '200'), 10) || 200, 1), 1000);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0);

    const where: Record<string, any> = {};
    if (type) where.type = type;
    if (memberId) where.members = { some: { userId: memberId } };
    if (q) where.name = { contains: q, mode: 'insensitive' };

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: { _count: { select: { members: true, messages: true } } },
      }),
      prisma.chat.count({ where }),
    ]);

    res.json({ chats, total, limit, offset });
  } catch (error: any) {
    internalError(res, error, 'serviceController.listChats');
  }
};

// GET /api/service/chats/:id — детали чата (участники, настройки, счётчики)
export const getChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, role: true } } },
        },
        settings: true,
        _count: { select: { members: true, messages: true } },
      },
    });

    if (!chat) {
      res.status(404).json({ error: 'Not Found', message: 'Чат не найден' });
      return;
    }

    res.json({ chat });
  } catch (error: any) {
    handlePrismaError(res, error, 'Чат не найден');
  }
};

// POST /api/service/chats — создать чат (type: direct | group | channel)
// POST /api/service/groups — то же, но по умолчанию type=group
export const createChat = async (req: Request, res: Response): Promise<void> => {
  const parsed = createChatSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    badRequest(res, 'Неверные данные чата', parsed.error.errors);
    return;
  }

  const data = parsed.data;
  const type = data.type;

  // Собираем участников: memberIds + members, с приоритетом явной роли.
  const roleByUser = new Map<string, (typeof CHAT_MEMBER_ROLES)[number]>();
  for (const id of data.memberIds ?? []) roleByUser.set(id, 'member');
  for (const m of data.members ?? []) roleByUser.set(m.userId, m.role ?? 'member');
  if (data.ownerId) roleByUser.set(data.ownerId, 'owner');

  if (type === 'direct') {
    if (roleByUser.size !== 2) {
      badRequest(res, 'direct-чат требует ровно двух разных участников (memberIds)');
      return;
    }
  } else {
    if (!data.name || data.name.trim().length === 0) {
      badRequest(res, 'Для group/channel нужен name');
      return;
    }
    if (roleByUser.size === 0) {
      badRequest(res, 'Для group/channel нужен хотя бы один участник');
      return;
    }
    // Владелец обязателен: если не задан — первый участник становится owner.
    if (!data.ownerId) {
      const first = roleByUser.keys().next().value as string;
      roleByUser.set(first, 'owner');
    }
  }

  try {
    const userIds = [...roleByUser.keys()];
    const existing = await prisma.user.count({ where: { id: { in: userIds } } });
    if (existing !== userIds.length) {
      badRequest(res, 'Часть userId не найдена среди пользователей');
      return;
    }

    const now = nowSec();

    const chat = await prisma.chat.create({
      data: {
        type,
        name: data.name ?? null,
        avatarUrl: data.avatarUrl ?? null,
        description: data.description ?? null,
        groupType: type === 'direct' ? null : data.groupType ?? null,
        slug: data.slug ?? null,
        memberLimit: data.memberLimit ?? null,
        isVerified: data.isVerified ?? false,
        createdAt: now,
        updatedAt: now,
        members: {
          create: userIds.map((userId) => ({
            userId,
            role: type === 'direct' ? 'member' : roleByUser.get(userId)!,
            joinedAt: now,
            lastRead: now,
          })),
        },
        ...(data.settings ? { settings: { create: { ...data.settings } } } : {}),
      },
      include: {
        members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
        settings: true,
      },
    });

    res.status(201).json({ chat });
  } catch (error: any) {
    handlePrismaError(res, error, 'Чат не найден');
  }
};

// DELETE /api/service/chats/:id — удалить чат (каскадом сообщения и участники)
export const deleteChat = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.chat.delete({ where: { id: req.params.id } });
    res.json({ deleted: true, id: req.params.id });
  } catch (error: any) {
    handlePrismaError(res, error, 'Чат не найден');
  }
};

// ============================================================
// Сообщения и вложения
// ============================================================

const pollSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(10),
  allowsMultiple: z.boolean().optional(),
  expiresAt: z.number().int().optional(),
});

const createMessageSchema = z.object({
  chatId: z.string().min(1),
  senderId: z.string().min(1),
  type: z.enum(MESSAGE_TYPES).optional(),
  content: z.string().max(100000).optional(),
  replyToId: z.string().optional(),
  createdAt: z.number().int().nonnegative().optional(),
  attachments: attachmentsSchema.optional(),
  poll: pollSchema.optional(),
});

// GET /api/service/messages — список сообщений (фильтр chatId/senderId)
export const listMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const chatId = typeof req.query.chatId === 'string' ? req.query.chatId : undefined;
    const senderId = typeof req.query.senderId === 'string' ? req.query.senderId : undefined;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '100'), 10) || 100, 1), 500);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0);

    const where: Record<string, any> = {};
    if (chatId) where.chatId = chatId;
    if (senderId) where.senderId = senderId;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          attachments: true,
          sender: { select: { id: true, username: true, displayName: true } },
          _count: { select: { reactions: true } },
        },
      }),
      prisma.message.count({ where }),
    ]);

    res.json({ messages, total, limit, offset });
  } catch (error: any) {
    internalError(res, error, 'serviceController.listMessages');
  }
};

// POST /api/service/messages — создать сообщение (с вложениями/опросом)
export const createMessage = async (req: Request, res: Response): Promise<void> => {
  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, 'Неверные данные сообщения', parsed.error.errors);
    return;
  }

  const data = parsed.data;

  try {
    const chat = await prisma.chat.findUnique({ where: { id: data.chatId }, select: { id: true } });
    if (!chat) {
      res.status(404).json({ error: 'Not Found', message: 'Чат не найден' });
      return;
    }

    const sender = await prisma.user.findUnique({ where: { id: data.senderId }, select: { id: true } });
    if (!sender) {
      res.status(404).json({ error: 'Not Found', message: 'Отправитель не найден' });
      return;
    }

    // Эмуляция: если отправитель ещё не в чате — добавляем его участником.
    await prisma.userChat.upsert({
      where: { userId_chatId: { userId: data.senderId, chatId: data.chatId } },
      create: { userId: data.senderId, chatId: data.chatId, role: 'member', joinedAt: nowSec(), lastRead: nowSec() },
      update: {},
    });

    if (data.replyToId) {
      const replyTo = await prisma.message.findUnique({ where: { id: data.replyToId }, select: { chatId: true } });
      if (!replyTo || replyTo.chatId !== data.chatId) {
        badRequest(res, 'replyToId не относится к этому чату');
        return;
      }
    }

    const createdAt = data.createdAt != null ? BigInt(data.createdAt) : nowSec();
    const type =
      data.type ?? (data.poll ? 'poll' : data.attachments && data.attachments.length > 0 ? data.attachments[0].type : 'text');

    let poll: any = null;
    if (data.poll) {
      poll = await prisma.poll.create({
        data: {
          chatId: data.chatId,
          creatorId: data.senderId,
          question: data.poll.question,
          options: JSON.stringify(data.poll.options),
          allowsMultiple: data.poll.allowsMultiple ?? false,
          expiresAt: data.poll.expiresAt != null ? BigInt(data.poll.expiresAt) : null,
          createdAt,
          updatedAt: createdAt,
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        chatId: data.chatId,
        senderId: data.senderId,
        type: type as any,
        content: data.content ?? (data.poll ? data.poll.question : null),
        replyToId: data.replyToId ?? null,
        createdAt,
        updatedAt: createdAt,
        ...(data.attachments && data.attachments.length > 0
          ? { attachments: { create: data.attachments.map((a) => attachmentCreateData(a, createdAt)) } }
          : {}),
      },
      include: { attachments: true },
    });

    await prisma.chat.update({ where: { id: data.chatId }, data: { updatedAt: createdAt } });
    await prisma.userChat.updateMany({
      where: { chatId: data.chatId, userId: { not: data.senderId } },
      data: { unread: { increment: 1 } },
    });

    res.status(201).json({ message, poll });
  } catch (error: any) {
    handlePrismaError(res, error, 'Сообщение не найдено');
  }
};

const addAttachmentsSchema = z.object({ attachments: attachmentsSchema });

// POST /api/service/messages/:id/attachments — добавить вложения любого типа
export const addAttachments = async (req: Request, res: Response): Promise<void> => {
  const parsed = addAttachmentsSchema.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, 'attachments: непустой массив вложений', parsed.error.errors);
    return;
  }

  try {
    const message = await prisma.message.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!message) {
      res.status(404).json({ error: 'Not Found', message: 'Сообщение не найдено' });
      return;
    }

    const now = nowSec();
    await prisma.messageAttachment.createMany({
      data: parsed.data.attachments.map((a) => ({ ...attachmentCreateData(a, now), messageId: req.params.id })),
    });

    const attachments = await prisma.messageAttachment.findMany({
      where: { messageId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(201).json({ attachments });
  } catch (error: any) {
    handlePrismaError(res, error, 'Сообщение не найдено');
  }
};

// DELETE /api/service/messages/:id — удалить сообщение
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.message.delete({ where: { id: req.params.id } });
    res.json({ deleted: true, id: req.params.id });
  } catch (error: any) {
    handlePrismaError(res, error, 'Сообщение не найдено');
  }
};

// ============================================================
// Звонки (в историю)
// ============================================================

const createCallSchema = z.object({
  chatId: z.string().optional(),
  callerId: z.string().min(1),
  calleeId: z.string().optional(),
  participantIds: z.array(z.string().min(1)).optional(),
  type: z.enum(CALL_TYPES).optional().default('audio'),
  status: z.enum(CALL_STATUSES).optional().default('ended'),
  isGroup: z.boolean().optional(),
  startedAt: z.number().int().nonnegative().optional(),
  durationSec: z.number().int().nonnegative().optional(),
});

// POST /api/service/calls — записать звонок в историю
export const createCall = async (req: Request, res: Response): Promise<void> => {
  const parsed = createCallSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    badRequest(res, 'Неверные данные звонка', parsed.error.errors);
    return;
  }

  const data = parsed.data;
  const participants = [...new Set([data.callerId, ...(data.participantIds ?? []), ...(data.calleeId ? [data.calleeId] : [])])];

  try {
    const existing = await prisma.user.count({ where: { id: { in: participants } } });
    if (existing !== participants.length) {
      badRequest(res, 'Часть участников не найдена среди пользователей');
      return;
    }

    const now = nowSec();
    const startedAt = data.startedAt != null ? BigInt(data.startedAt) : now;

    let endedAt: bigint | null = null;
    if (data.status === 'ended') {
      endedAt = startedAt + BigInt(data.durationSec ?? 30);
    } else if (data.status === 'missed' || data.status === 'declined') {
      endedAt = startedAt;
    }

    // Чат звонка: заданный, либо direct-чат между участниками (создаём при отсутствии)
    let chatId = data.chatId;
    if (chatId) {
      const chat = await prisma.chat.findUnique({ where: { id: chatId }, select: { id: true } });
      if (!chat) {
        res.status(404).json({ error: 'Not Found', message: 'Чат не найден' });
        return;
      }
    } else {
      if (participants.length !== 2) {
        badRequest(res, 'Для группового звонка (3+ участника) нужен chatId');
        return;
      }
      const direct = await prisma.chat.findFirst({
        where: { type: 'direct', members: { every: { userId: { in: participants } } } },
        include: { members: { select: { userId: true } } },
      });
      if (direct && direct.members.length === participants.length) {
        chatId = direct.id;
      } else {
        const created = await prisma.chat.create({
          data: {
            type: 'direct',
            createdAt: startedAt,
            updatedAt: startedAt,
            members: {
              create: participants.map((userId) => ({ userId, role: 'member', joinedAt: startedAt, lastRead: startedAt })),
            },
          },
        });
        chatId = created.id;
      }
    }

    const call = await prisma.call.create({
      data: {
        chatId,
        type: data.type,
        status: data.status,
        isGroup: data.isGroup ?? participants.length > 2,
        startedAt,
        endedAt,
        createdAt: startedAt,
        participants: {
          create: participants.map((userId) => ({ userId, joinedAt: startedAt, leftAt: endedAt })),
        },
      },
      include: { participants: true },
    });

    res.status(201).json({ call });
  } catch (error: any) {
    handlePrismaError(res, error, 'Звонок не найден');
  }
};

// DELETE /api/service/calls/:id — удалить звонок
export const deleteCall = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.call.delete({ where: { id: req.params.id } });
    res.json({ deleted: true, id: req.params.id });
  } catch (error: any) {
    handlePrismaError(res, error, 'Звонок не найден');
  }
};

// ============================================================
// Истории
// ============================================================

const createStorySchema = z.object({
  userId: z.string().min(1),
  type: z.enum(STORY_TYPES),
  mediaUrl: z.string().min(1).max(500),
  thumbnail: z.string().max(500).optional(),
  expiresInSec: z.number().int().positive().optional(),
  visibility: z.enum(STORY_VISIBILITIES).optional(),
  viewCount: z.number().int().nonnegative().optional(),
  createdAt: z.number().int().nonnegative().optional(),
});

// POST /api/service/stories — создать историю
export const createStory = async (req: Request, res: Response): Promise<void> => {
  const parsed = createStorySchema.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, 'Неверные данные истории', parsed.error.errors);
    return;
  }

  const data = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { id: data.userId }, select: { id: true } });
    if (!user) {
      res.status(404).json({ error: 'Not Found', message: 'Пользователь не найден' });
      return;
    }

    const createdAt = data.createdAt != null ? BigInt(data.createdAt) : nowSec();
    const expiresAt = createdAt + BigInt(data.expiresInSec ?? 24 * 60 * 60);

    const story = await prisma.story.create({
      data: {
        userId: data.userId,
        type: data.type,
        mediaUrl: data.mediaUrl,
        thumbnail: data.thumbnail ?? null,
        expiresAt,
        viewCount: data.viewCount ?? 0,
        visibility: data.visibility ?? 'all',
        createdAt,
      },
    });

    res.status(201).json({ story });
  } catch (error: any) {
    handlePrismaError(res, error, 'История не найдена');
  }
};

// DELETE /api/service/stories/:id — удалить историю
export const deleteStory = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.story.delete({ where: { id: req.params.id } });
    res.json({ deleted: true, id: req.params.id });
  } catch (error: any) {
    handlePrismaError(res, error, 'История не найдена');
  }
};

// ============================================================
// Контакты
// ============================================================

const addContactSchema = z.object({
  contactId: z.string().min(1),
});

// POST /api/service/contacts — добавить контакт (ownerId → contactId)
export const addContact = async (req: Request, res: Response): Promise<void> => {
  const parsed = addContactSchema.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, 'Неверные данные контакта', parsed.error.errors);
    return;
  }

  try {
    const result = await addContactService(req.params.id, parsed.data.contactId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Пользователь не найден') {
      res.status(404).json({ error: 'Not Found', message: 'Пользователь не найден' });
    } else if (error.message === 'Пользователь уже в контактах') {
      res.status(409).json({ error: 'Conflict', message: error.message });
    } else if (error.message === 'Нельзя добавить себя в контакты') {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else {
      handlePrismaError(res, error, 'Сервис контактов');
    }
  }
};

// DELETE /api/service/contacts/:contactId — удалить контакт
export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await removeContactService(req.params.id, req.params.contactId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Пользователь не в контактах') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      handlePrismaError(res, error, 'Сервис контактов');
    }
  }
};

const mutualContactsSchema = z.object({
  userA: z.string().min(1),
  userB: z.string().min(1),
});

// POST /api/service/contacts/mutual — взаимные контакты двух пользователей
export const addMutualContacts = async (req: Request, res: Response): Promise<void> => {
  const parsed = mutualContactsSchema.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, 'Неверные данные контактов', parsed.error.errors);
    return;
  }
  const { userA, userB } = parsed.data;
  if (userA === userB) {
    badRequest(res, 'userA и userB должны различаться');
    return;
  }
  const found = await prisma.user.count({ where: { id: { in: [userA, userB] } } });
  if (found !== 2) {
    badRequest(res, 'Один из пользователей не найден');
    return;
  }
  await ensureMutualContacts(userA, userB);
  res.json({ ok: true, userA, userB });
};

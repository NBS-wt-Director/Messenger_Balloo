// supportService.ts — Сервис чата с техподдержкой (тикет 1790572800-01)
// ТЗ: mockups/balloo-su/support.md, docs/03-database-schema.md §Support
//
// Хранилище — SupportTicket + SupportMessage (не Chat): обращение пользователя
// = тикет, переписка = сообщения тикета. Автоответ — серверный бот при первом
// обращении; приоритет повышается при повторных открытых тикетах.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Текст автоответа при первом обращении (ТЗ: «бот отправляет приветствие»). */
export const AUTO_REPLY_GREETING =
  'Здравствуйте! Опишите вашу проблему, и мы обязательно поможем. ' +
  'Среднее время ответа — 5 минут.';

/** Тема тикета по умолчанию — в форме пользователь её не задаёт. */
export const DEFAULT_SUBJECT = 'Обращение в поддержку';

/** Среднее время ответа для GET /support/status (ТЗ: «Среднее время ответа: 5 мин»). */
const AVG_RESPONSE_MINUTES = 5;

const now = () => BigInt(Math.floor(Date.now() / 1000));

/** Учётка бота поддержки. Если её нет в БД — сообщения пишутся от самого пользователя. */
export async function resolveSupportBotId(): Promise<string | null> {
  const bot = await prisma.user.findFirst({
    where: { username: 'support' },
    select: { id: true },
  });
  return bot?.id ?? null;
}

/**
 * Вернуть открытый тикет пользователя, создав его при первом обращении
 * вместе с приветственным автоответом.
 */
export async function getOrCreateTicket(userId: string) {
  const existing = await prisma.supportTicket.findFirst({
    where: { userId, status: { in: ['open', 'in_progress'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    return { ticket: existing, created: false };
  }

  const ts = now();
  // Приоритет: повышенный при повторных обращениях (есть закрытые тикеты).
  const previous = await prisma.supportTicket.count({ where: { userId } });

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject: DEFAULT_SUBJECT,
      status: 'open',
      priority: previous > 0 ? 'high' : 'normal',
      createdAt: ts,
      updatedAt: ts,
    },
  });

  const botId = await resolveSupportBotId();
  await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      authorId: botId ?? userId,
      text: AUTO_REPLY_GREETING,
      isInternal: false,
      createdAt: ts,
    },
  });

  return { ticket, created: true };
}

/** История чата поддержки: тикет + сообщения (без внутренних заметок). */
export async function getChat(userId: string) {
  const { ticket, created } = await getOrCreateTicket(userId);

  const messages = await prisma.supportMessage.findMany({
    where: { ticketId: ticket.id, isInternal: false },
    orderBy: { createdAt: 'asc' },
  });

  return {
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
    },
    messages: messages.map((m) => ({
      id: m.id,
      text: m.text,
      authorId: m.authorId,
      isBot: m.authorId === ticket.userId && m.text === AUTO_REPLY_GREETING,
      createdAt: m.createdAt,
    })),
    created,
  };
}

/** Отправка сообщения пользователем. Возвращает созданное сообщение. */
export async function sendMessage(userId: string, text: string) {
  const clean = String(text ?? '').trim();
  if (!clean) {
    throw new Error('EMPTY_MESSAGE');
  }
  if (clean.length > 5000) {
    throw new Error('MESSAGE_TOO_LONG');
  }

  const { ticket } = await getOrCreateTicket(userId);
  const ts = now();

  const message = await prisma.supportMessage.create({
    data: { ticketId: ticket.id, authorId: userId, text: clean, createdAt: ts },
  });

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { updatedAt: ts, status: 'open' },
  });

  return {
    id: message.id,
    text: message.text,
    authorId: message.authorId,
    createdAt: message.createdAt,
  };
}

/** Статус поддержки для хедера (ТЗ: онлайн + среднее время ответа). */
export async function getStatus() {
  const openTickets = await prisma.supportTicket.count({
    where: { status: { in: ['open', 'in_progress'] } },
  });

  return {
    online: true,
    avgResponseMinutes: AVG_RESPONSE_MINUTES,
    openTickets,
  };
}

// ============================================================
// Админская часть (ответ В-33: страница в дашборде админки)
// ============================================================

/** Список тикетов для админ-дашборда. */
export async function listTickets(params: { status?: string; page?: number; limit?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));

  const where = params.status ? { status: params.status } : {};

  const [total, tickets] = await Promise.all([
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, username: true, displayName: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  return {
    total,
    page,
    limit,
    tickets: tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      messagesCount: t._count.messages,
      user: t.user,
    })),
  };
}

/** Тикет с перепиской (включая внутренние заметки — для админа). */
export async function getTicketForAdmin(ticketId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, username: true, displayName: true, email: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!ticket) {
    throw new Error('TICKET_NOT_FOUND');
  }

  return ticket;
}

/** Ответ администратора в тикете. */
export async function replyAsAdmin(
  ticketId: string,
  adminId: string,
  text: string,
  isInternal = false
) {
  const clean = String(text ?? '').trim();
  if (!clean) {
    throw new Error('EMPTY_MESSAGE');
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new Error('TICKET_NOT_FOUND');
  }

  const ts = now();
  const message = await prisma.supportMessage.create({
    data: { ticketId, authorId: adminId, text: clean, isInternal, createdAt: ts },
  });

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: ts, status: isInternal ? ticket.status : 'in_progress' },
  });

  return {
    id: message.id,
    text: message.text,
    authorId: message.authorId,
    isInternal: message.isInternal,
    createdAt: message.createdAt,
  };
}

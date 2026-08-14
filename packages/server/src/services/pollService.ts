import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Типы
// ============================================================

interface CreatePollInput {
  chatId: string;
  creatorId: string;
  question: string;
  options: string[];
  allowsMultiple?: boolean;
  expiresAt?: number; // Unix seconds, undefined = never expires
}

interface VotePollInput {
  pollId: string;
  userId: string;
  optionIndex: number | number[];
}

interface GetPollResultsInput {
  pollId: string;
  viewerId?: string;
}

// ============================================================
// Создание опроса
// ============================================================

export const createPoll = async (input: CreatePollInput) => {
  const { chatId, creatorId, question, options, allowsMultiple, expiresAt } = input;

  // Валидация
  if (options.length < 2) {
    throw new Error('Опрос должен иметь минимум 2 варианта ответа');
  }
  if (options.length > 10) {
    throw new Error('Опрос может иметь максимум 10 вариантов ответа');
  }
  for (const option of options) {
    if (!option || option.trim().length === 0) {
      throw new Error('Все варианты ответа должны быть непустыми');
    }
    if (option.length > 100) {
      throw new Error('Длина варианта ответа не должна превышать 100 символов');
    }
  }

  // Проверяем, что пользователь состоит в чате
  const membership = await prisma.userChat.findFirst({
    where: { userId: creatorId, chatId },
  });

  if (!membership) {
    throw new Error('Пользователь не состоит в чате');
  }

  const now = Math.floor(Date.now() / 1000);

  // Создаём опрос
  const poll = await prisma.poll.create({
    data: {
      chatId,
      creatorId,
      question,
      options: JSON.stringify(options),
      allowsMultiple: allowsMultiple || false,
      expiresAt: expiresAt || null,
      createdAt: now,
      updatedAt: now,
    },
    include: {
      creator: {
        include: {
          publicProfile: true,
        },
      },
      _count: {
        select: { votes: true },
      },
    },
  });

  const parsedOptions = JSON.parse(poll.options);
  const pp = poll.creator.publicProfile;

  return {
    id: poll.id,
    chatId: poll.chatId,
    creatorId: poll.creatorId,
    question: poll.question,
    options: parsedOptions,
    allowsMultiple: poll.allowsMultiple,
    expiresAt: poll.expiresAt ? Number(poll.expiresAt) : null,
    createdAt: Number(poll.createdAt),
    creator: {
      id: poll.creator.id,
      username: pp?.username ?? poll.creator.username,
      displayName: pp?.displayName,
      avatarUrl: pp?.avatarUrl ?? poll.creator.avatarUrl,
    },
    voteCount: poll._count.votes,
  };
};

// ============================================================
// Голосование в опросе
// ============================================================

export const votePoll = async (input: VotePollInput) => {
  const { pollId, userId, optionIndex } = input;

  // Проверяем существование опроса
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
  });

  if (!poll) {
    throw new Error('Опрос не найден');
  }

  // Проверяем, не истёк ли опрос
  const now = Math.floor(Date.now() / 1000);
  if (poll.expiresAt && poll.expiresAt <= now) {
    throw new Error('Опрос истёк');
  }

  const parsedOptions: string[] = JSON.parse(poll.options);

  // Проверяем, что пользователь состоит в чате
  const membership = await prisma.userChat.findFirst({
    where: { userId, chatId: poll.chatId },
  });

  if (!membership) {
    throw new Error('Пользователь не состоит в чате');
  }

  // Проверяем, голосовал ли уже пользователь
  const existingVote = await prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId, userId } },
  });

  if (existingVote) {
    // Обновляем голос
    if (poll.allowsMultiple) {
      const indices = Array.isArray(optionIndex) ? optionIndex : [optionIndex];
      const normalized = indices.map((i) =>
        typeof i === 'number' ? i : parseInt(String(i), 10)
      );

      // Проверка допустимости
      for (const idx of normalized) {
        if (idx < 0 || idx >= parsedOptions.length) {
          throw new Error(`Недопустимый номер варианта: ${idx}`);
        }
      }

      // Удаляем старые и создаём новые
      await prisma.pollVote.deleteMany({ where: { pollId, userId } });

      for (const idx of normalized) {
        await prisma.pollVote.create({
          data: { pollId, userId, optionIndex: idx, createdAt: now },
        });
      }
    } else {
      const idx = Array.isArray(optionIndex) ? optionIndex[0] : optionIndex;
      const finalIdx = typeof idx === 'number' ? idx : parseInt(String(idx), 10);
      if (finalIdx < 0 || finalIdx >= parsedOptions.length) {
        throw new Error('Недопустимый номер варианта');
      }

      await prisma.pollVote.updateMany({
        where: { pollId, userId },
        data: { optionIndex: finalIdx, createdAt: now },
      });
    }
  } else {
    // Новое голосование
    if (poll.allowsMultiple) {
      const indices = Array.isArray(optionIndex) ? optionIndex : [optionIndex];
      const normalized = indices.map((i) =>
        typeof i === 'number' ? i : parseInt(String(i), 10)
      );

      for (const idx of normalized) {
        if (idx < 0 || idx >= parsedOptions.length) {
          throw new Error(`Недопустимый номер варианта: ${idx}`);
        }

        await prisma.pollVote.create({
          data: { pollId, userId, optionIndex: idx, createdAt: now },
        });
      }
    } else {
      const idx = Array.isArray(optionIndex) ? optionIndex[0] : optionIndex;
      const finalIdx = typeof idx === 'number' ? idx : parseInt(String(idx), 10);
      if (finalIdx < 0 || finalIdx >= parsedOptions.length) {
        throw new Error('Недопустимый номер варианта');
      }

      await prisma.pollVote.create({
        data: { pollId, userId, optionIndex: finalIdx, createdAt: now },
      });
    }
  }

  // Возвращаем результаты
  return getPollResultsInternal(pollId, userId);
};

// ============================================================
// Внутренняя функция результатов
// ============================================================

const getPollResultsInternal = async (pollId: string, viewerId?: string) => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      creator: {
        include: {
          publicProfile: true,
        },
      },
      _count: {
        select: { votes: true },
      },
    },
  });

  if (!poll) {
    throw new Error('Опрос не найден');
  }

  const parsedOptions: string[] = JSON.parse(poll.options);
  const now = Math.floor(Date.now() / 1000);
  const isExpired = poll.expiresAt ? Number(poll.expiresAt) <= now : false;

  // Получаем все голоса
  const votes = await prisma.pollVote.findMany({
    where: { pollId },
    select: { userId: true, optionIndex: true },
  });

  // Считаем голоса по вариантам
  const optionCounts = parsedOptions.map(() => 0);
  for (const vote of votes) {
    if (vote.optionIndex >= 0 && vote.optionIndex < optionCounts.length) {
      optionCounts[vote.optionIndex]++;
    }
  }

  const totalVotes = votes.length;

  // Проверяем, голосовал ли зритель
  const userVote = viewerId
    ? await prisma.pollVote.findUnique({
        where: { pollId_userId: { pollId, userId: viewerId } },
      })
    : null;

  // Формируем варианты с процентами
  const options = parsedOptions.map((text: string, index: number) => ({
    text,
    index,
    count: optionCounts[index],
    percent: totalVotes > 0 ? Math.round((optionCounts[index] / totalVotes) * 100) : 0,
    hasVoted: userVote ? userVote.optionIndex === index : false,
  }));

  const pp = poll.creator.publicProfile;

  return {
    id: poll.id,
    chatId: poll.chatId,
    creatorId: poll.creatorId,
    question: poll.question,
    options,
    allowsMultiple: poll.allowsMultiple,
    expiresAt: poll.expiresAt ? Number(poll.expiresAt) : null,
    isExpired,
    totalVotes,
    creator: {
      id: poll.creator.id,
      username: pp?.username ?? poll.creator.username,
      displayName: pp?.displayName,
      avatarUrl: pp?.avatarUrl ?? poll.creator.avatarUrl,
    },
  };
};

// ============================================================
// Получить результаты опроса (публичный интерфейс)
// ============================================================

export const getPollResults = async (input: GetPollResultsInput) => {
  const { pollId, viewerId } = input;

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
  });

  if (!poll) {
    throw new Error('Опрос не найден');
  }

  return getPollResultsInternal(pollId, viewerId);
};

// ============================================================
// Удалить опрос
// ============================================================

export const deletePoll = async (pollId: string, userId: string) => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
  });

  if (!poll) {
    throw new Error('Опрос не найден');
  }

  // Проверяем: создатель или админ чата
  const isCreator = poll.creatorId === userId;
  const isAdmin = await prisma.userChat.findFirst({
    where: {
      userId,
      chatId: poll.chatId,
      role: { in: ['owner', 'admin', 'moderator'] },
    },
  });

  if (!isCreator && !isAdmin) {
    throw new Error('Доступ запрещён');
  }

  await prisma.poll.delete({
    where: { id: pollId },
  });

  return { success: true, message: 'Опрос удалён' };
};

// ============================================================
// Пометить истекшие опросы (для cron job)
// ============================================================

export const expireOldPolls = async () => {
  const now = Math.floor(Date.now() / 1000);

  const expired = await prisma.poll.updateMany({
    where: {
      expiresAt: { lte: now },
    },
    data: {
      updatedAt: now,
    },
  });

  return { expiredCount: expired.count };
};

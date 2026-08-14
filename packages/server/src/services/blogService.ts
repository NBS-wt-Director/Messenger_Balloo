import { PrismaClient, BlogPostStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Blog Post CRUD
// ============================================================

interface CreatePostInput {
  title: string;
  content: string;
  channelId?: string;
  categoryIds?: string[];
}

export const createPost = async (authorId: string, input: CreatePostInput) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const post = await prisma.blogPost.create({
    data: {
      authorId,
      title: input.title,
      content: input.content,
      channelId: input.channelId || null,
      status: BlogPostStatus.draft,
      views: 0,
      createdAt: now,
      updatedAt: now,
      postCategories: input.categoryIds
        ? {
            create: input.categoryIds.map((categoryId) => ({
              categoryId,
              createdAt: now,
            })),
          }
        : undefined,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      channel: true,
      postCategories: {
        include: {
          category: true,
        },
      },
    },
  });

  return formatPost(post);
};

interface UpdatePostInput {
  title?: string;
  content?: string;
  channelId?: string | null;
  status?: BlogPostStatus;
  categoryIds?: string[];
}

export const updatePost = async (postId: string, input: UpdatePostInput) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const updateData: Record<string, unknown> = { updatedAt: now };
  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.channelId !== undefined) updateData.channelId = input.channelId;
  if (input.status !== undefined) updateData.status = input.status;

  const post = await prisma.blogPost.update({
    where: { id: postId },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      channel: true,
      postCategories: {
        include: {
          category: true,
        },
      },
    },
  });

  // Обновляем категории, если переданы
  if (input.categoryIds !== undefined) {
    await prisma.blogPostCategory.deleteMany({
      where: { postId },
    });
    if (input.categoryIds.length > 0) {
      await prisma.blogPostCategory.createMany({
        data: input.categoryIds.map((categoryId) => ({
          postId,
          categoryId,
          createdAt: now,
        })),
      });
    }
  }

  return formatPost(post);
};

export const deletePost = async (postId: string) => {
  await prisma.blogPost.delete({
    where: { id: postId },
  });

  return { message: 'Пост удалён' };
};

export const getPost = async (postId: string) => {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      channel: true,
      postCategories: {
        include: {
          category: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!post) {
    throw new Error('Пост не найден');
  }

  // Увеличиваем счётчик просмотров
  await prisma.blogPost.update({
    where: { id: postId },
    data: { views: { increment: 1 } },
  });

  return formatPost(post);
};

export const publishPost = async (postId: string, authorId: string) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error('Пост не найден');
  }

  if (post.authorId !== authorId) {
    throw new Error('Только автор может публиковать пост');
  }

  const updated = await prisma.blogPost.update({
    where: { id: postId },
    data: {
      status: BlogPostStatus.published,
      updatedAt: now,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      channel: true,
      postCategories: {
        include: {
          category: true,
        },
      },
    },
  });

  return formatPost(updated);
};

export const getPosts = async ({
  page = 1,
  limit = 20,
  channelId,
  categoryId,
  status,
  authorId,
}: {
  page?: number;
  limit?: number;
  channelId?: string;
  categoryId?: string;
  status?: BlogPostStatus;
  authorId?: string;
} = {}) => {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (channelId) where.channelId = channelId;
  if (status) where.status = status;
  if (authorId) where.authorId = authorId;

  // Фильтр по категории
  if (categoryId) {
    where.id = {
      in: prisma.blogPostCategory.findMany({
        where: { categoryId },
        select: { postId: true },
      }),
    };
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        channel: true,
        postCategories: {
          include: {
            category: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    posts: posts.map(formatPost),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

// ============================================================
// Blog Channel CRUD
// ============================================================

interface CreateChannelInput {
  name: string;
  description?: string;
}

export const createChannel = async (input: CreateChannelInput) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const channel = await prisma.blogChannel.create({
    data: {
      name: input.name,
      description: input.description || null,
      postCount: 0,
      followers: 0,
      createdAt: now,
      updatedAt: now,
    },
  });

  return formatChannel(channel);
};

export const getChannels = async ({
  page = 1,
  limit = 20,
  search,
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}) => {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [channels, total] = await Promise.all([
    prisma.blogChannel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.blogChannel.count({ where }),
  ]);

  return {
    channels: channels.map(formatChannel),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

export const getChannel = async (channelId: string) => {
  const channel = await prisma.blogChannel.findUnique({
    where: { id: channelId },
    include: {
      posts: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!channel) {
    throw new Error('Канал не найден');
  }

  return formatChannel(channel);
};

export const updateChannel = async (
  channelId: string,
  input: { name?: string; description?: string; avatarUrl?: string }
) => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const updateData: Record<string, unknown> = { updatedAt: now };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;

  const channel = await prisma.blogChannel.update({
    where: { id: channelId },
    data: updateData,
  });

  return formatChannel(channel);
};

export const deleteChannel = async (channelId: string) => {
  await prisma.blogChannel.delete({
    where: { id: channelId },
  });

  return { message: 'Канал удалён' };
};

// ============================================================
// Helper: форматирование поста
// ============================================================

const formatPost = (post: any) => ({
  id: post.id,
  author: post.author
    ? {
        id: post.author.id,
        username: post.author.username,
        avatarUrl: post.author.avatarUrl,
      }
    : null,
  channel: post.channel
    ? {
        id: post.channel.id,
        name: post.channel.name,
        description: post.channel.description,
        avatarUrl: post.channel.avatarUrl,
      }
    : null,
  title: post.title,
  content: post.content,
  status: post.status,
  views: post.views,
  categories: post.postCategories?.map((pc: any) => ({
    id: pc.category.id,
    name: pc.category.name,
    slug: pc.category.slug,
  })) || [],
  commentsCount: post.comments?.length || 0,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

const formatChannel = (channel: any) => ({
  id: channel.id,
  name: channel.name,
  description: channel.description,
  avatarUrl: channel.avatarUrl,
  postCount: channel.postCount,
  followers: channel.followers,
  createdAt: channel.createdAt,
  updatedAt: channel.updatedAt,
  posts: channel.posts
    ? channel.posts.map((p: any) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        views: p.views,
        author: p.author
          ? {
              id: p.author.id,
              username: p.author.username,
              avatarUrl: p.author.avatarUrl,
            }
          : null,
        createdAt: p.createdAt,
      }))
    : undefined,
});

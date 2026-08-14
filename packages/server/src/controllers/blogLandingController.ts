// BlogLandingController — REST API для публичного корпоративного блога (blog.balloo.su)
// Тикет №60 — Blog: корпоративный блог (узел 11)

import { Request, Response } from 'express';
import { PrismaClient, BlogPostStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Хранилище подписок на рассылку (в памяти, v2 — таблица)
const newsletterSubscriptions: Set<string> = new Set();

// ============================================================
// GET /api/blog-landing/featured — избранные посты для главной
// ============================================================
export async function getFeaturedPosts(_req: Request, res: Response): Promise<void> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: BlogPostStatus.published },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        channel: true,
        postCategories: { include: { category: true } },
        comments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const formatted = posts.map((p) => formatPost(p));
    res.json({ posts: formatted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// ============================================================
// GET /api/blog-landing/posts — список постов с фильтрацией
// query: page, limit, categoryId, channelId, tag, sort (recent|popular)
// ============================================================
export async function getPosts(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(String(req.query.page), 10) || 1;
    const limit = Math.min(parseInt(String(req.query.limit), 10) || 10, 50);
    const categoryId = req.query.categoryId as string | undefined;
    const channelId = req.query.channelId as string | undefined;
    const sort = (req.query.sort as string) || 'recent';

    const where: any = { status: BlogPostStatus.published };
    if (channelId) where.channelId = channelId;
    if (categoryId) {
      where.postCategories = { some: { categoryId } };
    }

    const orderBy = sort === 'popular' ? { views: 'desc' as const } : { createdAt: 'desc' as const };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          channel: true,
          postCategories: { include: { category: true } },
          comments: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      posts: posts.map((p) => formatPost(p)),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// ============================================================
// GET /api/blog-landing/posts/:id — один пост с полным контентом
// ============================================================
export async function getPost(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const post = await prisma.blogPost.findFirst({
      where: { id, status: BlogPostStatus.published },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        channel: true,
        postCategories: { include: { category: true } },
        comments: {
          include: {
            author: { select: { id: true, username: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!post) {
      res.status(404).json({ error: 'Пост не найден' });
      return;
    }

    // Increment views
    await prisma.blogPost.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Related posts (same channel or category)
    const related = await prisma.blogPost.findMany({
      where: {
        status: BlogPostStatus.published,
        id: { not: id },
        OR: [
          ...(post.channelId ? [{ channelId: post.channelId }] : []),
        ],
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        channel: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    res.json({ post: formatPost(post), related: related.map((p) => formatPost(p)) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// ============================================================
// GET /api/blog-landing/categories — категории блога
// ============================================================
export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.blogCategory.findMany({
      include: {
        postCategories: {
          include: {
            post: { select: { id: true, views: true, status: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = categories.map((cat) => {
      const publishedPosts = cat.postCategories.filter((pc) => pc.post.status === BlogPostStatus.published);
      const totalViews = publishedPosts.reduce((sum, pc) => sum + pc.post.views, 0);
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        postCount: publishedPosts.length,
        totalViews,
      };
    });

    res.json({ categories: formatted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// ============================================================
// GET /api/blog-landing/channels — каналы блога
// ============================================================
export async function getChannels(_req: Request, res: Response): Promise<void> {
  try {
    const channels = await prisma.blogChannel.findMany({
      include: {
        posts: {
          where: { status: BlogPostStatus.published },
          select: { id: true, views: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = channels.map((ch) => ({
      id: ch.id,
      name: ch.name,
      description: ch.description,
      avatarUrl: ch.avatarUrl,
      postCount: ch.posts.length,
      followers: ch.followers,
      totalViews: ch.posts.reduce((sum, p) => sum + p.views, 0),
    }));

    res.json({ channels: formatted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// ============================================================
// POST /api/blog-landing/subscribe — подписка на рассылку
// body: { email }
// ============================================================
export async function subscribeToNewsletter(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Некорректный email' });
      return;
    }

    if (newsletterSubscriptions.has(email)) {
      res.json({ success: true, message: 'Вы уже подписаны на рассылку' });
      return;
    }

    newsletterSubscriptions.add(email);
    res.json({ success: true, message: 'Подписка оформлена успешно' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// ============================================================
// GET /api/blog-landing/search?q= — поиск по постам
// query: q, channelId, page, limit
// ============================================================
export async function searchPosts(req: Request, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string || '').trim();
    const channelId = req.query.channelId as string | undefined;
    const page = parseInt(String(req.query.page), 10) || 1;
    const limit = Math.min(parseInt(String(req.query.limit), 10) || 10, 50);

    if (!q) {
      res.json({ posts: [], total: 0, page, limit, hasMore: false });
      return;
    }

    const where: any = {
      status: BlogPostStatus.published,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ],
    };
    if (channelId) where.channelId = channelId;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          channel: true,
          postCategories: { include: { category: true } },
          comments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      posts: posts.map((p) => formatPost(p, q)),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}

// ============================================================
// Helper: format post for API response
// ============================================================
function formatPost(p: any, highlightQuery?: string) {
  const now = Math.floor(Date.now() / 1000);
  const ageSec = now - Number(p.createdAt);
  const readTime = Math.max(1, Math.ceil(p.content.length / 800));

  return {
    id: p.id,
    title: p.title,
    excerpt: p.content.slice(0, 200) + (p.content.length > 200 ? '…' : ''),
    content: p.content,
    coverEmoji: getCoverEmoji(p),
    coverGradient: getCoverGradient(p),
    channel: p.channel
      ? { id: p.channel.id, name: p.channel.name, description: p.channel.description, avatarUrl: p.channel.avatarUrl }
      : null,
    categories: p.postCategories
      ? p.postCategories.map((pc: any) => ({ id: pc.category.id, name: pc.category.name, slug: pc.category.slug }))
      : [],
    author: {
      id: p.author.id,
      name: p.author.username,
      initials: (p.author.username || '?').slice(0, 2).toUpperCase(),
      avatarUrl: p.author.avatarUrl,
    },
    publishedAt: Number(p.createdAt),
    publishedAtFormatted: formatRelativeDate(Number(p.createdAt)),
    readTime,
    views: p.views,
    reactions: 0,
    comments: p.comments ? p.comments.length : 0,
    tags: extractTags(p.content),
    highlightQuery,
  };
}

function getCoverEmoji(p: any): string {
  const title = (p.title || '').toLowerCase();
  if (title.includes('релиз') || title.includes('release')) return '🚀';
  if (title.includes('дизайн') || title.includes('design')) return '🎨';
  if (title.includes('websocket') || title.includes('realtime')) return '⚡';
  if (title.includes('команд') || title.includes('team')) return '👥';
  if (title.includes('метрик') || title.includes('analytics')) return '📊';
  if (title.includes('безопасн') || title.includes('security')) return '🔒';
  if (title.includes('docker') || title.includes('k8s') || title.includes('devops')) return '🐳';
  if (title.includes('prisma') || title.includes('бд') || title.includes('database')) return '🗄️';
  return '📝';
}

function getCoverGradient(p: any): string {
  const emoji = getCoverEmoji(p);
  const map: Record<string, string> = {
    '🚀': 'linear-gradient(135deg, #1a1d21, #2d3742)',
    '🎨': 'linear-gradient(135deg, #a855f7, #6b21a8)',
    '⚡': 'linear-gradient(135deg, #2db84d, #166534)',
    '👥': 'linear-gradient(135deg, #3b9eff, #1565c0)',
    '📊': 'linear-gradient(135deg, #e8a317, #b45309)',
    '🔒': 'linear-gradient(135deg, #e3422d, #991b1b)',
    '🐳': 'linear-gradient(135deg, #3b9eff, #1565c0)',
    '🗄️': 'linear-gradient(135deg, #e8a317, #b45309)',
    '📝': 'linear-gradient(135deg, #a855f7, #6b21a8)',
  };
  return map[emoji] || 'linear-gradient(135deg, #a855f7, #6b21a8)';
}

function extractTags(content: string): string[] {
  const matches = content.match(/#(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches)].slice(0, 6);
}

function formatRelativeDate(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 3600) return 'только что';
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
  const date = new Date(timestamp * 1000);
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

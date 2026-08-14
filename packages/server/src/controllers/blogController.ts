import { Request, Response, NextFunction } from 'express';
import {
  createPost as createPostService,
  updatePost as updatePostService,
  deletePost as deletePostService,
  getPost as getPostService,
  publishPost as publishPostService,
  getPosts as getPostsService,
  createChannel as createChannelService,
  getChannels as getChannelsService,
  getChannel as getChannelService,
  updateChannel as updateChannelService,
  deleteChannel as deleteChannelService,
} from '../services/blogService';
import { AuthenticatedRequest } from '../middleware/auth';

// ============================================================
// POST /api/blog/posts — создание поста
// ============================================================

export const createPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title, content, channelId, categoryIds } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Bad Request', message: 'Поля "title" и "content" обязательны' });
      return;
    }

    const post = await createPostService(userId, { title, content, channelId, categoryIds });
    res.status(201).json(post);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// GET /api/blog/posts — список постов
// ============================================================

export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, channelId, categoryId, status, authorId } = req.query;

    const result = await getPostsService({
      page: parseInt(String(page), 10) || 1,
      limit: Math.min(parseInt(String(limit), 10) || 20, 50),
      channelId: channelId as string | undefined,
      categoryId: categoryId as string | undefined,
      status: status as any,
      authorId: authorId as string | undefined,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// GET /api/blog/posts/:id — один пост
// ============================================================

export const getPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await getPostService(id);
    res.json(post);
  } catch (error: any) {
    if (error.message === 'Пост не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// PUT /api/blog/posts/:id — обновление поста
// ============================================================

export const updatePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title, content, channelId, status, categoryIds } = req.body;

    const post = await updatePostService(id, { title, content, channelId, status, categoryIds });
    res.json(post);
  } catch (error: any) {
    if (error.message === 'Пост не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// DELETE /api/blog/posts/:id — удаление поста
// ============================================================

export const deletePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await deletePostService(id);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Пост не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// POST /api/blog/posts/:id/publish — публикация поста
// ============================================================

export const publishPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const post = await publishPostService(id, userId);
    res.json(post);
  } catch (error: any) {
    if (error.message === 'Пост не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message === 'Только автор может публиковать пост') {
      res.status(403).json({ error: 'Forbidden', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// GET /api/blog/channels — список каналов
// ============================================================

export const getChannels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, search } = req.query;

    const result = await getChannelsService({
      page: parseInt(String(page), 10) || 1,
      limit: Math.min(parseInt(String(limit), 10) || 20, 50),
      search: search as string | undefined,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// GET /api/blog/channels/:id — канал
// ============================================================

export const getChannel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const channel = await getChannelService(id);
    res.json(channel);
  } catch (error: any) {
    if (error.message === 'Канал не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// POST /api/blog/channels — создание канала
// ============================================================

export const createChannel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Bad Request', message: 'Поле "name" обязательно' });
      return;
    }

    const channel = await createChannelService({ name, description });
    res.status(201).json(channel);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// PUT /api/blog/channels/:id — обновление канала
// ============================================================

export const updateChannel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, avatarUrl } = req.body;

    const channel = await updateChannelService(id, { name, description, avatarUrl });
    res.json(channel);
  } catch (error: any) {
    if (error.message === 'Канал не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// DELETE /api/blog/channels/:id — удаление канала
// ============================================================

export const deleteChannel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await deleteChannelService(id);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Канал не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

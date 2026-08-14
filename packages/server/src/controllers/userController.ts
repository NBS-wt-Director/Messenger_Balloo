import { Request, Response, NextFunction } from 'express';
import {
  getMe as getMeService,
  updateMe as updateMeService,
  getPublicProfile as getPublicProfileService,
  searchUsers as searchUsersService,
  blockUser as blockUserService,
  unblockUser as unblockUserService,
  getBlockedUsers as getBlockedUsersService,
} from '../services/userService';
import { AuthenticatedRequest } from '../middleware/auth';

// ============================================================
// Получить текущего пользователя (/api/users/me)
// ============================================================

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = await getMeService(userId);
    res.json(data);
  } catch (error: any) {
    if (error.message === 'Пользователь не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Обновить профиль текущего пользователя (PUT /api/users/me)
// ============================================================

export const updateMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { username, displayName, bio, website, socialLinks, avatarUrl, language, isPrivate } = req.body;

    const data = await updateMeService(userId, {
      username,
      displayName,
      bio,
      website,
      socialLinks,
      avatarUrl,
      language,
      isPrivate,
    });

    res.json(data);
  } catch (error: any) {
    if (error.message.includes('уже занят')) {
      res.status(409).json({ error: 'Conflict', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Получить публичный профиль по username (GET /api/users/:username)
// ============================================================

export const getPublicProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username } = req.params;
    const viewerId = req.user?.id; // может быть undefined для неавторизованных

    const profile = await getPublicProfileService(username, viewerId);
    res.json(profile);
  } catch (error: any) {
    if (error.message === 'Пользователь не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Поиск пользователей (GET /api/users/search?q=)
// ============================================================

export const searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, page, limit } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Параметр "q" обязателен' });
      return;
    }

    const viewerId = (req as AuthenticatedRequest).user?.id;
    const query = q.trim();
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = Math.min(parseInt(String(limit), 10) || 20, 50); // max 50

    const result = await searchUsersService({
      query: query,
      page: pageNum,
      limit: limitNum,
      viewerId,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

// ============================================================
// Заблокировать пользователя (POST /api/users/:id/block)
// ============================================================

export const blockUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const blockerId = req.user!.id;
    const { id: blockedId } = req.params;

    if (!blockedId) {
      res.status(400).json({ error: 'Bad Request', message: 'User ID обязателен' });
      return;
    }

    const result = await blockUserService(blockerId, blockedId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Пользователь не найден') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else if (error.message === 'Нельзя заблокировать себя') {
      res.status(400).json({ error: 'Bad Request', message: error.message });
    } else if (error.message.includes('уже заблокирован')) {
      res.status(409).json({ error: 'Conflict', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Разблокировать пользователя (DELETE /api/users/:id/block)
// ============================================================

export const unblockUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const blockerId = req.user!.id;
    const { id: blockedId } = req.params;

    if (!blockedId) {
      res.status(400).json({ error: 'Bad Request', message: 'User ID обязателен' });
      return;
    }

    const result = await unblockUserService(blockerId, blockedId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Пользователь не в списке заблокированных') {
      res.status(404).json({ error: 'Not Found', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Error', message: error.message });
    }
  }
};

// ============================================================
// Получить список заблокированных (GET /api/users/me/blocked)
// ============================================================

export const getBlockedUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const blockerId = req.user!.id;
    const blocked = await getBlockedUsersService(blockerId);
    res.json({ blocked });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

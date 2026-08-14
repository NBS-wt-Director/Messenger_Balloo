import { Router } from 'express';

const router = Router() as import('express').Router;
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  publishPost,
  getChannels,
  getChannel,
  createChannel,
  updateChannel,
  deleteChannel,
} from '../controllers/blogController';
import { authRequired } from '../middleware/auth';

// ============================================================
// Blog Posts
// ============================================================

// POST /api/blog/posts — создание поста
router.post('/posts', authRequired, createPost);

// GET /api/blog/posts — список постов
router.get('/posts', getPosts);

// GET /api/blog/posts/:id — один пост
router.get('/posts/:id', getPost);

// PUT /api/blog/posts/:id — обновление поста
router.put('/posts/:id', authRequired, updatePost);

// DELETE /api/blog/posts/:id — удаление поста
router.delete('/posts/:id', authRequired, deletePost);

// POST /api/blog/posts/:id/publish — публикация поста
router.post('/posts/:id/publish', authRequired, publishPost);

// ============================================================
// Blog Channels
// ============================================================

// GET /api/blog/channels — список каналов
router.get('/channels', getChannels);

// GET /api/blog/channels/:id — канал
router.get('/channels/:id', getChannel);

// POST /api/blog/channels — создание канала
router.post('/channels', authRequired, createChannel);

// PUT /api/blog/channels/:id — обновление канала
router.put('/channels/:id', authRequired, updateChannel);

// DELETE /api/blog/channels/:id — удаление канала
router.delete('/channels/:id', authRequired, deleteChannel);

export { router };

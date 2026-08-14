// BlogLanding Router — маршруты для публичного корпоративного блога (blog.balloo.su)
// Тикет №60 — Blog: корпоративный блог (узел 11)

import { Router } from 'express';
import {
  getFeaturedPosts,
  getPosts,
  getPost,
  getCategories,
  getChannels,
  subscribeToNewsletter,
  searchPosts,
} from '../controllers/blogLandingController';

const router = Router() as import('express').Router;

// --- Публичные маршруты (без авторизации) ---

// GET /api/blog-landing/featured — избранные посты
router.get('/featured', getFeaturedPosts);

// GET /api/blog-landing/posts — список постов с фильтрацией
router.get('/posts', getPosts);

// GET /api/blog-landing/posts/:id — один пост
router.get('/posts/:id', getPost);

// GET /api/blog-landing/categories — категории блога
router.get('/categories', getCategories);

// GET /api/blog-landing/channels — каналы блога
router.get('/channels', getChannels);

// POST /api/blog-landing/subscribe — подписка на рассылку
router.post('/subscribe', subscribeToNewsletter);

// GET /api/blog-landing/search?q= — поиск по постам
router.get('/search', searchPosts);

export { router };

import path from 'path';

// Пути к файлам проекта
export const paths = {
  // Корень сервера
  root: path.resolve(__dirname, '../..'),

  // Корень проекта (два уровня вверх от сервера)
  projectRoot: path.resolve(__dirname, '../../..'),

  // Локальные пути (для dev-режима)
  uploads: path.join(path.resolve(__dirname, '../../..'), 'uploads'),
  logs: path.join(path.resolve(__dirname, '../../..'), 'logs'),

  // CDN / медиа (Yandex Object Storage или MinIO)
  cdn: {
    baseUrl: process.env.CDN_BASE_URL || 'http://localhost:9000/balloo-media',
    avatar: {
      sizes: [256, 128, 64] as const,
      defaultUrl: 'http://localhost:9000/balloo-media/defaults/avatar.png',
    },
    chatAvatar: {
      sizes: [256, 128] as const,
      defaultUrl: 'http://localhost:9000/balloo-media/defaults/chat.png',
    },
    story: {
      maxSizeMB: 50,
      maxDurationSec: 60,
    },
    messageFile: {
      maxSizeMB: 50,
      allowedTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm',
        'audio/mpeg', 'audio/ogg', 'audio/webm',
        'application/pdf',
        'application/zip',
      ],
    },
  },

  // Публичные пути
  public: {
    robots: '/robots.txt',
    sitemap: '/sitemap.xml',
  },
};

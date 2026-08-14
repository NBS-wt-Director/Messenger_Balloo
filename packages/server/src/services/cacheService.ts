// ============================================================
// Redis Cache Service — тикет №64 (Performance optimization)
// Кэширование: сессии, профили, чаты, сообщения, блог, feature flags
// ============================================================

import IORedis, { Redis as IORedisType } from 'ioredis';
import { env } from '../config/env';

// --- TTL constants (in seconds) ---
export const TTL = {
  SESSION: 60 * 60 * 24,       // 24h — сессии пользователей
  PROFILE: 5 * 60,             // 5min — публичные профили
  CHAT_LIST: 60,               // 1min — список чатов
  MESSAGE: 30,                 // 30s — сообщения
  BLOG_POST: 10 * 60,          // 10min — посты блога
  BLOG_LIST: 5 * 60,           // 5min — лента блога
  FEATURE_FLAGS: 60 * 60,      // 1h — feature flags
  RATE_LIMIT: 15 * 60,         // 15min — rate limit counters
  METRICS: 60,                 // 1min — метрики
} as const;

// --- Cache key prefixes ---
const KEYS = {
  SESSION: 'sess:',
  PROFILE: 'prof:',
  CHAT_LIST: 'chtl:',
  MESSAGE: 'msg:',
  BLOG_POST: 'bp:',
  BLOG_LIST: 'bll:',
  FEATURE_FLAG: 'ff:',
  RATE_LIMIT: 'rl:',
  METRICS: 'met:',
} as const;

// --- Redis connection ---
let redis: IORedisType | null = null;

export function getRedis(): IORedisType | null {
  if (!redis && env.REDIS_URL) {
    redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Timeout 2s для избежания блокировки
      commandTimeout: 2000,
      // Auto reconnect
      retryStrategy: (times) => {
        if (times > 5) return null; // Не перезапускать после 5 попыток
        return Math.min(times * 200, 2000);
      },
    });

    redis.on('error', (err) => {
      console.warn('[Redis] Connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected');
    });

    // Подключаемся лениво — при первом запросе
    redis.connect().catch(() => {
      redis = null;
    });
  }
  return redis;
}

// --- Generic cache methods ---

async function get<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

async function set(key: string, value: unknown): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value));
  } catch {
    // Redis недоступен — работаем без кэша
  }
}

async function setEx(key: string, value: unknown, ttl: number): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.setex(key, ttl, JSON.stringify(value));
  } catch {
    // Redis недоступен — работаем без кэша
  }
}

async function del(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // Ignore errors
  }
}

// --- Invalidate by prefix ---
async function invalidatePrefix(prefix: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        `${prefix}*`,
        'COUNT',
        '100',
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } while (cursor !== '0');
  } catch {
    // Ignore errors
  }
}

// ============================================================
// Domain-specific cache methods
// ============================================================

export const cacheService = {
  // --- Generic ---
  get<T>(key: string) {
    return get<T>(key);
  },
  set(key: string, value: unknown) {
    return set(key, value);
  },
  // --- Session ---
  getSession(userId: string) {
    return get<Record<string, unknown>>(`${KEYS.SESSION}${userId}`);
  },
  setSession(userId: string, data: Record<string, unknown>) {
    return setEx(`${KEYS.SESSION}${userId}`, data, TTL.SESSION);
  },
  invalidateSession(userId: string) {
    return del(`${KEYS.SESSION}${userId}`);
  },

  // --- Public profile ---
  getProfile(username: string) {
    return get<Record<string, unknown>>(`${KEYS.PROFILE}${username}`);
  },
  setProfile(username: string, data: Record<string, unknown>) {
    return setEx(`${KEYS.PROFILE}${username}`, data, TTL.PROFILE);
  },
  invalidateProfile(username: string) {
    return del(`${KEYS.PROFILE}${username}`);
  },

  // --- Chat list ---
  getChatList(userId: string) {
    return get<any[]>(`${KEYS.CHAT_LIST}${userId}`);
  },
  setChatList(userId: string, data: any[]) {
    return setEx(`${KEYS.CHAT_LIST}${userId}`, data, TTL.CHAT_LIST);
  },
  invalidateChatList(userId: string) {
    return del(`${KEYS.CHAT_LIST}${userId}`);
  },

  // --- Messages ---
  getMessages(chatId: string) {
    return get<any[]>(`${KEYS.MESSAGE}${chatId}`);
  },
  setMessages(chatId: string, data: any[]) {
    return setEx(`${KEYS.MESSAGE}${chatId}`, data, TTL.MESSAGE);
  },
  invalidateMessages(chatId: string) {
    return del(`${KEYS.MESSAGE}${chatId}`);
  },

  // --- Blog ---
  getBlogPost(postId: string) {
    return get<any>(`${KEYS.BLOG_POST}${postId}`);
  },
  setBlogPost(postId: string, data: any) {
    return setEx(`${KEYS.BLOG_POST}${postId}`, data, TTL.BLOG_POST);
  },
  invalidateBlogPost(postId: string) {
    return del(`${KEYS.BLOG_POST}${postId}`);
  },
  getBlogList(channelId?: string) {
    const key = channelId ? `${KEYS.BLOG_LIST}${channelId}` : KEYS.BLOG_LIST;
    return get<any[]>(key);
  },
  setBlogList(channelId: string | undefined, data: any[]) {
    const key = channelId ? `${KEYS.BLOG_LIST}${channelId}` : KEYS.BLOG_LIST;
    return setEx(key, data, TTL.BLOG_LIST);
  },
  invalidateBlogList(channelId?: string) {
    return invalidatePrefix(channelId ? `${KEYS.BLOG_LIST}${channelId}` : KEYS.BLOG_LIST);
  },

  // --- Feature flags ---
  getFeatureFlag(name: string) {
    return get<boolean>(`${KEYS.FEATURE_FLAG}${name}`);
  },
  setFeatureFlag(name: string, enabled: boolean) {
    return setEx(`${KEYS.FEATURE_FLAG}${name}`, enabled, TTL.FEATURE_FLAGS);
  },
  invalidateFeatureFlag(name: string) {
    return del(`${KEYS.FEATURE_FLAG}${name}`);
  },

  // --- Rate limit ---
  getRateLimitKey(identifier: string) {
    return `${KEYS.RATE_LIMIT}${identifier}`;
  },

  // --- Metrics ---
  setMetrics(name: string, data: any) {
    return setEx(`${KEYS.METRICS}${name}`, data, TTL.METRICS);
  },

  // --- Invalidate all for a resource ---
  invalidateByPrefix(prefix: string) {
    return invalidatePrefix(prefix);
  },
};

// --- Graceful shutdown ---
export function shutdownRedis() {
  if (redis) {
    redis.quit().catch(() => {
      // Ignore quit errors
    });
  }
}

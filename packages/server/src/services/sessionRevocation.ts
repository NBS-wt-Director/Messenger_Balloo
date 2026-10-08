// Отзыв активных сессий пользователя («logout everywhere»).
//
// Access-токен — stateless JWT, поэтому отозвать уже выданные токены можно
// только по серверной метке: храним unix-время отзыва пользователя и
// отклоняем любые токены, выпущенные раньше него (iat <= revokedAt).
//
// Redis — общий клиент из cacheService, чтобы на каждый запрос не открывать
// новое соединение (проверка стоит в authRequired, это самый горячий путь).
//
// Fail-open: если Redis недоступен, запрос пропускается. Отзыв — защита от
// токена, украденного до logout; полная недоступность Redis не должна
// превращаться в недоступность всего API.

import { getRedis } from './cacheService';
import { env } from '../config/env';

const KEY_PREFIX = 'revoked-at:';

const revokedAtKey = (userId: string): string => `${KEY_PREFIX}${userId}`;

// fallback на дефолт схемы env (30 дней), если значение не распарсилось
const REFRESH_TTL_FALLBACK_SEC = 2592000;

/**
 * Отзвает все выпущенные ранее сессии пользователя: access-токены (живут
 * до JWT_ACCESS_EXPIRES_IN) и refresh-токены (до JWT_REFRESH_EXPIRES_IN).
 *
 * Ключ живёт столько же, сколько refresh-токен: позже этого срока отзывать
 * нечего — все токены уже истекли сами.
 */
export const revokeAllSessions = async (userId: string): Promise<void> => {
  const client = getRedis();
  if (!client) {
    console.warn('[auth] revokeAllSessions: Redis недоступен, сессии не отозваны');
    return;
  }

  const ttlSec = Number(env.JWT_REFRESH_EXPIRES_IN) || REFRESH_TTL_FALLBACK_SEC;

  try {
    await client.setex(revokedAtKey(userId), ttlSec, String(Math.floor(Date.now() / 1000)));
  } catch (error) {
    console.warn('[auth] revokeAllSessions: запись в Redis не удалась:', (error as Error).message);
  }
};

/**
 * true — токен выдан до отзыва сессий, использовать его нельзя.
 * false — отзыва нет, Redis недоступен или метка повреждена (fail-open).
 */
export const isSessionRevoked = async (
  userId: string,
  issuedAtSec: number
): Promise<boolean> => {
  const client = getRedis();
  if (!client) return false;

  try {
    const raw = await client.get(revokedAtKey(userId));
    if (!raw) return false;

    const revokedAt = Number(raw);
    if (!Number.isFinite(revokedAt)) return false;

    // <= а не <: logout происходит уже после выдачи токена, поэтому токен,
    // попавший в ту же секунду, тоже считается отозванным.
    return issuedAtSec <= revokedAt;
  } catch (error) {
    console.warn('[auth] isSessionRevoked: Redis недоступен:', (error as Error).message);
    return false;
  }
};

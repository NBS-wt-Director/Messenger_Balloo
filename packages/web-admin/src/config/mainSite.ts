// mainSite.ts — адреса главного сайта balloo.su (SSO-хост).
// Админка живёт на отдельном домене (admin.balloo.su), но вход и все
// пользовательские экраны — на balloo.su (hash-роутер: /#/login).
// Токены в httpOnly cookie с domain=.balloo.su (packages/server/src/middleware/auth.ts),
// поэтому после входа на balloo.su админка видит сессию автоматически.
// Тикет 1793259599.

/** Оригин главного сайта: localhost в dev, https://balloo.su на проде. */
export const MAIN_SITE_ORIGIN =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5173'
    : 'https://balloo.su';

/** Ссылка на вход главного сайта (hash-роутер). */
export const MAIN_SITE_LOGIN_URL = `${MAIN_SITE_ORIGIN}/#/login`;

/** Ссылка на чаты главного сайта — для не-админов. */
export const MAIN_SITE_CHAT_URL = `${MAIN_SITE_ORIGIN}/#/chat`;

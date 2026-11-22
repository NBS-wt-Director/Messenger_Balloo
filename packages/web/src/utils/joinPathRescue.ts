// Спасение «плоских» ссылок приглашения (тик. 1795369071).
//
// Роутер приложения — hash (createHashRouter, packages/web/src/router/index.tsx).
// Ссылки, разосланные до фикса (https://balloo.su/join/CODE без «#»), попадают
// на SPA, но hash-роутер смотрит только на location.hash — код приглашения
// терялся, и приглашённый регистрировался без inviteCode.
//
// Здесь до монтирования React переносим pathname вида /join/CODE в хэш
// (/#/join/CODE), чтобы уже разосланные ссылки продолжили работать.

/** Приводит «плоский» /join/CODE к hash-маршруту #/join/CODE. */
export function rescueJoinPath(loc: Location = window.location): boolean {
  const match = /^\/join\/([^/?#]+)\/?$/.exec(loc.pathname);
  if (!match) return false;
  // Уже есть hash-маршрут — ничего не трогаем.
  if (loc.hash.startsWith('#/join/')) return false;
  const code = match[1];
  loc.replace(`${loc.origin}/#/join/${code}${loc.search}`);
  return true;
}

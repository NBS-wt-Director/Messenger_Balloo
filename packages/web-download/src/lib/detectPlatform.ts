// detectPlatform — определение ОС посетителя для подсветки «вашей» платформы
// на download.balloo.su (тик. 1795683301).

export type PlatformKey = 'win' | 'mac' | 'linux' | 'android' | 'ios' | 'pwa';

/**
 * Платформа по userAgent. Возвращает 'pwa', если определить не удалось —
 * веб-версия доступна всегда, поэтому это безопасный дефолт.
 */
export function detectPlatform(ua?: string): PlatformKey {
  const agent =
    ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const s = agent.toLowerCase();

  if (/android/.test(s)) return 'android';
  if (/iphone|ipad|ipod/.test(s)) return 'ios';
  if (/win/.test(s)) return 'win';
  if (/mac os x|macintosh/.test(s)) return 'mac';
  if (/linux|x11/.test(s)) return 'linux';
  return 'pwa';
}

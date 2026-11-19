// pairLink.ts — разбор deep-link привязки устройства (тик. 1795101592)
//
// QR на экране «Добавить устройство» содержит `balloo://pair/<token>`,
// где token — 48 hex-символов (deviceService.createPairToken: randomBytes(24)).
// Сканер на авторизованном устройстве декодирует QR и должен достать токен,
// чтобы отправить его в POST /api/devices/pair/confirm.
//
// Функция вынесена отдельно от экрана, чтобы её можно было проверить
// юнит-тестом без камеры.

/** Токен привязки: ровно 48 hex-символов (см. deviceService.ts). */
const TOKEN_RE = /^[a-f0-9]{48}$/;

/**
 * Извлекает токен из строки QR-кода.
 * Принимает как полный deep-link `balloo://pair/<token>`, так и «голый» токен
 * (некоторые сканеры отдают только payload). Возвращает null, если строка
 * не является корректным кодом привязки.
 */
export function parsePairDeepLink(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;

  // Голый токен
  if (TOKEN_RE.test(text)) return text;

  // balloo://pair/<token> — регистр схемы не важен, хвостовой слэш допустим
  const m = text.match(/^balloo:\/\/pair\/([a-f0-9]{48})\/?$/i);
  if (m) return m[1].toLowerCase();

  return null;
}

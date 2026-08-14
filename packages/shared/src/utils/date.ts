// Date and timestamp utilities

/**
 * Convert Unix timestamp (seconds) to Date object
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Convert Date object to Unix timestamp (seconds)
 */
export function dateToTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Get current Unix timestamp in seconds
 */
export function nowTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Format timestamp as relative time string (e.g. "2 мин назад", "3 часа назад")
 */
export function formatRelativeTime(timestamp: number, locale: string = 'ru'): string {
  const now = nowTimestamp();
  const diff = now - timestamp;

  if (diff < 0) {
    // Future date — return as-is
    return timestampToDate(timestamp).toLocaleString(locale);
  }

  const seconds = diff;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return 'только что';
  }
  if (minutes < 60) {
    if (minutes === 1) return '1 мин назад';
    if (minutes < 5) return `${minutes} мин назад`;
    return `${minutes} мин назад`;
  }
  if (hours < 24) {
    if (hours === 1) return '1 час назад';
    return `${hours} ч назад`;
  }
  if (days === 1) return 'вчера';
  if (days === 0) return 'сегодня';
  if (days < 7) return `${days} дн назад`;
  if (weeks < 5) return `${weeks} нед назад`;
  if (months < 12) return `${months} мес назад`;
  return `${years} г назад`;
}

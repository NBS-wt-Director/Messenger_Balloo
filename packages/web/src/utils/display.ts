// Null-safe отображение имени пользователя.
//
// User.displayName и User.username объявлены nullable в Prisma-схеме
// (packages/shared/prisma/schema.prisma:123,127): OAuth-регистрация без имени
// даёт null в обоих полях. Прямой вызов `displayName.split(' ')` на null
// ронял весь экран чатов в ErrorBoundary (тик. 1795362308, прод 22.11.2026).

export interface NameSource {
  displayName?: string | null;
  username?: string | null;
}

const FALLBACK_NAME = 'Пользователь';

/** Имя для отображения: displayName → username → «Пользователь». */
export function displayNameOf(user: NameSource | null | undefined): string {
  const name = user?.displayName?.trim();
  if (name) return name;
  const login = user?.username?.trim();
  return login || FALLBACK_NAME;
}

/**
 * Инициалы для заглушки аватара: «Иван Петров» → «ИП», «mark» → «M».
 * Пустое/отсутствующее имя даёт «??» вместо падения.
 */
export function initialsOf(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '??';
  return words
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

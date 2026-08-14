// HistoryService — бизнес-логика истории версий
// Тикет №56 — History: changelog (узел 05)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ChangelogSection {
  new?: string[];
  improved?: string[];
  fixed?: string[];
  security?: string[];
  known_issues?: string[];
}

export interface ChangelogData {
  title: string;
  icon: string;
  type: 'major' | 'minor' | 'patch';
  status: 'released' | 'planned';
  summary: string;
  expectedAt?: string;
  sections: ChangelogSection;
  stats?: Record<string, number>;
}

/**
 * Парсит changelog (Text поле) в структурированный объект.
 * Если поле пустое или невалидный JSON — возвращает заглушку.
 */
export function parseChangelog(raw: string | null | undefined): ChangelogData {
  if (!raw) {
    return {
      title: '',
      icon: '📦',
      type: 'patch',
      status: 'released',
      summary: '',
      sections: {},
    };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      title: parsed.title || '',
      icon: parsed.icon || '📦',
      type: parsed.type || 'patch',
      status: parsed.status || 'released',
      summary: parsed.summary || '',
      expectedAt: parsed.expectedAt,
      sections: parsed.sections || {},
      stats: parsed.stats,
    };
  } catch {
    // Если changelog — простой текст, оборачиваем в базовую структуру
    return {
      title: '',
      icon: '📦',
      type: 'patch',
      status: 'released',
      summary: raw.slice(0, 200),
      sections: { new: [raw] },
    };
  }
}

/**
 * Список версий с пагинацией и фильтрацией.
 */
export async function getVersions(params: {
  status?: string; // released | planned
  page?: number;
  limit?: number;
} = {}) {
  const { status, page = 1, limit = 50 } = params;
  const where: any = {};

  if (status === 'released') {
    where.publishedAt = { gt: 0 };
  } else if (status === 'planned') {
    where.publishedAt = 0;
  }

  const [items, total] = await Promise.all([
    prisma.serviceVersion.findMany({
      where,
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.serviceVersion.count({ where }),
  ]);

  // Дополняем каждую версию распарсенным changelog
  const enriched = items.map((v) => {
    const changelog = parseChangelog(v.changelog);
    return {
      id: v.id,
      version: v.version,
      publishedAt: v.publishedAt,
      isLatest: v.isLatest,
      createdAt: v.createdAt,
      title: changelog.title,
      icon: changelog.icon,
      type: changelog.type,
      status: changelog.status,
      summary: changelog.summary,
      expectedAt: changelog.expectedAt,
    };
  });

  return {
    items: enriched,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Детальная информация о версии (по id или version-строке).
 */
export async function getVersion(idOrVersion: string) {
  // Пытаемся найти по id, затем по version
  let version = await prisma.serviceVersion.findUnique({
    where: { id: idOrVersion },
  });

  if (!version) {
    version = await prisma.serviceVersion.findUnique({
      where: { version: idOrVersion },
    });
  }

  if (!version) return null;

  const changelog = parseChangelog(version.changelog);

  return {
    id: version.id,
    version: version.version,
    publishedAt: version.publishedAt,
    isLatest: version.isLatest,
    createdAt: version.createdAt,
    changelog,
  };
}

/**
 * Соседние версии (предыдущая / следующая) для навигации.
 */
export async function getVersionNeighbors(idOrVersion: string) {
  const current = await getVersion(idOrVersion);
  if (!current) return null;

  const currentSort = current.publishedAt > 0 ? current.publishedAt : current.createdAt;

  // Предыдущая (старая) — publishedAt/createdAt меньше текущей
  const prev = await prisma.serviceVersion.findFirst({
    where: {
      OR: [
        { publishedAt: { lt: currentSort, gt: 0 } },
        { publishedAt: 0, createdAt: { lt: currentSort } },
      ],
    },
    orderBy: [
      { publishedAt: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // Следующая (новая) — publishedAt/createdAt больше текущей
  const next = await prisma.serviceVersion.findFirst({
    where: {
      OR: [
        { publishedAt: { gt: currentSort } },
        { publishedAt: 0, createdAt: { gt: currentSort } },
      ],
    },
    orderBy: [
      { publishedAt: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return {
    prev: prev ? { id: prev.id, version: prev.version } : null,
    next: next ? { id: next.id, version: next.version } : null,
  };
}

/**
 * Сравнение двух версий (diff).
 * Возвращает добавленные и удалённые пункты changelog.
 */
export async function compareVersions(v1: string, v2: string) {
  const version1 = await getVersion(v1);
  const version2 = await getVersion(v2);

  if (!version1 || !version2) {
    return null;
  }

  const sections1 = version1.changelog.sections;
  const sections2 = version2.changelog.sections;

  // Собираем все ключи секций
  const allKeys = Array.from(
    new Set([...Object.keys(sections1), ...Object.keys(sections2)])
  ) as (keyof ChangelogSection)[];

  const diff: Record<string, { added: string[]; removed: string[] }> = {};

  for (const key of allKeys) {
    const list1 = sections1[key] || [];
    const list2 = sections2[key] || [];

    const added = list2.filter((item) => !list1.includes(item));
    const removed = list1.filter((item) => !list2.includes(item));

    if (added.length > 0 || removed.length > 0) {
      diff[key] = { added, removed };
    }
  }

  return {
    v1: {
      id: version1.id,
      version: version1.version,
      publishedAt: version1.publishedAt,
      title: version1.changelog.title,
    },
    v2: {
      id: version2.id,
      version: version2.version,
      publishedAt: version2.publishedAt,
      title: version2.changelog.title,
    },
    diff,
  };
}

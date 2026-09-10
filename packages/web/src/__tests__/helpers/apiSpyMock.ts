/**
 * Универсальный мок api для smoke-тестов экранов.
 * Не импортирует vitest (вызов import('vitest') внутри vi.mock-фабрики
 * приводит к дедлоку в vitest 2.0) — используются простые функции-шпионы.
 *
 * Любой метод api возвращает Promise с "универсальным" ответом,
 * содержащим пустые массивы/объекты под типичные структуры ответов.
 */
export function createUniversalApiMock(): Record<string, unknown> {
  // Базовый ответ — массив с навешанными полями: экраны ожидают и массив
  // (announcements.filter, devices.map), и объект ответа (res.items, res.user).
  // Массив truthy, поддерживает .filter/.map и несёт все типичные поля ответа.
  const emptyResponse = Object.assign([] as unknown[], {
    items: [],
    chats: [],
    data: [],
    users: [],
    reports: [],
    calls: [],
    devices: [],
    notifications: [],
    tasks: [],
    posts: [],
    versions: [],
    categories: [],
    comments: [],
    messages: [],
    stories: [],
    polls: [],
    results: [],
    members: [],
    logs: [],
    announcements: [],
    flags: [],
    downloads: [],
    donations: [],
    tiers: [],
    vacancies: [],
    applications: [],
    departments: [],
    pages: [],
    archived: [],
    total: 0,
    count: 0,
    unreadCount: 0,
    stats: {},
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    user: null,
    settings: {},
    chat: null,
    message: null,
    success: true,
    ok: true,
  });

  const cache = new Map<string, unknown>();

  return new Proxy({} as Record<string, unknown>, {
    get(_target, prop: string | symbol) {
      if (typeof prop !== 'string') return undefined;
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
      if (!cache.has(prop)) {
        const calls: unknown[][] = [];
        const fn = (...args: unknown[]) => {
          calls.push(args);
          return Promise.resolve(emptyResponse);
        };
        (fn as unknown as { _calls: unknown[][] })._calls = calls;
        cache.set(prop, fn);
      }
      return cache.get(prop);
    },
  });
}

// api.ts — минимальный HTTP-клиент админ-панели (тик. 1795888510).
//
// Не переиспользует `@/services/api` из packages/web: тот на 401 уводит на
// `#/login` главного SPA (hash-роутер balloo.su), а на admin.balloo.su такого
// маршрута нет — пользователь видел 404 вместо объяснения. Здесь никаких
// редиректов: ошибка возвращается вызывающему, решение принимает AdminGuard.
//
// Авторизация переносится с основного домена: cookie сессии выставлена сервером
// с domain=.balloo.su (packages/server/src/middleware/auth.ts), поэтому здесь
// достаточно `credentials: 'include'`.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3100';

export class AdminApiError extends Error {
  readonly status?: number;
  /** true — сбой временный (429/5xx/сеть), сессия не потеряна. */
  readonly transient: boolean;

  constructor(message: string, status?: number, transient = false) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.transient = transient;
  }
}

async function request<T>(
  endpoint: string,
  options: { method?: string; data?: unknown } = {}
): Promise<T> {
  const { method = 'GET', data } = options;

  const headers: Record<string, string> = {};
  if (data !== undefined) headers['Content-Type'] = 'application/json';

  const doFetch = () =>
    fetch(`${API_BASE}${endpoint}`, {
      method,
      credentials: 'include',
      headers,
      body: data === undefined ? undefined : JSON.stringify(data),
    });

  let response = await doFetch();

  // 401 — пробуем обновить cookie один раз (та же схема, что в основном клиенте),
  // но без навигации: не удалось — отдаём ошибку наверх.
  if (response.status === 401 && !endpoint.startsWith('/api/auth/')) {
    const refresh = await fetch(`${API_BASE}/api/auth/refresh-cookie`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => null);

    if (refresh?.ok) {
      response = await doFetch();
    } else if (!refresh || refresh.status >= 500) {
      throw new AdminApiError('Сервис временно недоступен', refresh?.status, true);
    } else {
      throw new AdminApiError('Требуется вход', refresh?.status ?? 401);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    const transient = response.status === 429 || response.status >= 500;
    throw new AdminApiError(error.message || 'Ошибка API', response.status, transient);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

/** Пользователь в ответе /api/users/me — только нужные админке поля. */
export interface AdminUser {
  id: string;
  email?: string | null;
  username?: string | null;
  displayName?: string;
  avatarUrl?: string | null;
  role: string;
  isAdmin: boolean;
  balancePoints?: number;
}

export interface TeamApplication {
  id: string;
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  message: string | null;
  status: 'new' | 'accepted' | 'rejected';
  createdAt: number;
  updatedAt: number;
  reviewedAt: number | null;
  lastMessageAt: number | null;
}

export const adminApi = {
  /** Текущий пользователь по cookie основного домена (SSO). */
  getMe: () => request<AdminUser>('/api/users/me'),

  /** Подать заявку в команду Balloo. */
  submitTeamApplication: (message?: string) =>
    request<TeamApplication>('/api/team-applications', {
      method: 'POST',
      data: { message },
    }),

  listTeamApplications: (status?: string) =>
    request<{ applications: TeamApplication[] }>(
      `/api/admin/team-applications${status ? `?status=${encodeURIComponent(status)}` : ''}`
    ),

  acceptTeamApplication: (id: string) =>
    request<{ application: TeamApplication; granted: boolean }>(
      `/api/admin/team-applications/${id}/accept`,
      { method: 'POST' }
    ),

  rejectTeamApplication: (id: string) =>
    request<{ application: TeamApplication }>(
      `/api/admin/team-applications/${id}/reject`,
      { method: 'POST' }
    ),

  messageTeamApplicant: (id: string, text: string) =>
    request<{ message: { id: string } }>(
      `/api/admin/team-applications/${id}/message`,
      { method: 'POST', data: { text } }
    ),

  /** Смена роли — только superadmin (сервер вернёт 403 остальным). */
  setUserRole: (userId: string, role: 'admin' | 'user') =>
    request<{ id: string; role: string }>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      data: { role },
    }),
};

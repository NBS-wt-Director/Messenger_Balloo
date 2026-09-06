// API Service — Mobile HTTP client
// Uses fetch with JWT token management adapted for React Native

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3100';

// ============================================================
// Хранение токенов (мобильные клиенты: Bearer-заголовок + AsyncStorage)
// ============================================================

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  await AsyncStorage.setItem('balloo-accessToken', tokens.accessToken);
  await AsyncStorage.setItem('balloo-refreshToken', tokens.refreshToken);
}

export async function clearAuthTokens(): Promise<void> {
  await AsyncStorage.multiRemove([
    'balloo-accessToken',
    'balloo-refreshToken',
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem('balloo-accessToken');
}

interface ApiOptions extends RequestInit {
  data?: unknown;
}

async function request<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { data, headers: customHeaders, ...rest } = options;

  const token = await AsyncStorage.getItem('balloo-accessToken');
  const refreshToken = await AsyncStorage.getItem('balloo-refreshToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...rest,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  let response = await fetch(`${API_BASE}${endpoint}`, config);

  // If 401, try refresh token (mobile clients: tokens returned in body)
  if (response.status === 401 && refreshToken) {
    try {
      const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
        body: JSON.stringify({ client: 'mobile' }),
      });

      if (refreshResponse.ok) {
        const refreshed = await refreshResponse.json();
        const { accessToken, refreshToken: newRefresh } = refreshed.tokens || {};
        if (accessToken && newRefresh) {
          await AsyncStorage.setItem('balloo-accessToken', accessToken);
          await AsyncStorage.setItem('balloo-refreshToken', newRefresh);

          // Retry original request with new token
          headers['Authorization'] = `Bearer ${accessToken}`;
          response = await fetch(`${API_BASE}${endpoint}`, {
            ...rest,
            headers,
            body: data ? JSON.stringify(data) : undefined,
          });
        }
      }
    } catch {
      // Refresh failed — clear tokens
      await AsyncStorage.multiRemove([
        'balloo-accessToken',
        'balloo-refreshToken',
      ]);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new Error(error.message || 'API Error');
  }

  return response.json();
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: any;
  // Токены возвращаются в body только для мобильных клиентов (deviceInfo.type=mobile)
  tokens?: AuthTokens;
  needs2FA?: boolean;
}

export const api = {
  // Auth
  // deviceInfo.type должен совпадать с Prisma-enum DeviceType: web | desktop | android | ios
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      data: { email, password, deviceInfo: { type: 'android', name: 'Android' } },
    }),

  register: (data: {
    email: string;
    password: string;
    username: string;
    displayName?: string;
  }) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      data: { ...data, deviceInfo: { type: 'android', name: 'Android' } },
    }),

  // Верификация 2FA после логина (needs2FA=true)
  verify2FALogin: (email: string, code: string) =>
    request<AuthResponse>('/api/auth/2fa/verify', {
      method: 'POST',
      data: { email, code, deviceInfo: { type: 'android', name: 'Android' } },
    }),

  verifyEmail: (code: string) =>
    request<{ success: boolean }>('/api/auth/verify-email', {
      method: 'POST',
      data: { code },
    }),

  requestPasswordReset: (email: string) =>
    request<{ success: boolean; email: string }>('/api/auth/request-reset', {
      method: 'POST',
      data: { email },
    }),

  resetPassword: (token: string, password: string) =>
    request<{ success: boolean }>('/api/auth/reset-password', {
      method: 'POST',
      data: { token, password },
    }),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  getMe: () => request<any>('/api/users/me'),

  updateMe: (data: Partial<any>) =>
    request<any>('/api/users/me', { method: 'PUT', data }),

  // 2FA
  enable2FA: () =>
    request<{ qrCode: string; secret: string; backupCodes: string[] }>(
      '/api/auth/2fa/enable',
      { method: 'POST' }
    ),

  verify2FA: (code: string) =>
    request<{ success: boolean; backupCodes?: string[] }>(
      '/api/auth/2fa/verify',
      { method: 'POST', data: { code } }
    ),

  disable2FA: (password: string) =>
    request<{ success: boolean }>('/api/auth/2fa/disable', {
      method: 'POST',
      data: { password },
    }),

  // Users
  searchUsers: (query: string) =>
    request<any[]>('/api/users/search', { method: 'GET' }),

  blockUser: (userId: string) =>
    request<{ success: boolean }>(`/api/users/${userId}/block`, {
      method: 'POST',
    }),

  unblockUser: (userId: string) =>
    request<{ success: boolean }>(`/api/users/${userId}/block`, {
      method: 'DELETE',
    }),

  getBlockedUsers: () => request<any[]>('/api/users/blocked'),

  // Chats
  // Сервер возвращает { chats: [...], pagination } — тип any, маппинг на клиенте
  getChats: (cursor?: string, limit = 50) =>
    request<any>('/api/chats', { method: 'GET' }),

  createChat: (data: { type: string; name: string; description?: string }) =>
    request<any>('/api/chats', { method: 'POST', data }),

  getChatInfo: (chatId: string) => request<any>(`/api/chats/${chatId}`),

  updateChat: (chatId: string, data: any) =>
    request<any>(`/api/chats/${chatId}`, { method: 'PUT', data }),

  deleteChat: (chatId: string) =>
    request<{ success: boolean }>(`/api/chats/${chatId}`, { method: 'DELETE' }),

  addMember: (chatId: string, userId: string, role?: string) =>
    request<any>(`/api/chats/${chatId}/members`, {
      method: 'POST',
      data: { userId, role },
    }),

  removeMember: (chatId: string, userId: string) =>
    request<{ success: boolean }>(`/api/chats/${chatId}/members/${userId}`, {
      method: 'DELETE',
    }),

  joinByInvite: (code: string) =>
    request<any>(`/api/chats/invite/${code}`, { method: 'POST' }),

  createInviteLink: (chatId: string, maxUses?: number, expiresAt?: string) =>
    request<any>(`/api/chats/${chatId}/invite`, {
      method: 'POST',
      data: { maxUses, expiresAt },
    }),

  leaveChat: (chatId: string) =>
    request<{ success: boolean }>(`/api/chats/${chatId}/leave`, {
      method: 'POST',
    }),

  // Messages
  // Сервер возвращает { messages: [...], pagination } — тип any, маппинг на клиенте
  getMessages: (chatId: string, cursor?: string, limit = 50) =>
    request<any>(`/api/chats/${chatId}/messages`, { method: 'GET' }),

  sendMessage: (
    chatId: string,
    data: { type: string; content: string; replyToId?: string }
  ) =>
    request<any>(`/api/chats/${chatId}/messages`, { method: 'POST', data }),

  updateMessage: (messageId: string, content: string) =>
    request<any>(`/api/messages/${messageId}`, {
      method: 'PUT',
      data: { content },
    }),

  deleteMessage: (messageId: string) =>
    request<{ success: boolean }>(`/api/messages/${messageId}`, {
      method: 'DELETE',
    }),

  reactToMessage: (messageId: string, emoji: string) =>
    request<any>(`/api/messages/${messageId}/reactions`, {
      method: 'POST',
      data: { emoji },
    }),

  getMessageReadStatus: (messageId: string) =>
    request<any>(`/api/messages/${messageId}/read`),

  // Upload
  uploadAvatar: (file: any) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/api/upload/avatar', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  uploadFile: (file: any) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/api/upload/file', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  // Stories
  createStory: (media: any, type: string) => {
    const formData = new FormData();
    formData.append('media', media);
    formData.append('type', type);
    return request<any>('/api/stories', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  getStories: (userId?: string) =>
    request<any[]>('/api/stories', { method: 'GET' }),

  getStoryViews: (storyId: string) =>
    request<any[]>(`/api/stories/${storyId}/views`),

  addStoryReaction: (storyId: string, emoji: string) =>
    request<any>(`/api/stories/${storyId}/reactions`, {
      method: 'POST',
      data: { emoji },
    }),

  deleteStory: (storyId: string) =>
    request<{ success: boolean }>(`/api/stories/${storyId}`, {
      method: 'DELETE',
    }),

  // Polls
  createPoll: (
    chatId: string,
    data: {
      question: string;
      options: string[];
      allowsMultiple: boolean;
      expiresAt?: string;
    }
  ) =>
    request<any>(`/api/chats/${chatId}/polls`, { method: 'POST', data }),

  votePoll: (pollId: string, optionIndex: number | number[]) =>
    request<any>(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      data: { optionIndex },
    }),

  getPollResults: (pollId: string) =>
    request<any>(`/api/polls/${pollId}/results`),

  deletePoll: (pollId: string) =>
    request<{ success: boolean }>(`/api/polls/${pollId}`, {
      method: 'DELETE',
    }),

  // Blog
  getBlogPosts: (cursor?: string, limit = 20) =>
    request<any[]>('/api/blog/posts', { method: 'GET' }),

  getBlogPost: (postId: string) => request<any>(`/api/blog/posts/${postId}`),

  createBlogPost: (data: {
    title: string;
    content: string;
    channelId?: string;
    categoryId?: string;
  }) => request<any>('/api/blog/posts', { method: 'POST', data }),

  updateBlogPost: (postId: string, data: any) =>
    request<any>(`/api/blog/posts/${postId}`, { method: 'PUT', data }),

  deleteBlogPost: (postId: string) =>
    request<{ success: boolean }>(`/api/blog/posts/${postId}`, {
      method: 'DELETE',
    }),

  getBlogChannels: () => request<any[]>('/api/blog/channels'),

  followChannel: (channelId: string) =>
    request<any>(`/api/blog/channels/${channelId}/follow`, {
      method: 'POST',
    }),

  unfollowChannel: (channelId: string) =>
    request<any>(`/api/blog/channels/${channelId}/follow`, {
      method: 'DELETE',
    }),

  // Knowledge
  getKnowledgePages: (categoryId?: string) =>
    request<any[]>('/api/knowledge/pages', { method: 'GET' }),

  getKnowledgePage: (pageId: string) =>
    request<any>(`/api/knowledge/pages/${pageId}`),

  createKnowledgePage: (data: {
    title: string;
    content: string;
    categoryId: string;
  }) => request<any>('/api/knowledge/pages', { method: 'POST', data }),

  updateKnowledgePage: (pageId: string, data: any) =>
    request<any>(`/api/knowledge/pages/${pageId}`, { method: 'PUT', data }),

  deleteKnowledgePage: (pageId: string) =>
    request<{ success: boolean }>(`/api/knowledge/pages/${pageId}`, {
      method: 'DELETE',
    }),

  getKnowledgeCategories: () => request<any[]>('/api/knowledge/categories'),

  // Hiring
  getVacancies: (departmentId?: string) =>
    request<any[]>('/api/hiring/vacancies', { method: 'GET' }),

  getVacancy: (vacancyId: string) =>
    request<any>(`/api/hiring/vacancies/${vacancyId}`),

  applyVacancy: (
    vacancyId: string,
    data: { coverLetter: string; resumeUrl: string }
  ) =>
    request<any>(`/api/hiring/vacancies/${vacancyId}/apply`, {
      method: 'POST',
      data,
    }),

  getMyApplications: () => request<any[]>('/api/hiring/applications/me'),

  getDepartments: () => request<any[]>('/api/hiring/departments'),

  // Admin
  getAdminUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => request<any>('/api/admin/users', { method: 'GET' }),

  banUser: (userId: string, data: { reason: string; expiresAt?: string }) =>
    request<any>(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      data,
    }),

  unbanUser: (userId: string) =>
    request<any>(`/api/admin/users/${userId}/unban`, { method: 'POST' }),

  getReports: (status?: string) =>
    request<any[]>('/api/admin/reports', { method: 'GET' }),

  resolveReport: (reportId: string, data: { action: string; comment: string }) =>
    request<any>(`/api/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      data,
    }),

  getBans: (type?: string) =>
    request<any[]>('/api/admin/bans', { method: 'GET' }),

  getAnnouncements: () => request<any[]>('/api/admin/announcements'),

  createAnnouncement: (data: {
    title: string;
    content: string;
    targetAudience: string;
    activeFrom: string;
    activeUntil?: string;
  }) => request<any>('/api/admin/announcements', { method: 'POST', data }),

  getFeatureFlags: () => request<any[]>('/api/admin/feature-flags'),

  toggleFeatureFlag: (flagId: string) =>
    request<any>(`/api/admin/feature-flags/${flagId}/toggle`, {
      method: 'POST',
    }),

  getMetrics: () => request<any>('/api/admin/metrics'),

  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    adminId?: string;
  }) => request<any>('/api/admin/audit-logs', { method: 'GET' }),

  // Contacts
  getContacts: () => request<any[]>('/api/users/contacts'),

  addContact: (userId: string) =>
    request<{ success: boolean }>(`/api/users/contacts/${userId}`, {
      method: 'POST',
    }),

  removeContact: (userId: string) =>
    request<{ success: boolean }>(`/api/users/contacts/${userId}`, {
      method: 'DELETE',
    }),

  getUserPublicProfile: (username: string) =>
    request<any>(`/api/users/${username}`, { method: 'GET' }),

  getMyDevices: () => request<any[]>('/api/users/me/devices'),

  removeDevice: (deviceId: string) =>
    request<{ success: boolean }>(`/api/users/me/devices/${deviceId}`, {
      method: 'DELETE',
    }),

  createDonation: (data: { tierId: string; amount: number }) =>
    request<any>('/api/payments/donate', { method: 'POST', data }),

  getDonationTiers: () => request<any[]>('/api/payments/tiers'),

  getUserDonations: () => request<any[]>('/api/users/me/donations'),
};
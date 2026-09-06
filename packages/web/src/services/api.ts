// API Service — HTTP client for Balloo backend
// JWT tokens stored in httpOnly cookies (not localStorage)
// Browser automatically sends httpOnly cookies with requests

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3100';

interface ApiOptions extends RequestInit {
  data?: unknown;
}

async function request<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { data, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  const config: RequestInit = {
    ...rest,
    credentials: 'include', // Отправлять httpOnly cookie с запросом
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  let response = await fetch(`${API_BASE}${endpoint}`, config);

  // If 401, try refresh token via httpOnly cookie
  if (response.status === 401) {
    try {
      // Сервер берёт refresh token из cookie (body не нужен)
      const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh-cookie`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        // Retry original request with fresh cookies
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...rest,
          credentials: 'include',
          headers,
          body: data ? JSON.stringify(data) : undefined,
        });
      } else {
        // Refresh failed — redirect to login
        window.location.hash = '#/login';
        throw new Error('Session expired. Please login again.');
      }
    } catch {
      // Refresh failed — redirect to login
      window.location.hash = '#/login';
      throw new Error('Session expired. Please login again.');
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

export const api = {
  // Generic GET (для публичных endpoints)
  get: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'GET', data: undefined }),

  // Generic POST
  post: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, { method: 'POST', data }),

  // Generic DELETE
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),

  // Generic request (для FormData и кастомных опций)
  request: <T>(endpoint: string, options: RequestInit & { data?: unknown } = {}) =>
    request<T>(endpoint, options),

  // Auth
  login: (email: string, password: string) =>
    request<{ user: any }>('/api/auth/login', {
      method: 'POST',
      data: { email, password },
    }),

  register: (data: {
    email: string;
    password: string;
    username: string;
    displayName?: string;
  }) =>
    request<{ user: any }>('/api/auth/register', {
      method: 'POST',
      data,
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
    request<{ success: boolean }>('/api/auth/clear-cookie', {
      method: 'POST',
    }),

  getMe: () =>
    request<any>('/api/users/me'),

  updateMe: (data: Partial<any>) =>
    request<any>(`/api/users/me`, {
      method: 'PUT',
      data,
    }),

  // 2FA
  enable2FA: () =>
    request<{ qrCode: string; secret: string; backupCodes: string[] }>(
      '/api/auth/2fa/enable',
      { method: 'POST' }
    ),

  verify2FA: (code: string) =>
    request<{ success: boolean; backupCodes?: string[] }>('/api/auth/2fa/verify', {
      method: 'POST',
      data: { code },
    }),

  disable2FA: (password: string) =>
    request<{ success: boolean }>('/api/auth/2fa/disable', {
      method: 'POST',
      data: { password },
    }),

  // Users
  searchUsers: (query: string) =>
    request<any[]>(`/api/users/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    }),

  blockUser: (userId: string) =>
    request<{ success: boolean }>(`/api/users/${userId}/block`, {
      method: 'POST',
    }),

  unblockUser: (userId: string) =>
    request<{ success: boolean }>(`/api/users/${userId}/block`, {
      method: 'DELETE',
    }),

  getBlockedUsers: () =>
    request<any[]>('/api/users/blocked'),

  // Chats
  getChats: (cursor?: string, limit = 50) =>
    request<any[]>('/api/chats', {
      method: 'GET',
      data: undefined,
    }),

  createChat: (data: { type: string; name: string; description?: string }) =>
    request<any>('/api/chats', {
      method: 'POST',
      data,
    }),

  getChatInfo: (chatId: string) =>
    request<any>(`/api/chats/${chatId}`),

  updateChat: (chatId: string, data: any) =>
    request<any>(`/api/chats/${chatId}`, {
      method: 'PUT',
      data,
    }),

  deleteChat: (chatId: string) =>
    request<{ success: boolean }>(`/api/chats/${chatId}`, {
      method: 'DELETE',
    }),

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
    request<any>(`/api/chats/invite/${code}`, {
      method: 'POST',
    }),

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
  getMessages: (chatId: string, cursor?: string, limit = 50) =>
    request<any[]>(`/api/chats/${chatId}/messages`, {
      method: 'GET',
      data: undefined,
    }),

  sendMessage: (chatId: string, data: { type: string; content: string; replyToId?: string }) =>
    request<any>(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      data,
    }),

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
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/api/upload/avatar', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/api/upload/file', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  // Stories
  createStory: (media: File, type: string) => {
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
    request<any[]>('/api/stories', {
      method: 'GET',
      data: undefined,
    }),

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
  createPoll: (chatId: string, data: {
    question: string;
    options: string[];
    allowsMultiple: boolean;
    expiresAt?: string;
  }) =>
    request<any>(`/api/chats/${chatId}/polls`, {
      method: 'POST',
      data,
    }),

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
  getBlogPosts: (cursor?: string, limit = 20, channelId?: string, categoryId?: string) =>
    request<any[]>('/api/blog/posts', {
      method: 'GET',
      data: undefined,
    }),

  getBlogPost: (postId: string) =>
    request<any>(`/api/blog/posts/${postId}`),

  createBlogPost: (data: {
    title: string;
    content: string;
    channelId?: string;
    categoryId?: string;
  }) =>
    request<any>('/api/blog/posts', {
      method: 'POST',
      data,
    }),

  updateBlogPost: (postId: string, data: any) =>
    request<any>(`/api/blog/posts/${postId}`, {
      method: 'PUT',
      data,
    }),

  deleteBlogPost: (postId: string) =>
    request<{ success: boolean }>('/api/blog/posts/${postId}', {
      method: 'DELETE',
    }),

  getBlogChannels: () =>
    request<any[]>('/api/blog/channels'),

  createBlogChannel: (data: { name: string; description: string }) =>
    request<any>('/api/blog/channels', {
      method: 'POST',
      data,
    }),

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
    request<any[]>('/api/knowledge/pages', {
      method: 'GET',
      data: undefined,
    }),

  getKnowledgePage: (pageId: string) =>
    request<any>(`/api/knowledge/pages/${pageId}`),

  createKnowledgePage: (data: {
    title: string;
    content: string;
    categoryId: string;
  }) =>
    request<any>('/api/knowledge/pages', {
      method: 'POST',
      data,
    }),

  updateKnowledgePage: (pageId: string, data: any) =>
    request<any>(`/api/knowledge/pages/${pageId}`, {
      method: 'PUT',
      data,
    }),

  deleteKnowledgePage: (pageId: string) =>
    request<{ success: boolean }>('/api/knowledge/pages/${pageId}', {
      method: 'DELETE',
    }),

  getKnowledgeCategories: () =>
    request<any[]>('/api/knowledge/categories'),

  // Hiring
  getVacancies: (departmentId?: string) =>
    request<any[]>('/api/hiring/vacancies', {
      method: 'GET',
      data: undefined,
    }),

  getVacancy: (vacancyId: string) =>
    request<any>(`/api/hiring/vacancies/${vacancyId}`),

  applyVacancy: (vacancyId: string, data: {
    coverLetter: string;
    resumeUrl: string;
  }) =>
    request<any>(`/api/hiring/vacancies/${vacancyId}/apply`, {
      method: 'POST',
      data,
    }),

  getMyApplications: () =>
    request<any[]>('/api/hiring/applications/me'),

  getDepartments: () =>
    request<any[]>('/api/hiring/departments'),

  // Admin
  getAdminUsers: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    request<any>('/api/admin/users', {
      method: 'GET',
      data: undefined,
    }),

  banUser: (userId: string, data: { reason: string; expiresAt?: string }) =>
    request<any>(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      data,
    }),

  unbanUser: (userId: string) =>
    request<any>(`/api/admin/users/${userId}/unban`, {
      method: 'POST',
    }),

  suspendUser: (userId: string, data: { reason: string; duration: number }) =>
    request<any>(`/api/admin/users/${userId}/suspend`, {
      method: 'POST',
      data,
    }),

  deleteUser: (userId: string) =>
    request<any>(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    }),

  getReports: (status?: string) =>
    request<any[]>('/api/admin/reports', {
      method: 'GET',
      data: undefined,
    }),

  resolveReport: (reportId: string, data: { action: string; comment: string }) =>
    request<any>(`/api/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      data,
    }),

  getBans: (type?: string) =>
    request<any[]>('/api/admin/bans', {
      method: 'GET',
      data: undefined,
    }),

  getAnnouncements: () =>
    request<any[]>('/api/admin/announcements'),

  createAnnouncement: (data: {
    title: string;
    content: string;
    targetAudience: string;
    activeFrom: string;
    activeUntil?: string;
  }) =>
    request<any>('/api/admin/announcements', {
      method: 'POST',
      data,
    }),

  getFeatureFlags: () =>
    request<any[]>('/api/admin/feature-flags'),

  toggleFeatureFlag: (flagId: string) =>
    request<any>(`/api/admin/feature-flags/${flagId}/toggle`, {
      method: 'POST',
    }),

  getMetrics: () =>
    request<any>('/api/admin/metrics'),

  getAuditLogs: (params?: { page?: number; limit?: number; adminId?: string }) =>
    request<any>('/api/admin/audit-logs', {
      method: 'GET',
      data: undefined,
    }),

  // Contacts
  getContacts: () =>
    request<any[]>('/api/users/contacts', {
      method: 'GET',
      data: undefined,
    }),

  addContact: (userId: string) =>
    request<{ success: boolean }>(`/api/users/contacts/${userId}`, {
      method: 'POST',
    }),

  removeContact: (userId: string) =>
    request<{ success: boolean }>(`/api/users/contacts/${userId}`, {
      method: 'DELETE',
    }),

  // Public profile
  getUserPublicProfile: (username: string) =>
    request<any>(`/api/users/${username}`, {
      method: 'GET',
      data: undefined,
    }),

  // Devices
  getMyDevices: () =>
    request<any[]>('/api/users/me/devices', {
      method: 'GET',
      data: undefined,
    }),

  removeDevice: (deviceId: string) =>
    request<{ success: boolean }>(`/api/users/me/devices/${deviceId}`, {
      method: 'DELETE',
    }),

  // Payments — двухрежимный модуль донатов (анонимный СБП / ЮKassa)
  getPaymentConfig: () =>
    request<any>('/api/payments/config'),

  createDonation: (data: { tierId?: string; amount: number; currency?: string }) =>
    request<any>('/api/payments/donate', {
      method: 'POST',
      data,
    }),

  getDonationTiers: () =>
    request<{ tiers: any[] }>('/api/payments/tiers'),

  getUserDonations: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return request<any>(`/api/payments/me/donations${query ? `?${query}` : ''}`);
  },

  // Admin: payment config
  getAdminPaymentConfig: () =>
    request<{ config: any }>('/api/payments/admin/config'),

  updateAdminPaymentConfig: (data: any) =>
    request<any>('/api/payments/admin/config', {
      method: 'PUT',
      data,
    }),

  getAdminDonations: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString();
    return request<any>(`/api/payments/admin/donations${query ? `?${query}` : ''}`);
  },

  confirmDonation: (donationId: string) =>
    request<any>(`/api/payments/admin/confirm/${donationId}`, {
      method: 'POST',
    }),

  // History (узел 05) — тикет №56
  getHistoryVersions: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return request<any>(`/api/history/versions${query ? `?${query}` : ''}`);
  },

  getHistoryVersion: (idOrVersion: string) =>
    request<any>(`/api/history/versions/${idOrVersion}`),

  getHistoryVersionNeighbors: (idOrVersion: string) =>
    request<any>(`/api/history/versions/${idOrVersion}/neighbors`),

  compareHistoryVersions: (v1: string, v2: string) =>
    request<any>(`/api/history/compare?v1=${encodeURIComponent(v1)}&v2=${encodeURIComponent(v2)}`),

  // Downloads (узел 06) — тикет №57
  getDownloads: () =>
    request<{ desktop: Record<string, any[]>; mobile: Record<string, any[]> }>(
      '/api/downloads'
    ),

  getDesktopPackages: () =>
    request<{ desktop: Record<string, any[]> }>('/api/downloads/desktop'),

  getDesktopPackagesByPlatform: (platform: string) =>
    request<{ platform: string; packages: any[] }>(
      `/api/downloads/desktop/${platform}`
    ),

  getPlatformDownloads: (platform: string) =>
    request<{ platform: string; packages: any[] }>(
      `/api/downloads/${platform}`
    ),

  getDownloadUrl: (id: string) =>
    request<{ id: string; url: string; version: string; checksum: string; size: string }>(
      `/api/downloads/${id}/url`
    ),

  recordDownload: (id: string) =>
    request<{ success: boolean; id: string }>(
      `/api/downloads/${id}/download`,
      { method: 'POST' }
    ),

  // Docs (узел 07) — тикет №58
  getDocsEndpoints: () =>
    request<{
      baseUrl: string;
      wsUrl: string;
      version: string;
      modules: any[];
      totalEndpoints: number;
    }>('/api/docs/endpoints'),

  getDocsEndpointDetail: (methodPath: string) =>
    request<any>(`/api/docs/endpoints/${encodeURIComponent(methodPath)}`),

  getDocsSpec: () =>
    request<any>('/api/docs/spec'),

  getDocsWebSocket: () =>
    request<{
      url: string;
      clientToServer: any[];
      serverToClient: any[];
    }>('/api/docs/ws'),

  getDocsErrors: () =>
    request<any[]>('/api/docs/errors'),

  getDocsQuickStart: () =>
    request<any[]>('/api/docs/quick-start'),

  // Specs (узел 10) — тикет №59
  getSpecs: () =>
    request<{
      totalNodes: number;
      totalScreens: number;
      nodes: any[];
    }>('/api/specs'),

  getSpec: (nodeId: string, screenId: string) =>
    request<any>(`/api/specs/${nodeId}/${screenId}`),

  // Blog Landing (узел 11) — тикет №60
  getBlogLandingFeatured: () =>
    request<{ posts: any[] }>('/api/blog-landing/featured'),

  getBlogLandingPosts: (params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    channelId?: string;
    sort?: 'recent' | 'popular';
  }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.categoryId) qs.set('categoryId', params.categoryId);
    if (params?.channelId) qs.set('channelId', params.channelId);
    if (params?.sort) qs.set('sort', params.sort);
    const query = qs.toString();
    return request<{ posts: any[]; total: number; page: number; limit: number; hasMore: boolean }>(
      `/api/blog-landing/posts${query ? `?${query}` : ''}`
    );
  },

  getBlogLandingPost: (id: string) =>
    request<{ post: any; related: any[] }>(`/api/blog-landing/posts/${id}`),

  getBlogLandingCategories: () =>
    request<{ categories: any[] }>('/api/blog-landing/categories'),

  getBlogLandingChannels: () =>
    request<{ channels: any[] }>('/api/blog-landing/channels'),

  subscribeBlogNewsletter: (email: string) =>
    request<{ success: boolean; message: string }>('/api/blog-landing/subscribe', {
      method: 'POST',
      data: { email },
    }),

  searchBlogLanding: (params: { q: string; channelId?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    qs.set('q', params.q);
    if (params.channelId) qs.set('channelId', params.channelId);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return request<{ posts: any[]; total: number; page: number; limit: number; hasMore: boolean }>(
      `/api/blog-landing/search?${qs.toString()}`
    );
  },

  // Groups — missing methods
  createGroup: (data: { name: string; description?: string; type: string; memberIds?: string[] }) =>
    request<any>('/api/chats', { method: 'POST', data: { ...data, type: 'group' } }),

  updateGroup: (chatId: string, data: { name?: string; description?: string; avatarUrl?: string }) =>
    request<any>(`/api/chats/${chatId}`, { method: 'PUT', data }),

  updateMemberRole: (chatId: string, userId: string, role: string) =>
    request<any>(`/api/chats/${chatId}/members/${userId}/role`, { method: 'PUT', data: { role } }),

  exportGroupSettings: (chatId: string) =>
    request<any>(`/api/chats/${chatId}/export`),

  deleteGroup: (chatId: string) =>
    request<any>(`/api/chats/${chatId}`, { method: 'DELETE' }),

  // Blocked users — missing methods
  unblockChannel: (channelId: string) =>
    request<any>(`/api/blocked/channels/${channelId}`, { method: 'DELETE' }),

  // Notification settings — missing methods
  updateNotificationSettings: (settings: Record<string, any>) =>
    request<any>('/api/users/me/notifications', { method: 'PUT', data: settings }),

  // Channels — missing method
  createChannel: (data: { name: string; description?: string; type: string; memberIds?: string[] }) =>
    request<any>('/api/chats', { method: 'POST', data: { ...data, type: 'channel' } }),

  getChannel: (chatId: string) =>
    request<any>(`/api/chats/${chatId}`),

  updateChannel: (chatId: string, data: { name?: string; description?: string; avatarUrl?: string }) =>
    request<any>(`/api/chats/${chatId}`, { method: 'PUT', data }),

  deleteChannel: (chatId: string) =>
    request<{ success: boolean }>(`/api/chats/${chatId}`, { method: 'DELETE' }),

  removeChannelAdmin: (chatId: string, adminId: string) =>
    request<{ success: boolean }>(`/api/chats/${chatId}/admins/${adminId}`, { method: 'DELETE' }),

  updateChannelAdminRole: (chatId: string, adminId: string, role: string) =>
    request<any>(`/api/chats/${chatId}/admins/${adminId}/role`, { method: 'PUT', data: { role } }),

  // Hiring — Application type extension
  // (interview field is handled via separate API endpoints)

  // ============================================================
  // Desktop-specific APIs (Archive, Devices, Reports, Calls)
  // ============================================================

  // Archive
  getArchived: (page?: number, limit?: number) =>
    request<any>(`/api/archive?page=${page || 1}&limit=${limit || 20}`),
  restoreArchivedChat: (chatId: string) =>
    request<any>(`/api/archive/${chatId}/restore`, { method: 'POST' }),
  deleteArchivedChat: (chatId: string) =>
    request<any>(`/api/archive/${chatId}`, { method: 'DELETE' }),
  archiveChat: (chatId: string) =>
    request<any>(`/api/archive/${chatId}`, { method: 'POST' }),

  // Devices
  getDevices: () =>
    request<any>('/api/devices'),
  endSession: (sessionId: string) =>
    request<any>(`/api/devices/${sessionId}`, { method: 'DELETE' }),
  endAllSessions: () =>
    request<any>('/api/devices/end-all', { method: 'POST' }),

  // Reports
  createReport: (data: { messageId?: string; reportedUserId?: string; reason: string; comment?: string; chatId?: string }) =>
    request<any>('/api/reports', { method: 'POST', data }),
  getUserReports: (page?: number, limit?: number) =>
    request<any>(`/api/reports?page=${page || 1}&limit=${limit || 20}`),

  // Calls
  getCallHistory: (filter?: string, page?: number, limit?: number) =>
    request<any>(`/api/calls?filter=${filter || 'all'}&page=${page || 1}&limit=${limit || 50}`),

  // Tasks (command portal)
  getTasks: (params?: { status?: string; assignee?: string; priority?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.assignee) qs.set('assignee', params.assignee);
    if (params?.priority) qs.set('priority', params.priority);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return request<any[]>(`/api/tasks${query ? `?${query}` : ''}`);
  },

  getTask: (taskId: string) =>
    request<any>(`/api/tasks/${taskId}`),

  createTask: (data: {
    title: string;
    description: string;
    status?: string;
    priority?: string;
    type?: string;
    assignee?: string;
    dueDate?: string;
    tags?: string[];
  }) =>
    request<any>('/api/tasks', {
      method: 'POST',
      data,
    }),

  updateTask: (taskId: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    dueDate?: string;
    tags?: string[];
  }) =>
    request<any>(`/api/tasks/${taskId}`, {
      method: 'PUT',
      data,
    }),

  deleteTask: (taskId: string) =>
    request<{ success: boolean }>(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    }),
};

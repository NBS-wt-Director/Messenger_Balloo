// Blog types

export interface BlogPost {
  id: string;
  authorId: string;
  channelId?: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'rejected';
  views: number;
  createdAt: number; // Unix timestamp in seconds
  updatedAt: number; // Unix timestamp in seconds
}

export interface BlogChannel {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  postCount: number;
  followers: number;
}

export interface BlogCategory {
  id: string;
  name: Record<string, string>; // i18n: { ru: '...', en: '...', ... }
  slug: string;
}

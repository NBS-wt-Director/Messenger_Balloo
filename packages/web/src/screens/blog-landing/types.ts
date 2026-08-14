// Blog Landing — типы данных для корпоративного блога (blog.balloo.su)
// Тикет №60

export interface BlogLandingPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverEmoji: string;
  coverGradient: string;
  channel: { id: string; name: string; description?: string; avatarUrl?: string } | null;
  categories: { id: string; name: string; slug: string }[];
  author: { id: string; name: string; initials: string; avatarUrl?: string };
  publishedAt: number;
  publishedAtFormatted: string;
  readTime: number;
  views: number;
  reactions: number;
  comments: number;
  tags: string[];
  highlightQuery?: string;
}

export interface BlogLandingCategory {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  totalViews: number;
}

export interface BlogLandingChannel {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  postCount: number;
  followers: number;
  totalViews: number;
}

export interface BlogLandingComment {
  id: string;
  author: { id: string; name: string; initials: string; avatarUrl?: string };
  content: string;
  createdAt: number;
  createdAtFormatted: string;
  replies?: BlogLandingComment[];
}

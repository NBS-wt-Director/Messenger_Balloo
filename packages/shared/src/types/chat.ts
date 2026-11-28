// Chat and message types

export type ChatType = 'direct' | 'group' | 'channel';

export type UserRole = 'owner' | 'admin' | 'moderator' | 'member';

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

// Не-файловые вложения (тик. 1795677071): сообщение с опросом/квизом/списком/
// персонали получает соответствующий тип — данные формы лежат в attachment.data.
export type MessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'voice'
  | 'video'
  | 'poll'
  | 'quiz'
  | 'list_active'
  | 'list_passive'
  | 'personali'
  | 'system';

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  avatarUrl?: string;
  inviteCode?: string;
  createdAt: number; // Unix timestamp in seconds
  updatedAt: number; // Unix timestamp in seconds
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content: string;
  replyToId?: string;
  editCount: number;
  deleted: boolean;
  status: MessageStatus;
  createdAt: number; // Unix timestamp in seconds
  updatedAt: number; // Unix timestamp in seconds
}

export interface Attachment {
  id: string;
  messageId: string;
  type: 'image' | 'file' | 'voice' | 'video' | 'text' | 'poll' | 'quiz' | 'list_active' | 'list_passive' | 'personali';
  url: string;
  thumbnail?: string;
  size: number; // bytes
  name?: string;
  width?: number;
  height?: number;
  duration?: number; // seconds
  /** Не-файловые вложения (тик. 1795677071): данные формы, url пустой. */
  data?: Record<string, unknown>;
}

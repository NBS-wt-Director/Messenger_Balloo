// Profile types

export interface Profile {
  userId: string;
  bio?: string;
  website?: string;
  socialLinks: Record<string, string>; // { platform: url }
}

export interface PublicProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isPrivate: boolean;
}

export interface PrivacySettings {
  isPrivate: boolean;
  showOnline: boolean;
  showLastSeen: boolean;
  allowMessages: 'everyone' | 'contacts' | 'nobody';
  allowStories: 'everyone' | 'contacts' | 'nobody';
}

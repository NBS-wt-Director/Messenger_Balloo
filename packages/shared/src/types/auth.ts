// Authentication types

export type AuthProvider = 'yandex' | 'vk' | 'mailru' | 'email';

export type TwoFAMethod = 'totp' | 'sms' | 'email';

export type DeviceType = 'web' | 'desktop' | 'android' | 'ios';

export type UserStatus = 'active' | 'banned' | 'suspended' | 'deleted';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in seconds
}

export interface DeviceInfo {
  id?: string;
  type: DeviceType;
  name: string;
  platform: string;
  lastIp: string;
  lastActive: number; // Unix timestamp in seconds
}

// Theme definitions for Balloo Messenger Mobile
// Based on the design system from mockups/assets/common.css

import { StyleSheet } from 'react-native';

export type Theme = 'dark' | 'light' | 'russian';

export interface ThemeColors {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgGlass: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Accent
  accent: string;
  accentHover: string;
  accentLight: string;

  // Status
  online: string;
  offline: string;
  away: string;
  busy: string;

  // Message bubbles
  bubbleSender: string;
  bubbleReceiver: string;
  bubbleSenderText: string;
  bubbleReceiverText: string;

  // Borders
  border: string;
  borderLight: string;

  // Danger
  danger: string;
  dangerLight: string;

  // Success
  success: string;
  successLight: string;

  // Warning
  warning: string;
  warningLight: string;

  // Other
  shadow: string;
  overlay: string;
  unread: string;
  badge: string;
}

const darkColors: ThemeColors = {
  bgPrimary: '#0d1117',
  bgSecondary: '#161b22',
  bgTertiary: '#21262d',
  bgCard: '#1c2128',
  bgGlass: 'rgba(22, 27, 34, 0.8)',

  textPrimary: '#e6edf3',
  textSecondary: '#8b949e',
  textTertiary: '#6e7681',
  textInverse: '#0d1117',

  accent: '#2db84d',
  accentHover: '#3cc95e',
  accentLight: 'rgba(45, 184, 77, 0.15)',

  online: '#2db84d',
  offline: '#6e7681',
  away: '#f0b429',
  busy: '#f85149',

  bubbleSender: '#2db84d',
  bubbleReceiver: '#21262d',
  bubbleSenderText: '#ffffff',
  bubbleReceiverText: '#e6edf3',

  border: '#30363d',
  borderLight: '#21262d',

  danger: '#f85149',
  dangerLight: 'rgba(248, 81, 73, 0.15)',

  success: '#2db84d',
  successLight: 'rgba(45, 184, 77, 0.15)',

  warning: '#f0b429',
  warningLight: 'rgba(240, 180, 41, 0.15)',

  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  unread: '#2db84d',
  badge: '#f85149',
};

const lightColors: ThemeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f6f8fa',
  bgTertiary: '#eaeef2',
  bgCard: '#ffffff',
  bgGlass: 'rgba(255, 255, 255, 0.8)',

  textPrimary: '#1f2328',
  textSecondary: '#656d76',
  textTertiary: '#8b949e',
  textInverse: '#ffffff',

  accent: '#2db84d',
  accentHover: '#26a342',
  accentLight: 'rgba(45, 184, 77, 0.12)',

  online: '#2db84d',
  offline: '#8b949e',
  away: '#f0b429',
  busy: '#f85149',

  bubbleSender: '#2db84d',
  bubbleReceiver: '#f0f2f5',
  bubbleSenderText: '#ffffff',
  bubbleReceiverText: '#1f2328',

  border: '#d0d7de',
  borderLight: '#eaeef2',

  danger: '#f85149',
  dangerLight: 'rgba(248, 81, 73, 0.1)',

  success: '#2db84d',
  successLight: 'rgba(45, 184, 77, 0.1)',

  warning: '#f0b429',
  warningLight: 'rgba(240, 180, 41, 0.1)',

  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  unread: '#2db84d',
  badge: '#f85149',
};

const russianColors: ThemeColors = {
  bgPrimary: '#0a0f1a',
  bgSecondary: '#111827',
  bgTertiary: '#1c2538',
  bgCard: '#162032',
  bgGlass: 'rgba(17, 24, 39, 0.8)',

  textPrimary: '#e8edf5',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textInverse: '#0a0f1a',

  accent: '#f0c040',
  accentHover: '#f5d060',
  accentLight: 'rgba(240, 192, 64, 0.15)',

  online: '#2db84d',
  offline: '#64748b',
  away: '#f0b429',
  busy: '#f85149',

  bubbleSender: '#f0c040',
  bubbleReceiver: '#1c2538',
  bubbleSenderText: '#0a0f1a',
  bubbleReceiverText: '#e8edf5',

  border: '#1e293b',
  borderLight: '#1c2538',

  danger: '#f85149',
  dangerLight: 'rgba(248, 81, 73, 0.15)',

  success: '#2db84d',
  successLight: 'rgba(45, 184, 77, 0.15)',

  warning: '#f0b429',
  warningLight: 'rgba(240, 180, 41, 0.15)',

  shadow: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  unread: '#f0c040',
  badge: '#f85149',
};

export const themeColors: Record<Theme, ThemeColors> = {
  dark: darkColors,
  light: lightColors,
  russian: russianColors,
};

export const getThemeColors = (theme: Theme): ThemeColors => {
  return themeColors[theme] || themeColors.dark;
};

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Font sizes
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
  hero: 32,
} as const;

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Common styles
export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  safeArea: {
    flex: 1,
  },
});
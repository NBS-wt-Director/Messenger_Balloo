// Balloo Messenger — Mobile Avatar Component
// Octagon-shaped avatar with status indicator

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getThemeColors, Theme } from '../styles/theme';
import { useUIStore } from '../store/uiStore';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  bordered?: boolean;
  context?: 'contact' | 'new' | 'family' | 'blocked';
  gradient?: string[];
  style?: any;
}

const SIZE_MAP = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
};

const STATUS_SIZE = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
};

const FONT_SIZE = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 36,
};

const DEFAULT_GRADIENTS = [
  ['#2db84d', '#1e9e3e'],
  ['#3b82f6', '#1d4ed8'],
  ['#8b5cf6', '#6d28d9'],
  ['#f59e0b', '#d97706'],
  ['#ef4444', '#b91c1c'],
  ['#06b6d4', '#0891b2'],
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (name.length >= 2) {
    return name.substring(0, 2).toUpperCase();
  }
  return name.toUpperCase() || '??';
}

function getGradient(name: string): string[] {
  const index = name.length % DEFAULT_GRADIENTS.length;
  return DEFAULT_GRADIENTS[index];
}

export default function Avatar({
  name,
  avatarUrl,
  size = 'md',
  status,
  bordered = false,
  context = 'contact',
  gradient,
  style,
}: AvatarProps) {
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const dim = SIZE_MAP[size];
  const statusDim = STATUS_SIZE[size];
  const fontSize = FONT_SIZE[size];
  const [g1, g2] = gradient || getGradient(name);

  const statusColors: Record<string, string> = {
    online: colors.online,
    offline: colors.offline,
    away: colors.away,
    busy: colors.busy,
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: dim,
            height: dim,
            backgroundColor: g1,
          },
          bordered && {
            borderWidth: 2,
            borderColor: colors.border,
          },
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[styles.image, { width: dim, height: dim }]}
          />
        ) : (
          <Text
            style={[
              styles.initials,
              { fontSize, color: '#ffffff' },
            ]}
          >
            {getInitials(name)}
          </Text>
        )}
      </View>
      {status && (
        <View
          style={[
            styles.status,
            {
              width: statusDim,
              height: statusDim,
              borderRadius: statusDim / 2,
              backgroundColor: statusColors[status] || colors.offline,
              borderWidth: 2,
              borderColor: colors.bgPrimary,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    // Octagon clip path approximation
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '700',
  },
  status: {
    position: 'absolute',
  },
});
// ============================================================
// Push Notifications Service — expo-notifications wrapper
// ============================================================
// Handles:
// 1. Requesting notification permission
// 2. Getting Expo push token and registering it on the server
// 3. Displaying local notifications for incoming WS messages
//
// Without FCM credentials (google-services.json), Expo push token
// is unavailable — the service degrades gracefully (logs, no crash).
// Local notifications still work for foreground/background WS messages.

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

// Configure how notifications display when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permission from the user.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2db84d',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Get the Expo push token and register it on the server.
 * Gracefully degrades if FCM is not configured (logs, no crash).
 */
export async function registerPushTokenOnServer(
  deviceId: string
): Promise<void> {
  try {
    // Check if push is available (requires FCM credentials for Android)
    if (!Constants.isDevice && Platform.OS === 'android') {
      console.log('[Push] Skipping push registration on emulator (no FCM)');
      return;
    }

    const tokenResult = await Notifications.getExpoPushTokenAsync();
    const token = tokenResult.data;

    if (!token) {
      console.log('[Push] No push token available (FCM not configured)');
      return;
    }

    await api.registerPushToken({
      deviceId,
      platform: Platform.OS as 'android' | 'ios',
      token,
    });

    console.log('[Push] Push token registered successfully');
  } catch (error: any) {
    // Graceful degradation: FCM not configured, push service unavailable, etc.
    if (error?.message?.includes('not configured') || error?.message?.includes('not available')) {
      console.log('[Push] Push notifications not available (FCM not configured):', error.message);
    } else {
      console.warn('[Push] Failed to register push token:', error.message);
    }
  }
}

/**
 * Show a local notification for an incoming message.
 * Used when the app is in background but WebSocket is still connected.
 */
export async function showMessageNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: true,
    },
    trigger: Platform.OS === 'android'
      ? { channelId: 'messages' } as any
      : null,
  });
}

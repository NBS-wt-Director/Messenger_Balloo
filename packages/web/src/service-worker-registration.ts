// service-worker-registration.ts — регистрация и управление Service Worker для PWA

const SW_URL = '/sw.js';

// ========== SERVICE WORKER ==========

/** Проверяет, поддерживает ли браузер Service Workers */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/** Проверяет, зарегистрирован ли Service Worker */
export async function isSWRegistered(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;
  const registrations = await navigator.serviceWorker.getRegistrations();
  return registrations.length > 0;
}

/** Интерфейс с расширением для Background Sync */
interface ExtendedRegistration extends ServiceWorkerRegistration {
  sync?: { register: (tag: string) => Promise<void> };
  periodicSync?: { register: (tag: string, options: any) => Promise<void> };
}

/** Регистрирует Service Worker */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('Service Workers не поддерживаются в этом браузере');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/',
    });

    console.log('Service Worker зарегистрирован:', registration.scope);

    // Если есть обновлённый SW — обновляем его
    if (registration.installing) {
      registration.installing.addEventListener('statechange', (event) => {
        const worker = (event.target as ServiceWorker);
        if (worker.state === 'activated') {
          console.log('Новый Service Worker активирован');
        }
      });
    }

    // Слушаем обновления SW
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('Доступна новая версия. Обновите страницу.');
          notifyUpdateAvailable();
        }
      });
    });

    // Регистрируем Background Sync (если поддерживается)
    const regExt = registration as ExtendedRegistration;
    if (regExt.sync) {
      try {
        await regExt.sync.register('sync-chats');
        console.log('Background Sync зарегистрирован');
      } catch {
        // Не доступен — не критично
      }
    }

    // Регистрируем Periodic Sync (если поддерживается)
    if (regExt.periodicSync) {
      try {
        await regExt.periodicSync.register('sync-chats', {
          minInterval: 24 * 60 * 60 * 1000, // 24 часа
        });
        console.log('Periodic Sync зарегистрирован');
      } catch {
        // Не доступен — не критично
      }
    }

    return registration;
  } catch (error) {
    console.error('Ошибка регистрации Service Worker:', error);
    return null;
  }
}

/** Отменяет регистрацию Service Worker */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('Service Worker отменён');
    return true;
  } catch (error) {
    console.error('Ошибка отмены Service Worker:', error);
    return false;
  }
}

/** Проверяет наличие обновления */
export async function checkForUpdates(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
    await registration.update();
    return registration.installing !== null;
  } catch {
    return false;
  }
}

// ========== UPDATE NOTIFICATION ==========

let onUpdateAvailableCallback: (() => void) | null = null;

export function setUpdateAvailableCallback(callback: (() => void) | null): void {
  onUpdateAvailableCallback = callback;
}

function notifyUpdateAvailable(): void {
  if (onUpdateAvailableCallback) {
    onUpdateAvailableCallback();
  }
}

// ========== NETWORK STATUS ==========

/** Триггерит Background Sync при восстановлении сети */
function initNetworkSync() {
  window.addEventListener('online', async () => {
    console.log('Сеть восстановлена, запускаем фоновую синхронизацию...');
    try {
      const registration = await navigator.serviceWorker.ready;
      const regExt = registration as ExtendedRegistration;
      if (regExt.sync) {
        await regExt.sync.register('sync-chats');
      }
    } catch (error) {
      console.error('Ошибка синхронизации при восстановлении сети:', error);
    }
  });
}

// Запускаем при загрузке
if (isServiceWorkerSupported()) {
  initNetworkSync();
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onNetworkStatusChange(callback: (online: boolean) => void): void {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
}

// ========== PUSH NOTIFICATIONS ==========

/** Запрашивает разрешение на push-уведомления */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notification API не поддерживается');
    return false;
  }

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') {
    console.warn('Пользователь запретил уведомления');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/** Подписывается на push-уведомления */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (!('PushManager' in window)) {
      console.warn('Push API не поддерживается');
      return null;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY || ''),
    });

    console.log('Push-подписка создана');
    return subscription;
  } catch (error) {
    console.error('Ошибка подписки на push:', error);
    return null;
  }
}

/** Отписывается от push-уведомлений */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('Push-подписка отменена');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Ошибка отмены push-подписки:', error);
    return false;
  }
}

/** Проверяет, есть ли активная push-подписка */
export async function hasPushSubscription(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

// ========== UTILITIES ==========

/** Конвертирует VAPID ключ из base64 в Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!base64String) return new Uint8Array(0);
  
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/* sw.js — Service Worker для Balloo Messenger (PWA) */

const CACHE_NAME = 'balloo-v1';
const DATA_CACHE_NAME = 'balloo-api-v1';
const SYNC_DB_NAME = 'balloo-sync';
const SYNC_STORE_NAME = 'queue';

// Ресурсы для кэширования при установке
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/assets/logos/product-logo.png',
  '/offline.html',
];

// ========== HELPERS ==========

/** Открытие IndexedDB для очереди синхронизации */
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Добавить запрос в очередь IndexedDB */
function queueRequest(request) {
  return openSyncDB().then((db) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    tx.objectStore(SYNC_STORE_NAME).add({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers),
      timestamp: Date.now(),
    });
  }).catch(() => {
    // Если IndexedDB недоступен — игнорируем
  });
}

/** Получить все запросы из очереди */
function getSyncQueue() {
  return openSyncDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_STORE_NAME, 'readonly');
      const store = tx.objectStore(SYNC_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

/** Очистить очередь */
function clearSyncQueue() {
  return openSyncDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
      const store = tx.objectStore(SYNC_STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

/** Повторно отправить накопленные запросы */
async function replaySyncQueue() {
  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  const failed = [];
  for (const item of queue) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
      });
    } catch {
      failed.push(item);
    }
  }

  // Если есть неудачные — оставляем в очереди
  if (failed.length > 0) {
    const db = await openSyncDB();
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const allItems = await new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
    });
    const failedIds = failed.map(f => f.id);
    allItems.forEach(item => {
      if (failedIds.includes(item.id)) {
        store.delete(item.id);
      }
    });
    for (const item of failed) {
      store.add(item);
    }
  } else {
    await clearSyncQueue();
  }
}

// ========== INSTALL ==========
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// ========== ACTIVATE ==========
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// ========== FETCH ==========
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Навигационные запросы — Network First, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // API запросы — Network First с фоновой синхронизацией
  if (request.url.includes('/api/')) {
    event.respondWith(apiFirst(request));
    return;
  }

  // Статические ресурсы — Cache First
  event.respondWith(cacheFirst(request));
});

// ========== STRATEGIES ==========

/** Cache First — для статических ресурсов */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Resource not found', { status: 404, statusText: 'Not Found' });
  }
}

/** Network First — для навигации */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    if (isOfflinePage(request)) {
      return caches.match('/offline.html');
    }

    return caches.match('/index.html');
  }
}

/** API First — для API запросов с фоновой синхронизацией */
async function apiFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    queueRequest(request);
    return new Response(JSON.stringify({ error: 'offline', message: 'Нет подключения к сети' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function isOfflinePage(request) {
  return request.destination === 'document';
}

// ========== BACKGROUND SYNC ==========

// Background Sync API
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-chats') {
    event.waitUntil(replaySyncQueue());
  }
});

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-chats') {
    event.waitUntil(replaySyncQueue());
  }
});

// ========== PUSH NOTIFICATIONS ==========

self.addEventListener('push', (event) => {
  let data = { title: 'Balloo', body: 'Новое сообщение', icon: '/assets/logos/product-logo.png' };

  if (event.data) {
    try {
      data = JSON.parse(event.data.text());
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/assets/logos/product-logo.png',
  '/offline.html',
    badge: '/assets/logos/product-logo.png',
  '/offline.html',
    vibrate: [200, 100, 200],
    data: {
      date: Date.now(),
      url: data.url || '/',
      ...data,
    },
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'close', title: 'Закрыть' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/')) {
          return client.focus();
        }
      }
      const url = event.notification.data?.url || '/';
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('notificationclose', () => {
  // Аналитика уведомлений (опционально)
});

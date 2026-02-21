/// <reference lib="webworker" />

import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { syncPendingOperations } from './lib/syncService';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

const OFFLINE_SYNC_TAG = 'offline-sync';
const OFFLINE_PERIODIC_SYNC_TAG = 'offline-sync-periodic';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

const navigationHandler = createHandlerBoundToURL('/index.html');
registerRoute(new NavigationRoute(navigationHandler, {
  denylist: [/^\/api/],
}));

registerRoute(
  /^https:\/\/zfmvpzypgagtexjbufsq\.supabase\.co\/rest\/v1\/.*/i,
  new NetworkFirst({
    cacheName: 'supabase-api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^https:\/\/zfmvpzypgagtexjbufsq\.supabase\.co\/auth\/.*/i,
  new NetworkFirst({
    cacheName: 'supabase-auth-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^https:\/\/zfmvpzypgagtexjbufsq\.supabase\.co\/storage\/.*/i,
  new CacheFirst({
    cacheName: 'supabase-storage-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

const postSyncStatusToClients = async (status: {
  type: 'offline-sync-result';
  success: number;
  failed: number;
  total: number;
}) => {
  const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  allClients.forEach((client) => {
    client.postMessage(status);
  });
};

const runOfflineSync = async () => {
  try {
    const result = await syncPendingOperations();
    await postSyncStatusToClients({
      type: 'offline-sync-result',
      ...result,
    });
  } catch (error) {
    console.error('Service worker offline sync failed:', error);
  }
};

self.addEventListener('sync', (event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === OFFLINE_SYNC_TAG) {
    syncEvent.waitUntil(runOfflineSync());
  }
});

self.addEventListener('periodicsync', (event) => {
  const periodicEvent = event as ExtendableEvent & { tag?: string };
  if (periodicEvent.tag === OFFLINE_PERIODIC_SYNC_TAG) {
    periodicEvent.waitUntil(runOfflineSync());
  }
});

self.addEventListener('message', (event) => {
  const messageEvent = event as ExtendableMessageEvent;
  const payload = messageEvent.data as { type?: string } | undefined;

  if (payload?.type === 'offline-sync-now') {
    messageEvent.waitUntil(runOfflineSync());
    return;
  }

  if (payload?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('notificationclick', (event) => {
  const notificationEvent = event as NotificationEvent;
  notificationEvent.notification.close();

  const payload = notificationEvent.notification.data as { url?: string; appointmentId?: string } | undefined;
  const targetPath = payload?.url || '/calendar';

  notificationEvent.waitUntil((async () => {
    const targetUrl = new URL(targetPath, self.location.origin).href;
    const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });

    for (const client of allClients) {
      const windowClient = client as WindowClient;
      if (windowClient.url === targetUrl) {
        await windowClient.focus();
        return;
      }
    }

    const firstClient = allClients[0] as WindowClient | undefined;
    if (firstClient) {
      if (typeof firstClient.navigate === 'function') {
        await firstClient.navigate(targetUrl);
      }
      await firstClient.focus();
      return;
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});

self.addEventListener('push', (event) => {
  const pushEvent = event as PushEvent;
  let payload: {
    title?: string;
    body?: string;
    tag?: string;
    data?: Record<string, unknown>;
    icon?: string;
    badge?: string;
    requireInteraction?: boolean;
  } = {};

  try {
    payload = pushEvent.data?.json() || {};
  } catch {
    payload = {
      title: 'Podsjetnik',
      body: pushEvent.data?.text() || '',
    };
  }

  const title = payload.title || 'Podsjetnik';
  const options: NotificationOptions = {
    body: payload.body || '',
    tag: payload.tag,
    data: payload.data || { url: '/calendar' },
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/icon-192x192.png',
    requireInteraction: payload.requireInteraction ?? false,
  };

  pushEvent.waitUntil(self.registration.showNotification(title, options));
});

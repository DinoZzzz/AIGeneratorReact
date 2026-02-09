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

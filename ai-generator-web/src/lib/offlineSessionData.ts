import { clearStore, STORES } from './offlineDb';
import { withPrivateCacheLock } from './offlineSessionLifecycle';

// Remove account data while preserving the application shell for offline sign-in.
export const clearOfflineSessionData = async () => withPrivateCacheLock(async () => {
    // Invalidate the worker's cache owner before deleting runtime caches.
    await clearStore(STORES.METADATA);
    const runtimeCacheCleanup = typeof caches === 'undefined'
        ? []
        : ['supabase-api-cache', 'supabase-storage-cache', 'supabase-auth-cache']
            .map((cacheName) => caches.delete(cacheName));

    await Promise.all([
        ...runtimeCacheCleanup,
        clearStore(STORES.CUSTOMERS),
        clearStore(STORES.CONSTRUCTIONS),
        clearStore(STORES.REPORTS),
        clearStore(STORES.APPOINTMENTS),
        clearStore(STORES.MESSAGES),
        clearStore(STORES.EXAMINERS),
        clearStore(STORES.REPORT_TYPES),
        clearStore(STORES.MATERIALS),
        clearStore(STORES.SCHEME_IMAGES),
        clearStore(STORES.CERTIFIERS),
        clearStore(STORES.EXPORT_HISTORY),
        clearStore(STORES.EXPORT_HISTORY_FORMS),
        clearStore(STORES.REPORT_FILES),
        clearStore(STORES.FILE_BLOBS),
        clearStore(STORES.TEMPLATE_CACHE),
        clearStore(STORES.UPLOADS),
        clearStore(STORES.SYNC_QUEUE),
    ]);
});

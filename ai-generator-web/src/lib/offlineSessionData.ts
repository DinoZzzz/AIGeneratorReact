import { clearStore, STORES } from './offlineDb';

// Remove account data while preserving the application shell for offline sign-in.
export const clearOfflineSessionData = async () => {
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
        clearStore(STORES.METADATA),
    ]);
};

import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearOfflineSessionData } from '../src/lib/offlineSessionData';
import { getAllFromStore, saveToStore, STORES } from '../src/lib/offlineDb';

afterEach(() => vi.unstubAllGlobals());

describe('account data cleanup', () => {
  it('removes private IndexedDB and runtime caches while retaining the app shell', async () => {
    await saveToStore(STORES.CUSTOMERS, { id: 'customer-a', name: 'Private customer' });
    await saveToStore(STORES.REPORTS, { id: 'report-a', notes: 'Private report' });
    const cacheNames = new Set(['supabase-api-cache', 'supabase-storage-cache', 'supabase-auth-cache', 'workbox-precache']);
    const removeCache = vi.fn(async (name: string) => cacheNames.delete(name));
    vi.stubGlobal('caches', { delete: removeCache });

    await clearOfflineSessionData();

    expect(await getAllFromStore(STORES.CUSTOMERS)).toEqual([]);
    expect(await getAllFromStore(STORES.REPORTS)).toEqual([]);
    expect([...cacheNames]).toEqual(['workbox-precache']);
    expect(removeCache).toHaveBeenCalledTimes(3);
  });

  it('also clears account data when CacheStorage is unavailable', async () => {
    vi.stubGlobal('caches', undefined);
    await saveToStore(STORES.CUSTOMERS, { id: 'customer-b', name: 'Private customer' });
    await clearOfflineSessionData();
    expect(await getAllFromStore(STORES.CUSTOMERS)).toEqual([]);
  });
});

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addToSyncQueue, cacheRemoteRows, clearStore, getAllFromStore, getMetadata, getSyncQueueSummary, saveMetadata, saveToStore, STORES, updateSyncOperationStatus } from '../src/lib/offlineDb';
import { signOutWithOfflineProtection } from '../src/lib/offlineSignOutGuard';
import { clearOfflineSessionData } from '../src/lib/offlineSessionData';
import { getOfflineSessionGeneration, isOfflineSessionCurrent, resumeOfflineSession, sessionGuardedFetch, suspendOfflineSession } from '../src/lib/offlineSessionLifecycle';
import { offlineRuntimeCachePlugin } from '../src/lib/offlineRuntimeCachePlugin';

const state = vi.hoisted(() => ({ response: Promise.resolve({ data: [] as unknown[], error: null }) }));
vi.mock('../src/context/OfflineContext', () => ({ useOffline: () => ({ isOnline: true }) }));
vi.mock('../src/lib/sentry', () => ({ captureError: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ order: () => state.response }) }) },
}));
const { createOfflineQueryFn } = await import('../src/lib/offlineQueryFn');
const { getLookupWithOfflineFallback } = await import('../src/lib/offlineLookupCache');

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

const readPendingCount = async () => {
  const summary = await getSyncQueueSummary();
  return summary.pending + summary.failed + summary.inProgress + summary.discarded;
};

const logoutOptions = () => ({
  readPendingCount,
  confirmDiscard: vi.fn(async () => true),
  cancelQueries: vi.fn(async () => {}),
  signOut: vi.fn(async (): Promise<{ error: unknown }> => ({ error: null })),
  clearData: vi.fn(clearOfflineSessionData),
});

beforeEach(async () => {
  resumeOfflineSession();
  vi.stubGlobal('navigator', { onLine: true });
  await Promise.all(Object.values(STORES).map(clearStore));
});
afterEach(() => {
  resumeOfflineSession();
  vi.unstubAllGlobals();
});

describe('session boundary protects offline work', () => {
  it('reads fresh in-progress queue rows before sign-out and respects cancellation', async () => {
    const id = await addToSyncQueue(STORES.CUSTOMERS, 'update', { name: 'Unsynced' }, 'customer-1');
    await updateSyncOperationStatus(id, 'in_progress');
    const options = logoutOptions();
    options.confirmDiscard.mockResolvedValue(false);

    expect(await signOutWithOfflineProtection(options)).toBe(false);
    expect(options.confirmDiscard).toHaveBeenCalledWith(1);
    expect(options.signOut).not.toHaveBeenCalled();
    expect(await readPendingCount()).toBe(1);
    expect(isOfflineSessionCurrent(getOfflineSessionGeneration())).toBe(true);
  });

  it('keeps queued work if Supabase returns a sign-out error without throwing', async () => {
    await addToSyncQueue(STORES.REPORTS, 'create', { title: 'Offline work' }, 'temp-report');
    const options = logoutOptions();
    const error = new Error('Network unavailable');
    options.signOut.mockResolvedValue({ error });

    await expect(signOutWithOfflineProtection(options)).rejects.toBe(error);
    expect(options.clearData).not.toHaveBeenCalled();
    expect(await readPendingCount()).toBe(1);
    await expect(saveToStore(STORES.CUSTOMERS, { id: 'still-signed-in' })).resolves.toBeUndefined();
  });

  it('fails closed when the current queue cannot be read', async () => {
    const options = logoutOptions();
    options.readPendingCount = async () => { throw new Error('Storage unavailable'); };
    await expect(signOutWithOfflineProtection(options)).rejects.toThrow('Storage unavailable');
    expect(options.signOut).not.toHaveBeenCalled();
    expect(options.clearData).not.toHaveBeenCalled();
  });

  it('does not let a late online query refill the cache after logout or a new login', async () => {
    const response = deferred<Array<{ id: string; name: string }>>();
    const query = createOfflineQueryFn(
      () => response.promise,
      () => getAllFromStore<{ id: string; name: string }>(STORES.CUSTOMERS),
      (rows) => cacheRemoteRows(STORES.CUSTOMERS, rows),
    );
    const result = query(true);
    const rejection = expect(result).rejects.toMatchObject({ name: 'OfflineSessionChangedError' });
    expect(await signOutWithOfflineProtection(logoutOptions())).toBe(true);
    resumeOfflineSession();
    response.resolve([{ id: 'old-user-row', name: 'Private old data' }]);
    await rejection;
    expect(await getAllFromStore(STORES.CUSTOMERS)).toEqual([]);
  });

  it('does not let a late lookup warmer repopulate account metadata', async () => {
    const response = deferred<{ data: unknown[]; error: null }>();
    state.response = response.promise;
    const result = getLookupWithOfflineFallback('materials', 'name');
    const rejection = expect(result).rejects.toMatchObject({ name: 'OfflineSessionChangedError' });
    await signOutWithOfflineProtection(logoutOptions());
    resumeOfflineSession();
    response.resolve({ data: [{ id: 1, name: 'Old account material' }], error: null });
    await rejection;
    expect(await getMetadata('lookup_cache:materials:name')).toBeUndefined();
  });

  it('rejects an old fetch response even if its transport ignores abort', async () => {
    const response = deferred<Response>();
    vi.stubGlobal('fetch', vi.fn(() => response.promise));
    const result = sessionGuardedFetch('https://example.com/rest/v1/customers');
    const rejection = expect(result).rejects.toMatchObject({ name: 'OfflineSessionChangedError' });
    suspendOfflineSession();
    resumeOfflineSession();
    response.resolve(new Response('[]'));
    await rejection;
  });

  it('blocks private runtime-cache responses when the recorded session has been cleared', async () => {
    await saveMetadata('supabase_session_tokens', { access_token: 'old-token', user_id: 'old-user' });
    const pluginState: Record<string, unknown> = {};
    const request = new Request('https://example.com/rest/v1/customers', { headers: { authorization: 'Bearer old-token' } });
    const event = {} as ExtendableEvent;
    await offlineRuntimeCachePlugin.handlerWillStart!({ state: pluginState, request, event });
    await clearOfflineSessionData();
    const response = new Response('private account data');

    expect(await offlineRuntimeCachePlugin.cacheWillUpdate!({ state: pluginState, request, response, event })).toBeNull();
    expect(await offlineRuntimeCachePlugin.cachedResponseWillBeUsed!({ state: pluginState, request, cachedResponse: response, event, cacheName: 'supabase-api-cache' })).toBeNull();
  });

  it('cannot assign a delayed old-token response to the newly signed-in account', async () => {
    await saveMetadata('supabase_session_tokens', { access_token: 'new-token', user_id: 'new-user' });
    const pluginState: Record<string, unknown> = {};
    const request = new Request('https://example.com/rest/v1/customers', { headers: { authorization: 'Bearer old-token' } });
    const event = {} as ExtendableEvent;
    await offlineRuntimeCachePlugin.handlerWillStart!({ state: pluginState, request, event });
    expect(await offlineRuntimeCachePlugin.cacheWillUpdate!({ state: pluginState, request, response: new Response('old data'), event })).toBeNull();
  });

  it('never serves a cached response owned by another account', async () => {
    await saveMetadata('supabase_session_tokens', { access_token: 'new-token', user_id: 'new-user' });
    const pluginState: Record<string, unknown> = {};
    const request = new Request('https://example.com/rest/v1/customers', { headers: { authorization: 'Bearer new-token' } });
    const event = {} as ExtendableEvent;
    await offlineRuntimeCachePlugin.handlerWillStart!({ state: pluginState, request, event });
    const cachedResponse = new Response('old data', { headers: { 'x-ai-cache-owner': 'old-user' } });
    expect(await offlineRuntimeCachePlugin.cachedResponseWillBeUsed!({ state: pluginState, request, cachedResponse, event, cacheName: 'supabase-api-cache' })).toBeNull();
    const currentResponse = await offlineRuntimeCachePlugin.cacheWillUpdate!({ state: pluginState, request, response: new Response('new data'), event });
    expect(currentResponse?.headers.get('x-ai-cache-owner')).toBe('new-user');
  });
});

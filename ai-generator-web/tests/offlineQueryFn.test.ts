import { afterEach, describe, expect, it, vi } from 'vitest';
import { onlineManager, QueryClient, QueryObserver, type QueryObserverOptions } from '@tanstack/react-query';

vi.mock('../src/context/OfflineContext', () => ({
  useOffline: () => ({ isOnline: false }),
}));
vi.mock('../src/lib/sentry', () => ({ captureError: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ supabase: {} }));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...await importOriginal<typeof import('@tanstack/react-query')>(),
  useQuery: (options: unknown) => options,
}));

const { createOfflineQueryFn, useOnlineQuery } = await import('../src/lib/offlineQueryFn');

afterEach(() => {
  onlineManager.setOnline(true);
});

describe('offline query execution', () => {
  it('loads cached data on an offline mount without waiting for connectivity', async () => {
    onlineManager.setOnline(false);
    const online = vi.fn(async () => ['server']);
    const offline = vi.fn(async () => ['local']);
    const options = useOnlineQuery(['offline-mount'], online, offline) as unknown as QueryObserverOptions<string[]>;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const observer = new QueryObserver(client, options);

    try {
      const result = await observer.refetch();
      expect(result.data).toEqual(['local']);
      expect(offline).toHaveBeenCalledOnce();
      expect(online).not.toHaveBeenCalled();
    } finally {
      observer.destroy();
      client.clear();
    }
  });

  it('uses reconciled cache data so online refreshes retain local edits in the UI', async () => {
    const query = createOfflineQueryFn(
      async () => [{ id: '1', name: 'Server value' }],
      async () => [],
      async () => [{ id: '1', name: 'Unsynced local value' }],
    );

    expect(await query(true)).toEqual([{ id: '1', name: 'Unsynced local value' }]);
  });

  it('falls back on a dropped connection but surfaces server authorization errors', async () => {
    const offline = vi.fn(async () => ['local']);
    const online = vi.fn<() => Promise<string[]>>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce({ code: '42501', message: 'permission denied' });
    const query = createOfflineQueryFn(online, offline);

    expect(await query(true)).toEqual(['local']);
    await expect(query(true)).rejects.toMatchObject({ code: '42501' });
    expect(offline).toHaveBeenCalledOnce();
  });

  it('recognizes PostgREST plain-object fetch failures while the browser reports online', async () => {
    const offline = vi.fn(async () => ['local']);
    const query = createOfflineQueryFn(
      async () => {
        throw { message: 'TypeError: Failed to fetch', code: '', hint: '', details: 'TypeError: Failed to fetch' };
      },
      offline,
    );

    expect(await query(true)).toEqual(['local']);
    expect(offline).toHaveBeenCalledOnce();
  });
});

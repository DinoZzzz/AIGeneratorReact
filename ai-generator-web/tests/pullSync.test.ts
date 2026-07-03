import { beforeEach, describe, expect, it, vi } from 'vitest';

type TestPendingOp = {
  id: string;
  store: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  entityId?: string;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'failed';
};

const testState = vi.hoisted(() => ({
  metadata: new Map<string, unknown>(),
  tableRows: {} as Record<string, Array<Record<string, unknown>>>,
  tombstones: [] as Array<{ id: number; table_name: string; row_id: string }>,
  tombstoneError: null as { code?: string; message?: string } | null,
  pendingOps: [] as TestPendingOp[],
  savedRows: [] as Array<{ store: string; rows: Array<Record<string, unknown>> }>,
  deletedKeys: [] as Array<{ store: string; key: unknown }>,
}));

const offlineDbMock = vi.hoisted(() => ({
  STORES: {
    CUSTOMERS: 'customers',
    CONSTRUCTIONS: 'constructions',
    REPORTS: 'reports',
    APPOINTMENTS: 'appointments',
    MESSAGES: 'messages',
    EXAMINERS: 'examiners',
    REPORT_TYPES: 'report_types',
    MATERIALS: 'materials',
    SCHEME_IMAGES: 'scheme_images',
    CERTIFIERS: 'certifiers',
    EXPORT_HISTORY: 'export_history',
    EXPORT_HISTORY_FORMS: 'export_history_forms',
    REPORT_FILES: 'report_files',
    FILE_BLOBS: 'file_blobs',
    TEMPLATE_CACHE: 'template_cache',
    UPLOADS: 'uploads',
    SYNC_QUEUE: 'sync_queue',
    METADATA: 'metadata',
  } as const,
  compactPendingSyncOperations: vi.fn(async () => 0),
  getPersistedSyncIdMap: vi.fn(async () => ({})),
  getPendingSyncOperations: vi.fn(async () => testState.pendingOps),
  getFailedSyncOperations: vi.fn(async () => []),
  getSyncOperationsByStatus: vi.fn(async () => []),
  persistSyncIdMapping: vi.fn(async () => {}),
  markSyncOperationDiscarded: vi.fn(async () => {}),
  restoreDiscardedSyncOperation: vi.fn(async () => {}),
  remapQueuedSyncReferences: vi.fn(async () => 0),
  removeSyncOperation: vi.fn(async () => {}),
  resetSyncOperationForRetry: vi.fn(async () => {}),
  updateSyncOperationStatus: vi.fn(async () => {}),
  getByIndex: vi.fn(async () => []),
  getAllFromStore: vi.fn(async () => []),
  getMetadata: vi.fn(async (key: string) => testState.metadata.get(key)),
  saveMetadata: vi.fn(async (key: string, value: unknown) => {
    testState.metadata.set(key, value);
  }),
  saveManyToStore: vi.fn(async (store: string, rows: Array<Record<string, unknown>>) => {
    testState.savedRows.push({ store, rows });
  }),
  saveToStore: vi.fn(async () => {}),
  deleteFromStore: vi.fn(async (store: string, key: unknown) => {
    testState.deletedKeys.push({ store, key });
  }),
}));

const fromMock = vi.hoisted(() =>
  vi.fn((table: string) => {
    const getResult = () => {
      if (table === 'sync_tombstones') {
        if (testState.tombstoneError) {
          return { data: null, error: testState.tombstoneError };
        }
        return { data: testState.tombstones, error: null };
      }
      return { data: testState.tableRows[table] ?? [], error: null };
    };

    const builder: Record<string, unknown> = {};
    Object.assign(builder, {
      select: () => builder,
      order: () => builder,
      limit: () => builder,
      gt: () => builder,
      or: () => builder,
      then: (onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
        Promise.resolve(getResult()).then(onFulfilled, onRejected),
    });
    return builder;
  })
);

vi.mock('../src/lib/offlineDb', () => offlineDbMock);
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: fromMock,
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { access_token: 'token', refresh_token: 'refresh' } },
        error: null,
      })),
      setSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    },
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/mock' } })),
      })),
    },
  },
}));

import { pullRemoteChanges } from '../src/lib/syncService';

describe('pullRemoteChanges', () => {
  beforeEach(() => {
    testState.metadata = new Map();
    testState.tableRows = {};
    testState.tombstones = [];
    testState.tombstoneError = null;
    testState.pendingOps = [];
    testState.savedRows = [];
    testState.deletedKeys = [];
    vi.clearAllMocks();
  });

  it('replicates server rows into local stores and advances cursors', async () => {
    testState.tableRows.customers = [
      { id: 'c1', name: 'Alpha', updated_at: '2026-01-01T00:00:00+00:00' },
      { id: 'c2', name: 'Beta', updated_at: '2026-01-02T00:00:00+00:00' },
    ];
    testState.tombstones = [{ id: 7, table_name: 'report_forms', row_id: 'r9' }];

    const result = await pullRemoteChanges({ force: true });

    expect(result.skipped).toBe(false);
    expect(result.applied).toBe(2);
    expect(result.deleted).toBe(1);
    expect(result.errors).toBe(0);

    const customerSave = testState.savedRows.find((entry) => entry.store === 'customers');
    expect(customerSave).toBeDefined();
    expect(customerSave!.rows).toHaveLength(2);
    expect(customerSave!.rows.every((row) => row._synced === true)).toBe(true);

    expect(testState.metadata.get('pull_cursor_customers')).toEqual({
      ts: '2026-01-02T00:00:00+00:00',
      id: 'c2',
    });
    expect(testState.metadata.get('pull_cursor_tombstones')).toBe(7);
    expect(testState.deletedKeys).toContainEqual({ store: 'reports', key: 'r9' });
    expect(typeof testState.metadata.get('last_pull_at')).toBe('number');
  });

  it('never overwrites or deletes rows with queued local changes', async () => {
    testState.pendingOps = [{
      id: 'op-1',
      store: 'customers',
      operation: 'update',
      data: { name: 'edited offline' },
      entityId: 'c1',
      timestamp: 1,
      retryCount: 0,
      status: 'pending',
    }];
    testState.tableRows.customers = [
      { id: 'c1', name: 'Server version', updated_at: '2026-01-03T00:00:00+00:00' },
      { id: 'c2', name: 'Beta', updated_at: '2026-01-04T00:00:00+00:00' },
    ];
    testState.tombstones = [{ id: 3, table_name: 'customers', row_id: 'c1' }];

    const result = await pullRemoteChanges({ force: true });

    expect(result.applied).toBe(1);
    const customerSave = testState.savedRows.find((entry) => entry.store === 'customers');
    expect(customerSave!.rows.map((row) => row.id)).toEqual(['c2']);

    // The tombstone for the locally-edited row is skipped: the queue replay
    // will surface the miss as a conflict instead of silently deleting.
    expect(result.deleted).toBe(0);
    expect(testState.deletedKeys).toHaveLength(0);
    // But the tombstone cursor still advances past it.
    expect(testState.metadata.get('pull_cursor_tombstones')).toBe(3);
  });

  it('tolerates a missing tombstone table (migration not applied yet)', async () => {
    testState.tableRows.customers = [
      { id: 'c1', name: 'Alpha', updated_at: '2026-01-01T00:00:00+00:00' },
    ];
    testState.tombstoneError = {
      code: '42P01',
      message: 'relation "public.sync_tombstones" does not exist',
    };

    const result = await pullRemoteChanges({ force: true });

    expect(result.applied).toBe(1);
    expect(result.deleted).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('throttles pulls that are not forced', async () => {
    await pullRemoteChanges({ force: true });
    const second = await pullRemoteChanges();

    expect(second.skipped).toBe(true);
    expect(second.applied).toBe(0);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

type TestSyncOperation = {
  id: string;
  store: 'customers' | 'constructions' | 'reports' | 'appointments' | 'messages' | 'examiners' | 'report_types' | 'materials' | 'scheme_images' | 'certifiers' | 'export_history' | 'export_history_forms' | 'report_files' | 'template_cache';
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  entityId?: string;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'in_progress' | 'failed' | 'discarded';
  error?: string;
};

const testState = vi.hoisted(() => ({
  pendingOps: [] as TestSyncOperation[],
  failedOps: [] as TestSyncOperation[],
  discardedOps: [] as TestSyncOperation[],
  persistedIdMap: {} as Record<string, string>,
  constructionRowsForCustomerDelete: [] as Array<{ id: string }>,
  updateCalls: [] as Array<{ table: string; id: string; data: Record<string, unknown> }>,
  deleteCalls: [] as Array<{ table: string; id: string }>,
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
    TEMPLATE_CACHE: 'template_cache',
    SYNC_QUEUE: 'sync_queue',
    METADATA: 'metadata',
  } as const,
  compactPendingSyncOperations: vi.fn(async () => 0),
  getPersistedSyncIdMap: vi.fn(async () => testState.persistedIdMap),
  getPendingSyncOperations: vi.fn(async () => testState.pendingOps),
  getFailedSyncOperations: vi.fn(async () => testState.failedOps),
  getSyncOperationsByStatus: vi.fn(async (status: string) => {
    if (status === 'discarded') return testState.discardedOps;
    return [];
  }),
  persistSyncIdMapping: vi.fn(async () => {}),
  markSyncOperationDiscarded: vi.fn(async () => {}),
  restoreDiscardedSyncOperation: vi.fn(async () => {}),
  remapQueuedSyncReferences: vi.fn(async () => 0),
  removeSyncOperation: vi.fn(async () => {}),
  resetSyncOperationForRetry: vi.fn(async () => {}),
  updateSyncOperationStatus: vi.fn(async () => {}),
  getByIndex: vi.fn(async () => []),
  saveManyToStore: vi.fn(async () => {}),
  saveToStore: vi.fn(async () => {}),
  deleteFromStore: vi.fn(async () => {}),
}));

const fromMock = vi.hoisted(() =>
  vi.fn((table: string) => ({
    insert: (rows: unknown[]) => ({
      select: () => ({
        single: async () => ({
          data: { id: `server-${table}-id`, ...((rows?.[0] as Record<string, unknown>) || {}) },
          error: null,
        }),
      }),
    }),
    update: (data: Record<string, unknown>) => ({
      eq: (_field: string, id: string) => ({
        select: () => ({
          single: async () => {
            testState.updateCalls.push({ table, id, data });
            return { data: { id, ...data }, error: null };
          },
        }),
      }),
    }),
    delete: () => ({
      eq: async (_field: string, id: string) => {
        testState.deleteCalls.push({ table, id });
        return { error: null };
      },
    }),
    select: () => ({
      eq: (field: string, value: string) => {
        const result = table === 'constructions' && field === 'customer_id'
          ? { data: testState.constructionRowsForCustomerDelete, error: null }
          : { data: [{ id: value }], error: null };
        const promise = Promise.resolve(result);
        const builder = {
          eq: () => builder,
          order: () => builder,
          limit: () => builder,
          maybeSingle: async () => ({
            data: Array.isArray(result.data) ? result.data[0] ?? null : result.data,
            error: result.error,
          }),
          then: promise.then.bind(promise),
          catch: promise.catch.bind(promise),
          finally: promise.finally.bind(promise),
        };
        return builder;
      },
    }),
  }))
);

const constructionServiceMock = vi.hoisted(() => ({
  delete: vi.fn(async () => {}),
}));

const customerServiceMock = vi.hoisted(() => ({
  delete: vi.fn(async () => {}),
}));

vi.mock('../src/lib/offlineDb', () => offlineDbMock);
vi.mock('../src/lib/supabase', () => ({
  supabase: { from: fromMock },
}));
vi.mock('../src/services/constructionService', () => ({
  constructionService: constructionServiceMock,
}));
vi.mock('../src/services/customerService', () => ({
  customerService: customerServiceMock,
}));

import {
  discardFailedOperationById,
  resolveConflictUseServerById,
  restoreDiscardedOperationById,
  retryFailedOperationById,
  syncPendingOperations,
} from '../src/lib/syncService';

describe('syncService offline flows', () => {
  beforeEach(() => {
    testState.pendingOps = [];
    testState.failedOps = [];
    testState.discardedOps = [];
    testState.persistedIdMap = {};
    testState.constructionRowsForCustomerDelete = [];
    testState.updateCalls = [];
    testState.deleteCalls = [];
    vi.clearAllMocks();
  });

  it('uses persisted temp-id map after restart and compacts queue before sync', async () => {
    testState.persistedIdMap = {
      temp_report_1: 'report_1',
      temp_construction_1: 'construction_1',
    };
    testState.pendingOps = [{
      id: 'op-1',
      store: 'reports',
      operation: 'update',
      data: { construction_id: 'temp_construction_1', ordinal: 9 },
      entityId: 'temp_report_1',
      timestamp: 1,
      retryCount: 0,
      status: 'pending',
    }];

    const result = await syncPendingOperations();

    expect(result.total).toBe(1);
    expect(offlineDbMock.compactPendingSyncOperations).toHaveBeenCalledTimes(1);
    expect(offlineDbMock.remapQueuedSyncReferences).toHaveBeenCalledWith({
      temp_report_1: 'report_1',
      temp_construction_1: 'construction_1',
    });
    expect(testState.updateCalls).toHaveLength(1);
    expect(testState.updateCalls[0]).toMatchObject({
      table: 'report_forms',
      id: 'report_1',
      data: { construction_id: 'construction_1', ordinal: 9 },
    });
  });

  it('uses cascade-safe delete service for construction delete operations', async () => {
    testState.pendingOps = [{
      id: 'op-delete-construction',
      store: 'constructions',
      operation: 'delete',
      data: null,
      entityId: 'construction-1',
      timestamp: 1,
      retryCount: 0,
      status: 'pending',
    }];

    await syncPendingOperations();

    expect(constructionServiceMock.delete).toHaveBeenCalledWith('construction-1');
    expect(testState.deleteCalls.some((call) => call.table === 'constructions')).toBe(false);
  });

  it('uses cascade-safe delete service for customer delete operations', async () => {
    testState.pendingOps = [{
      id: 'op-delete-customer',
      store: 'customers',
      operation: 'delete',
      data: null,
      entityId: 'customer-1',
      timestamp: 1,
      retryCount: 0,
      status: 'pending',
    }];
    testState.constructionRowsForCustomerDelete = [{ id: 'construction-a' }, { id: 'construction-b' }];

    await syncPendingOperations();

    expect(constructionServiceMock.delete).toHaveBeenCalledWith('construction-a');
    expect(constructionServiceMock.delete).toHaveBeenCalledWith('construction-b');
    expect(customerServiceMock.delete).toHaveBeenCalledWith('customer-1');
  });

  it('retries, discards to local-only, and restores operations by id', async () => {
    testState.failedOps = [{
      id: 'failed-op',
      store: 'reports',
      operation: 'update',
      data: { ordinal: 2 },
      entityId: 'report-1',
      timestamp: 1,
      retryCount: 5,
      status: 'failed',
      error: '409 conflict',
    }];

    const retried = await retryFailedOperationById('failed-op');
    const discarded = await discardFailedOperationById('failed-op');

    testState.discardedOps = [{
      id: 'discarded-op',
      store: 'reports',
      operation: 'update',
      data: { ordinal: 2 },
      entityId: 'report-1',
      timestamp: 1,
      retryCount: 5,
      status: 'discarded',
      error: 'local-only',
    }];
    const restored = await restoreDiscardedOperationById('discarded-op');

    expect(retried).toBe(true);
    expect(discarded).toBe(true);
    expect(restored).toBe(true);
    expect(offlineDbMock.resetSyncOperationForRetry).toHaveBeenCalledWith('failed-op');
    expect(offlineDbMock.markSyncOperationDiscarded).toHaveBeenCalledWith(
      'failed-op',
      expect.stringContaining('Marked as local-only by user')
    );
    expect(offlineDbMock.restoreDiscardedSyncOperation).toHaveBeenCalledWith('discarded-op');
  });

  it('resolves failed conflicts by trusting server state', async () => {
    testState.failedOps = [{
      id: 'failed-conflict',
      store: 'reports',
      operation: 'update',
      data: { ordinal: 3 },
      entityId: 'report-1',
      timestamp: 1,
      retryCount: 5,
      status: 'failed',
      error: 'Conflict: duplicate key',
    }];

    const resolved = await resolveConflictUseServerById('failed-conflict');

    expect(resolved).toBe(true);
    expect(offlineDbMock.saveToStore).toHaveBeenCalledWith(
      'reports',
      expect.objectContaining({ id: 'report-1', _synced: true })
    );
    expect(offlineDbMock.removeSyncOperation).toHaveBeenCalledWith('failed-conflict');
  });

  it('syncs queued export history records', async () => {
    testState.pendingOps = [{
      id: 'op-export-history',
      store: 'export_history',
      operation: 'create',
      data: {
        exportPayload: {
          construction_id: 'construction-1',
          customer_id: 'customer-1',
          user_id: 'user-1',
          type_id: 1,
          examination_date: '2026-02-09',
        },
        forms: [
          { form_id: 'form-1', type_id: 1, ordinal: 1 },
        ],
      },
      entityId: 'queued_export_1',
      timestamp: 1,
      retryCount: 0,
      status: 'pending',
    }];

    const result = await syncPendingOperations();

    expect(result.total).toBe(1);
    expect(result.success).toBe(1);
    expect(offlineDbMock.removeSyncOperation).toHaveBeenCalledWith('op-export-history');
  });
});

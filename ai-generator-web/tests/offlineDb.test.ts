import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STORES,
  addToSyncQueue,
  cacheRemoteRows,
  cleanupStaleUploadOperations,
  clearStore,
  compactPendingSyncOperations,
  deleteFromStore,
  getFromStore,
  getPendingSyncOperations,
  resetStuckSyncOperations,
  persistSyncIdMapping,
  saveManyToStore,
  saveToStore,
  type SyncOperation,
  updateSyncOperationStatus,
} from '../src/lib/offlineDb';

const clearAllOfflineStores = async () => {
  await Promise.all([
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
    clearStore(STORES.TEMPLATE_CACHE),
    clearStore(STORES.UPLOADS),
    clearStore(STORES.SYNC_QUEUE),
    clearStore(STORES.METADATA),
  ]);
};

describe('offlineDb sync queue', () => {
  beforeEach(async () => {
    await clearAllOfflineStores();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['put', 'delete', 'clear'] as const)('rejects %s when the transaction aborts after request success', async (method) => {
    await saveToStore(STORES.CUSTOMERS, { id: 'customer-1', name: 'Original' });
    const original = IDBObjectStore.prototype[method];
    vi.spyOn(IDBObjectStore.prototype, method).mockImplementation(function (this: IDBObjectStore, ...args: unknown[]) {
      const request = Reflect.apply(original, this, args) as IDBRequest;
      request.addEventListener('success', () => request.transaction?.abort());
      return request;
    });

    const write = method === 'put'
      ? saveToStore(STORES.CUSTOMERS, { id: 'customer-1', name: 'Edited' })
      : method === 'delete'
        ? deleteFromStore(STORES.CUSTOMERS, 'customer-1')
        : clearStore(STORES.CUSTOMERS);

    await expect(write).rejects.toMatchObject({ name: 'AbortError' });
    expect(await getFromStore(STORES.CUSTOMERS, 'customer-1')).toEqual({
      id: 'customer-1', name: 'Original',
    });
  });

  it('rolls back the whole batch when an item has an invalid key', async () => {
    await expect(saveManyToStore(STORES.CUSTOMERS, [
      { id: 'customer-1', name: 'Should roll back' },
      { name: 'Missing id' },
    ])).rejects.toMatchObject({ name: 'DataError' });

    expect(await getFromStore(STORES.CUSTOMERS, 'customer-1')).toBeUndefined();
  });

  it.each(['single', 'batch'] as const)('preserves the request error when a %s write aborts', async (mode) => {
    await saveToStore(STORES.CUSTOMERS, { id: 'customer-1', name: 'Original' });
    // Force a genuine asynchronous constraint failure rather than an explicit
    // abort: transaction.error is still null when the request error bubbles.
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value: unknown) {
      return this.add(value);
    });

    const write = mode === 'single'
      ? saveToStore(STORES.CUSTOMERS, { id: 'customer-1', name: 'Edited' })
      : saveManyToStore(STORES.CUSTOMERS, [
        { id: 'customer-2', name: 'Should roll back' },
        { id: 'customer-1', name: 'Edited' },
      ]);

    await expect(write).rejects.toMatchObject({ name: 'ConstraintError' });
    expect(await getFromStore(STORES.CUSTOMERS, 'customer-1')).toEqual({
      id: 'customer-1', name: 'Original',
    });
    expect(await getFromStore(STORES.CUSTOMERS, 'customer-2')).toBeUndefined();
  });

  it.each(['pending', 'failed', 'in_progress', 'discarded'] as const)('preserves %s local edits and deletes when refreshing server data', async (status) => {
    await saveToStore(STORES.CUSTOMERS, { id: 'edited', name: 'Local edit' });
    const editedId = await addToSyncQueue(STORES.CUSTOMERS, 'update', { name: 'Local edit' }, 'edited');
    const deletedId = await addToSyncQueue(STORES.CUSTOMERS, 'delete', null, 'deleted');
    await updateSyncOperationStatus(editedId, status);
    await updateSyncOperationStatus(deletedId, status);

    const rows = await cacheRemoteRows(STORES.CUSTOMERS, [
      { id: 'edited', name: 'Old server value' },
      { id: 'deleted', name: 'Deleted locally' },
      { id: 'fresh', name: 'Fresh server value' },
    ]);

    expect(rows).toEqual([
      { id: 'edited', name: 'Local edit' },
      { id: 'fresh', name: 'Fresh server value', _synced: true },
    ]);
    expect(await getFromStore(STORES.CUSTOMERS, 'edited')).toEqual({ id: 'edited', name: 'Local edit' });
    expect(await getFromStore(STORES.CUSTOMERS, 'deleted')).toBeUndefined();
  });

  it('protects queued edits whose temporary ID was mapped by an earlier sync', async () => {
    await saveToStore(STORES.CUSTOMERS, { id: 'real-id', name: 'Local edit' });
    await addToSyncQueue(STORES.CUSTOMERS, 'update', { name: 'Local edit' }, 'temp-id');
    await persistSyncIdMapping('temp-id', 'real-id');

    expect(await cacheRemoteRows(STORES.CUSTOMERS, [{ id: 'real-id', name: 'Server value' }]))
      .toEqual([{ id: 'real-id', name: 'Local edit' }]);
  });

  it('does not revive report files awaiting upload-queue deletion', async () => {
    await addToSyncQueue(STORES.UPLOADS, 'delete', { kind: 'report_file_delete', file_id: 'file-1' }, 'file-1');

    expect(await cacheRemoteRows(STORES.REPORT_FILES, [{ id: 'file-1', file_path: 'remote.png' }])).toEqual([]);
    expect(await getFromStore(STORES.REPORT_FILES, 'file-1')).toBeUndefined();
  });

  it('preserves a queued signature upload when refreshing certifiers', async () => {
    await saveToStore(STORES.CERTIFIERS, { id: 'certifier-1', signature_url: 'blob:local-signature' });
    await addToSyncQueue(STORES.UPLOADS, 'update', { kind: 'certifier_signature_upload' }, 'certifier-1');

    expect(await cacheRemoteRows(STORES.CERTIFIERS, [{ id: 'certifier-1', signature_url: 'remote.png' }]))
      .toEqual([{ id: 'certifier-1', signature_url: 'blob:local-signature' }]);
  });

  it('retains a server timestamp as the conflict baseline after caching a query', async () => {
    const updatedAt = '2026-10-01T10:00:00Z';
    await cacheRemoteRows(STORES.CUSTOMERS, [{ id: 'customer-1', name: 'Server value', updated_at: updatedAt }]);
    await addToSyncQueue(STORES.CUSTOMERS, 'update', { name: 'Offline edit' }, 'customer-1');

    expect(await getPendingSyncOperations()).toEqual([
      expect.objectContaining({ entityId: 'customer-1', baseUpdatedAt: updatedAt }),
    ]);
  });

  it('keeps a compacted parent create before dependent child creates', async () => {
    const common = { retryCount: 0, status: 'pending' as const };
    const operations: SyncOperation[] = [
      { ...common, id: 'op-parent', store: STORES.CUSTOMERS, operation: 'create',
        entityId: 'temp_customer_1', data: { name: 'Original' }, timestamp: 1 },
      { ...common, id: 'op-child', store: STORES.CONSTRUCTIONS, operation: 'create',
        entityId: 'temp_construction_1', data: { customer_id: 'temp_customer_1' }, timestamp: 2 },
      { ...common, id: 'op-edit-parent', store: STORES.CUSTOMERS, operation: 'update',
        entityId: 'temp_customer_1', data: { name: 'Edited' }, timestamp: 3 },
    ];
    await saveManyToStore(STORES.SYNC_QUEUE, operations);

    await compactPendingSyncOperations();
    const pendingOps = await getPendingSyncOperations();

    expect(pendingOps.map((operation) => operation.id)).toEqual(['op-parent', 'op-child']);
    expect(pendingOps[0].data).toEqual({ name: 'Edited' });
  });

  it('recovers stuck in_progress operations back to pending', async () => {
    const opId = await addToSyncQueue(
      STORES.REPORTS,
      'update',
      { ordinal: 2 },
      'report-1',
    );

    await updateSyncOperationStatus(opId, 'in_progress');
    const recoveredCount = await resetStuckSyncOperations();
    const pendingOps = await getPendingSyncOperations();

    expect(recoveredCount).toBe(1);
    expect(pendingOps.some((operation) => operation.id === opId)).toBe(true);
  });

  it('compacts create + updates for same entity into one create operation', async () => {
    await addToSyncQueue(
      STORES.REPORTS,
      'create',
      { id: 'temp_report_1', dionica: 'A', remark: 'old' },
      'temp_report_1',
    );
    await addToSyncQueue(
      STORES.REPORTS,
      'update',
      { remark: 'new' },
      'temp_report_1',
    );
    await addToSyncQueue(
      STORES.REPORTS,
      'update',
      { deviation: 'none' },
      'temp_report_1',
    );

    const compacted = await compactPendingSyncOperations();
    const pendingOps = await getPendingSyncOperations();

    expect(compacted).toBeGreaterThan(0);
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0].operation).toBe('create');
    expect(pendingOps[0].data).toMatchObject({
      id: 'temp_report_1',
      dionica: 'A',
      remark: 'new',
      deviation: 'none',
    });
  });

  it('removes create + delete pair for same temp entity during compaction', async () => {
    await addToSyncQueue(
      STORES.CONSTRUCTIONS,
      'create',
      { id: 'temp_construction_1', name: 'Temp Construction' },
      'temp_construction_1',
    );
    await addToSyncQueue(
      STORES.CONSTRUCTIONS,
      'delete',
      null,
      'temp_construction_1',
    );

    await compactPendingSyncOperations();
    const pendingOps = await getPendingSyncOperations();

    expect(pendingOps).toHaveLength(0);
  });

  it('cleans up stale/overflow upload operations and removes orphaned temp report files', async () => {
    await saveToStore(STORES.REPORT_FILES, {
      id: 'temp_file_old',
      construction_id: 'construction-1',
      file_path: 'blob:old',
      file_name: 'old.png',
      file_type: 'image',
      created_at: new Date().toISOString(),
    });
    await saveToStore(STORES.REPORT_FILES, {
      id: 'temp_file_new',
      construction_id: 'construction-1',
      file_path: 'blob:new',
      file_name: 'new.png',
      file_type: 'image',
      created_at: new Date().toISOString(),
    });

    await addToSyncQueue(
      STORES.UPLOADS,
      'create',
      {
        kind: 'report_file_upload',
        construction_id: 'construction-1',
        file_name: 'old.png',
        file_type: 'image',
        blob: new Blob(['old-payload']),
      },
      'temp_file_old',
    );
    await new Promise((resolve) => setTimeout(resolve, 5));
    await addToSyncQueue(
      STORES.UPLOADS,
      'create',
      {
        kind: 'report_file_upload',
        construction_id: 'construction-1',
        file_name: 'new.png',
        file_type: 'image',
        blob: new Blob(['new-payload']),
      },
      'temp_file_new',
    );

    const cleanupResult = await cleanupStaleUploadOperations({
      maxUploadOperations: 1,
      maxTotalBytes: 1024 * 1024,
      maxAgeMs: 1000 * 60 * 60,
    });

    const pendingOps = await getPendingSyncOperations();
    const oldTempRecord = await getFromStore(STORES.REPORT_FILES, 'temp_file_old');
    const newTempRecord = await getFromStore(STORES.REPORT_FILES, 'temp_file_new');

    expect(cleanupResult.removed).toBe(1);
    expect(cleanupResult.remainingUploads).toBe(1);
    expect(pendingOps).toHaveLength(1);
    expect(pendingOps[0].entityId).toBe('temp_file_new');
    expect(oldTempRecord).toBeUndefined();
    expect(newTempRecord).toBeDefined();
  });
});

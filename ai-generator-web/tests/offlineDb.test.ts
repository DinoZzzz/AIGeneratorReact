import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  STORES,
  addToSyncQueue,
  cleanupStaleUploadOperations,
  clearStore,
  compactPendingSyncOperations,
  getFromStore,
  getPendingSyncOperations,
  resetStuckSyncOperations,
  saveToStore,
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

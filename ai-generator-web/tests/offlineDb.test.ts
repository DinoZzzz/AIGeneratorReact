import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  STORES,
  addToSyncQueue,
  clearStore,
  compactPendingSyncOperations,
  getPendingSyncOperations,
  resetStuckSyncOperations,
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
});

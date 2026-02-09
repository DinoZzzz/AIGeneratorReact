/**
 * IndexedDB-based offline storage for the application
 * Stores data locally and tracks pending changes for sync
 */

const DB_NAME = 'ai-generator-offline';
const DB_VERSION = 4;
const SYNC_ID_MAP_METADATA_KEY = 'sync_id_map';

// Store names
export const STORES = {
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
  UPLOADS: 'uploads',
  SYNC_QUEUE: 'sync_queue',
  METADATA: 'metadata',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

// Sync operation types
export interface SyncOperation {
  id: string;
  store: StoreName;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  entityId?: string; // For update/delete operations
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'in_progress' | 'failed' | 'discarded';
  error?: string;
}

interface SyncQueueSummary {
  pending: number;
  failed: number;
  inProgress: number;
  discarded: number;
}

type SyncIdMap = Record<string, string>;

let dbInstance: IDBDatabase | null = null;

/**
 * Open and initialize the IndexedDB database
 */
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open offline database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores for each entity type
      if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
        const customerStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' });
        customerStore.createIndex('name', 'name', { unique: false });
        customerStore.createIndex('work_order', 'work_order', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CONSTRUCTIONS)) {
        const constructionStore = db.createObjectStore(STORES.CONSTRUCTIONS, { keyPath: 'id' });
        constructionStore.createIndex('customer_id', 'customer_id', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.REPORTS)) {
        const reportStore = db.createObjectStore(STORES.REPORTS, { keyPath: 'id' });
        reportStore.createIndex('construction_id', 'construction_id', { unique: false });
        reportStore.createIndex('customer_id', 'customer_id', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.APPOINTMENTS)) {
        const appointmentStore = db.createObjectStore(STORES.APPOINTMENTS, { keyPath: 'id' });
        appointmentStore.createIndex('customer_id', 'customer_id', { unique: false });
        appointmentStore.createIndex('start', 'start', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const messageStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
        messageStore.createIndex('user_id', 'user_id', { unique: false });
        messageStore.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.EXAMINERS)) {
        const examinerStore = db.createObjectStore(STORES.EXAMINERS, { keyPath: 'id' });
        examinerStore.createIndex('name', 'name', { unique: false });
        examinerStore.createIndex('username', 'username', { unique: false });
        examinerStore.createIndex('email', 'email', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.REPORT_TYPES)) {
        const reportTypeStore = db.createObjectStore(STORES.REPORT_TYPES, { keyPath: 'id' });
        reportTypeStore.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MATERIALS)) {
        const materialsStore = db.createObjectStore(STORES.MATERIALS, { keyPath: 'id' });
        materialsStore.createIndex('material_type_id', 'material_type_id', { unique: false });
        materialsStore.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SCHEME_IMAGES)) {
        const schemeStore = db.createObjectStore(STORES.SCHEME_IMAGES, { keyPath: 'id' });
        schemeStore.createIndex('scheme_number', 'scheme_number', { unique: false });
        schemeStore.createIndex('method_type', 'method_type', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CERTIFIERS)) {
        const certifierStore = db.createObjectStore(STORES.CERTIFIERS, { keyPath: 'id' });
        certifierStore.createIndex('is_default', 'is_default', { unique: false });
        certifierStore.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.EXPORT_HISTORY)) {
        const exportHistoryStore = db.createObjectStore(STORES.EXPORT_HISTORY, { keyPath: 'id' });
        exportHistoryStore.createIndex('user_id', 'user_id', { unique: false });
        exportHistoryStore.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.EXPORT_HISTORY_FORMS)) {
        const exportHistoryFormsStore = db.createObjectStore(STORES.EXPORT_HISTORY_FORMS, { keyPath: 'id' });
        exportHistoryFormsStore.createIndex('export_id', 'export_id', { unique: false });
        exportHistoryFormsStore.createIndex('form_id', 'form_id', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.REPORT_FILES)) {
        const reportFilesStore = db.createObjectStore(STORES.REPORT_FILES, { keyPath: 'id' });
        reportFilesStore.createIndex('construction_id', 'construction_id', { unique: false });
        reportFilesStore.createIndex('report_id', 'report_id', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.TEMPLATE_CACHE)) {
        db.createObjectStore(STORES.TEMPLATE_CACHE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.UPLOADS)) {
        const uploadStore = db.createObjectStore(STORES.UPLOADS, { keyPath: 'id' });
        uploadStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Sync queue for pending operations
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        syncStore.createIndex('store', 'store', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Metadata store for last sync times, etc.
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }
    };
  });
};

/**
 * Generic function to get all items from a store
 */
export const getAllFromStore = async <T>(storeName: StoreName): Promise<T[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get a single item by ID
 */
export const getFromStore = async <T>(storeName: StoreName, id: IDBValidKey): Promise<T | undefined> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get items by index
 */
export const getByIndex = async <T>(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Save an item to a store
 */
export const saveToStore = async <T>(storeName: StoreName, item: T): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Save multiple items to a store
 */
export const saveManyToStore = async <T>(storeName: StoreName, items: T[]): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    items.forEach((item) => store.put(item));
  });
};

/**
 * Delete an item from a store
 */
export const deleteFromStore = async (storeName: StoreName, id: IDBValidKey): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Clear all items from a store
 */
export const clearStore = async (storeName: StoreName): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// ============ SYNC QUEUE OPERATIONS ============

/**
 * Add an operation to the sync queue
 */
export const addToSyncQueue = async (
  store: StoreName,
  operation: 'create' | 'update' | 'delete',
  data: unknown,
  entityId?: string
): Promise<string> => {
  const syncOp: SyncOperation = {
    id: crypto.randomUUID(),
    store,
    operation,
    data,
    entityId,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  await saveToStore(STORES.SYNC_QUEUE, syncOp);
  return syncOp.id;
};

/**
 * Get all pending sync operations
 */
export const getPendingSyncOperations = async (): Promise<SyncOperation[]> => {
  return getSyncOperationsByStatus('pending');
};

/**
 * Get sync operations by status
 */
export const getSyncOperationsByStatus = async (
  status: SyncOperation['status']
): Promise<SyncOperation[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');
    const request = index.getAll(status);

    request.onsuccess = () => {
      // Sort by timestamp to process in order
      const sorted = (request.result as SyncOperation[]).sort(
        (a, b) => a.timestamp - b.timestamp
      );
      resolve(sorted);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get failed sync operations
 */
export const getFailedSyncOperations = async (): Promise<SyncOperation[]> => {
  return getSyncOperationsByStatus('failed');
};

/**
 * Get discarded sync operations.
 * These represent local-only changes intentionally excluded from sync.
 */
export const getDiscardedSyncOperations = async (): Promise<SyncOperation[]> => {
  return getSyncOperationsByStatus('discarded');
};

/**
 * Update sync operation status
 */
export const updateSyncOperationStatus = async (
  id: string,
  status: SyncOperation['status'],
  error?: string
): Promise<void> => {
  const op = await getFromStore<SyncOperation>(STORES.SYNC_QUEUE, id);
  if (op) {
    op.status = status;
    if (error) {
      op.error = error;
    } else if (status === 'pending') {
      delete op.error;
    }

    if (status === 'failed' || (status === 'pending' && !!error)) {
      op.retryCount++;
    }

    await saveToStore(STORES.SYNC_QUEUE, op);
  }
};

/**
 * Mark an operation as discarded (kept locally but excluded from sync).
 */
export const markSyncOperationDiscarded = async (
  id: string,
  reason: string = 'Marked as local-only by user'
): Promise<void> => {
  const op = await getFromStore<SyncOperation>(STORES.SYNC_QUEUE, id);
  if (!op) return;
  op.status = 'discarded';
  op.error = reason;
  await saveToStore(STORES.SYNC_QUEUE, op);
};

/**
 * Restore a discarded operation back to pending sync.
 */
export const restoreDiscardedSyncOperation = async (id: string): Promise<void> => {
  const op = await getFromStore<SyncOperation>(STORES.SYNC_QUEUE, id);
  if (!op) return;
  op.status = 'pending';
  delete op.error;
  await saveToStore(STORES.SYNC_QUEUE, op);
};

/**
 * Reset a failed operation for another retry attempt.
 */
export const resetSyncOperationForRetry = async (id: string): Promise<void> => {
  const op = await getFromStore<SyncOperation>(STORES.SYNC_QUEUE, id);
  if (!op) return;
  op.status = 'pending';
  op.retryCount = 0;
  delete op.error;
  await saveToStore(STORES.SYNC_QUEUE, op);
};

/**
 * Remove a sync operation (after successful sync)
 */
export const removeSyncOperation = async (id: string): Promise<void> => {
  await deleteFromStore(STORES.SYNC_QUEUE, id);
};

/**
 * Remove queued operations for a specific entity.
 * Used when an offline-created entity is deleted before sync.
 */
export const removeSyncOperationsForEntity = async (
  storeName: StoreName,
  entityId: string
): Promise<number> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const queueStore = transaction.objectStore(STORES.SYNC_QUEUE);
    const getAllRequest = queueStore.getAll();
    let removedCount = 0;

    getAllRequest.onerror = () => reject(getAllRequest.error);
    getAllRequest.onsuccess = () => {
      const operations = getAllRequest.result as SyncOperation[];
      for (const operation of operations) {
        if (operation.store !== storeName) continue;
        if (operation.entityId !== entityId) continue;
        queueStore.delete(operation.id);
        removedCount++;
      }
    };

    transaction.oncomplete = () => resolve(removedCount);
    transaction.onerror = () => reject(transaction.error);
  });
};

/**
 * Get count of pending sync operations
 */
export const getPendingSyncCount = async (): Promise<number> => {
  const summary = await getSyncQueueSummary();
  return summary.pending + summary.failed;
};

/**
 * Get sync queue summary by status.
 */
export const getSyncQueueSummary = async (): Promise<SyncQueueSummary> => {
  const [pending, failed, inProgress, discarded] = await Promise.all([
    getSyncOperationsByStatus('pending'),
    getSyncOperationsByStatus('failed'),
    getSyncOperationsByStatus('in_progress'),
    getSyncOperationsByStatus('discarded'),
  ]);

  return {
    pending: pending.length,
    failed: failed.length,
    inProgress: inProgress.length,
    discarded: discarded.length,
  };
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
);

const mergeSyncPayload = (baseValue: unknown, patchValue: unknown): unknown => {
  if (isPlainObject(baseValue) && isPlainObject(patchValue)) {
    return { ...baseValue, ...patchValue };
  }
  return patchValue;
};

const syncOperationKey = (operation: SyncOperation): string | null => {
  if (!operation.entityId) return null;
  return `${operation.store}:${operation.entityId}`;
};

/**
 * Compact pending sync operations to reduce redundant queue items.
 * - merge update+update for same entity
 * - merge create+update for same temp entity into create
 * - remove create+delete pair for same temp entity
 * - keep only latest delete after updates
 */
export const compactPendingSyncOperations = async (): Promise<number> => {
  const pendingOps = await getPendingSyncOperations();
  if (pendingOps.length <= 1) {
    return 0;
  }

  const operationOrder: Record<SyncOperation['operation'], number> = {
    create: 0,
    update: 1,
    delete: 2,
  };
  const sortedPendingOps = [...pendingOps].sort((left, right) => {
    if (left.timestamp !== right.timestamp) {
      return left.timestamp - right.timestamp;
    }

    const leftKey = syncOperationKey(left);
    const rightKey = syncOperationKey(right);
    if (leftKey && rightKey && leftKey === rightKey) {
      const leftOrder = operationOrder[left.operation];
      const rightOrder = operationOrder[right.operation];
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
    }

    return left.id.localeCompare(right.id);
  });

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const queueStore = transaction.objectStore(STORES.SYNC_QUEUE);

    const latestCreateByKey = new Map<string, SyncOperation>();
    const latestUpdateByKey = new Map<string, SyncOperation>();
    let changedCount = 0;

    for (const operation of sortedPendingOps) {
      const key = syncOperationKey(operation);
      if (!key) continue;

      if (operation.operation === 'create') {
        latestCreateByKey.set(key, operation);
        latestUpdateByKey.delete(key);
        continue;
      }

      if (operation.operation === 'update') {
        const createOperation = latestCreateByKey.get(key);
        if (createOperation) {
          const mergedCreateData = mergeSyncPayload(createOperation.data, operation.data);
          queueStore.put({ ...createOperation, data: mergedCreateData, timestamp: operation.timestamp });
          latestCreateByKey.set(key, {
            ...createOperation,
            data: mergedCreateData,
            timestamp: operation.timestamp,
          });
          queueStore.delete(operation.id);
          changedCount++;
          continue;
        }

        const previousUpdate = latestUpdateByKey.get(key);
        if (previousUpdate) {
          const mergedUpdateData = mergeSyncPayload(previousUpdate.data, operation.data);
          queueStore.put({ ...previousUpdate, data: mergedUpdateData, timestamp: operation.timestamp });
          latestUpdateByKey.set(key, {
            ...previousUpdate,
            data: mergedUpdateData,
            timestamp: operation.timestamp,
          });
          queueStore.delete(operation.id);
          changedCount++;
          continue;
        }

        latestUpdateByKey.set(key, operation);
        continue;
      }

      if (operation.operation === 'delete') {
        const createOperation = latestCreateByKey.get(key);
        if (createOperation) {
          queueStore.delete(createOperation.id);
          queueStore.delete(operation.id);
          latestCreateByKey.delete(key);
          const previousUpdate = latestUpdateByKey.get(key);
          if (previousUpdate) {
            queueStore.delete(previousUpdate.id);
            latestUpdateByKey.delete(key);
            changedCount++;
          }
          changedCount += 2;
          continue;
        }

        const previousUpdate = latestUpdateByKey.get(key);
        if (previousUpdate) {
          queueStore.delete(previousUpdate.id);
          latestUpdateByKey.delete(key);
          changedCount++;
        }
      }
    }

    transaction.oncomplete = () => resolve(changedCount);
    transaction.onerror = () => reject(transaction.error);
  });
};

const mapSyncEntityId = (value: string, idMap: SyncIdMap): string => {
  const mappedValue = idMap[value];
  return typeof mappedValue === 'string' && mappedValue.length > 0 ? mappedValue : value;
};

const mapSyncNumericId = (value: number, idMap: SyncIdMap): number => {
  const mappedValue = idMap[String(value)];
  if (typeof mappedValue !== 'string' || mappedValue.length === 0) {
    return value;
  }

  const mappedNumber = Number(mappedValue);
  return Number.isFinite(mappedNumber) ? mappedNumber : value;
};

const remapSyncPayload = (
  value: unknown,
  idMap: SyncIdMap
): { value: unknown; changed: boolean } => {
  if (typeof value === 'string') {
    const mappedValue = mapSyncEntityId(value, idMap);
    return {
      value: mappedValue,
      changed: mappedValue !== value,
    };
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const mappedValue = mapSyncNumericId(value, idMap);
    return {
      value: mappedValue,
      changed: mappedValue !== value,
    };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const mapped = value.map((item) => {
      const result = remapSyncPayload(item, idMap);
      changed = changed || result.changed;
      return result.value;
    });
    return {
      value: changed ? mapped : value,
      changed,
    };
  }

  if (isPlainObject(value)) {
    let changed = false;
    const entries = Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
      const result = remapSyncPayload(nestedValue, idMap);
      changed = changed || result.changed;
      return [key, result.value] as const;
    });
    return {
      value: changed ? Object.fromEntries(entries) : value,
      changed,
    };
  }

  return { value, changed: false };
};

/**
 * Replace temp IDs in queued operations (entityId + nested payload references).
 */
export const remapQueuedSyncReferences = async (idMap: SyncIdMap): Promise<number> => {
  const validIdMap = Object.fromEntries(
    Object.entries(idMap).filter(
      ([tempId, realId]) =>
        typeof tempId === 'string' &&
        tempId.length > 0 &&
        typeof realId === 'string' &&
        realId.length > 0 &&
        tempId !== realId
    )
  ) as SyncIdMap;

  if (Object.keys(validIdMap).length === 0) {
    return 0;
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const queueStore = transaction.objectStore(STORES.SYNC_QUEUE);
    const request = queueStore.getAll();
    let updatedCount = 0;

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const operations = request.result as SyncOperation[];
      for (const operation of operations) {
        const mappedEntityId = operation.entityId
          ? mapSyncEntityId(operation.entityId, validIdMap)
          : operation.entityId;
        const remappedData = remapSyncPayload(operation.data, validIdMap);

        if (mappedEntityId === operation.entityId && !remappedData.changed) {
          continue;
        }

        queueStore.put({
          ...operation,
          entityId: mappedEntityId,
          data: remappedData.value,
        });
        updatedCount++;
      }
    };

    transaction.oncomplete = () => resolve(updatedCount);
    transaction.onerror = () => reject(transaction.error);
  });
};

/**
 * Get persisted temp-to-real ID mappings used across sync runs.
 */
export const getPersistedSyncIdMap = async (): Promise<SyncIdMap> => {
  const savedMap = await getMetadata<SyncIdMap>(SYNC_ID_MAP_METADATA_KEY);
  if (!savedMap || typeof savedMap !== 'object' || Array.isArray(savedMap)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(savedMap).filter(
      ([tempId, realId]) =>
        typeof tempId === 'string' &&
        tempId.length > 0 &&
        typeof realId === 'string' &&
        realId.length > 0
    )
  ) as SyncIdMap;
};

/**
 * Persist one temp-to-real ID mapping for future sync runs.
 */
export const persistSyncIdMapping = async (tempId: string, realId: string): Promise<void> => {
  if (!tempId || !realId || tempId === realId) {
    return;
  }

  const currentMap = await getPersistedSyncIdMap();
  if (currentMap[tempId] === realId) {
    return;
  }

  await saveMetadata(SYNC_ID_MAP_METADATA_KEY, {
    ...currentMap,
    [tempId]: realId,
  } satisfies SyncIdMap);
};

/**
 * Reset queue operations that got stuck in in_progress (e.g. tab/app closed mid-sync).
 */
export const resetStuckSyncOperations = async (): Promise<number> => {
  const inProgressOps = await getSyncOperationsByStatus('in_progress');
  if (inProgressOps.length === 0) {
    return 0;
  }

  await Promise.all(inProgressOps.map((operation) => updateSyncOperationStatus(operation.id, 'pending')));
  return inProgressOps.length;
};

// ============ METADATA OPERATIONS ============

/**
 * Save metadata
 */
export const saveMetadata = async (key: string, value: unknown): Promise<void> => {
  await saveToStore(STORES.METADATA, { key, value, updatedAt: Date.now() });
};

/**
 * Get metadata
 */
export const getMetadata = async <T>(key: string): Promise<T | undefined> => {
  const result = await getFromStore<{ key: string; value: T }>(STORES.METADATA, key);
  return result?.value;
};

// Initialize database on module load
openDatabase().catch(console.error);

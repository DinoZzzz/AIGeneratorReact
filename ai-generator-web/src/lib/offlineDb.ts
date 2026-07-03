/**
 * IndexedDB-based offline storage for the application
 * Stores data locally and tracks pending changes for sync
 */

const DB_NAME = 'ai-generator-offline';
const DB_VERSION = 5;
const SYNC_ID_MAP_METADATA_KEY = 'sync_id_map';
const DEFAULT_UPLOAD_SYNC_MAX_OPERATIONS = 80;
const DEFAULT_UPLOAD_SYNC_MAX_TOTAL_BYTES = 120 * 1024 * 1024; // 120 MB
const DEFAULT_UPLOAD_SYNC_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

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
  FILE_BLOBS: 'file_blobs',
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
  /**
   * Server-side updated_at of the row when the first offline edit was made.
   * Used as an optimistic-concurrency guard during sync replay: if the server
   * row's updated_at no longer matches, someone else changed it and the
   * operation is surfaced as a conflict instead of silently overwriting.
   */
  baseUpdatedAt?: string;
}

interface SyncQueueSummary {
  pending: number;
  failed: number;
  inProgress: number;
  discarded: number;
}

export interface UploadQueueCleanupOptions {
  maxUploadOperations?: number;
  maxTotalBytes?: number;
  maxAgeMs?: number;
}

export interface UploadQueueCleanupResult {
  scanned: number;
  removed: number;
  removedBytes: number;
  remainingUploads: number;
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

    // Another context (an older tab or the previous service worker) still
    // holds the database open at a lower version, so the upgrade cannot
    // start and every DB operation would hang. Nudge the SW lifecycle: the
    // most common blocker is the outgoing service worker, and activating
    // the waiting one terminates it, which releases its connection.
    request.onblocked = () => {
      console.warn(
        'Offline database upgrade is blocked by an older app instance (another tab or the previous service worker). ' +
        'Close other tabs of this app if data does not load.'
      );
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration()
          .then((registration) => {
            registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
            return registration?.update();
          })
          .catch(() => {});
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      // When a future version wants to upgrade, release our connection
      // immediately so we never become the blocker ourselves.
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(request.result);
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

      // Downloaded file contents (report attachments, scheme images) so
      // exports and previews work fully offline.
      if (!db.objectStoreNames.contains(STORES.FILE_BLOBS)) {
        const fileBlobStore = db.createObjectStore(STORES.FILE_BLOBS, { keyPath: 'id' });
        fileBlobStore.createIndex('construction_id', 'construction_id', { unique: false });
        fileBlobStore.createIndex('cached_at', 'cached_at', { unique: false });
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
const isNumericIdString = (value: string): boolean => /^-?\d+$/.test(value);

// Materials use numeric IDs in IndexedDB; everything else uses string keys.
const toStoreKey = (store: StoreName, entityId: string): IDBValidKey =>
  store === STORES.MATERIALS && isNumericIdString(entityId) ? Number(entityId) : entityId;

/**
 * Best-effort capture of the last known server state's updated_at for an
 * update operation. Only trusted when the local row still carries _synced
 * (i.e. it came from the server and has not been overwritten by an offline
 * edit yet), so callers should enqueue before writing the edited row locally.
 */
const captureBaseUpdatedAt = async (store: StoreName, entityId: string): Promise<string | undefined> => {
  try {
    const existing = await getFromStore<{ updated_at?: unknown; _synced?: boolean }>(
      store,
      toStoreKey(store, entityId)
    );
    if (existing?._synced && typeof existing.updated_at === 'string' && existing.updated_at) {
      return existing.updated_at;
    }
  } catch {
    // Guard is an optimization — never block queueing on it.
  }
  return undefined;
};

export const addToSyncQueue = async (
  store: StoreName,
  operation: 'create' | 'update' | 'delete',
  data: unknown,
  entityId?: string
): Promise<string> => {
  const baseUpdatedAt = operation === 'update' && entityId
    ? await captureBaseUpdatedAt(store, entityId)
    : undefined;

  const syncOp: SyncOperation = {
    id: crypto.randomUUID(),
    store,
    operation,
    data,
    entityId,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
    ...(baseUpdatedAt ? { baseUpdatedAt } : {}),
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
 * Get all sync operations regardless of status.
 */
export const getAllSyncOperations = async (): Promise<SyncOperation[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const request = store.getAll();

    request.onsuccess = () => {
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

const getUploadBlobFromOperationData = (data: unknown): Blob | null => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  const blobValue = (data as { blob?: unknown }).blob;
  return blobValue instanceof Blob ? blobValue : null;
};

const getUploadOperationKind = (data: unknown): string | undefined => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }

  const kindValue = (data as { kind?: unknown }).kind;
  return typeof kindValue === 'string' && kindValue.length > 0
    ? kindValue
    : undefined;
};

/**
 * Remove old/oversized queued upload operations to prevent unbounded IndexedDB growth.
 * Keeps the newest entries first and evicts stale/overflowed blob-backed uploads.
 */
export const cleanupStaleUploadOperations = async (
  options: UploadQueueCleanupOptions = {}
): Promise<UploadQueueCleanupResult> => {
  const maxUploadOperations = Math.max(1, options.maxUploadOperations ?? DEFAULT_UPLOAD_SYNC_MAX_OPERATIONS);
  const maxTotalBytes = Math.max(1, options.maxTotalBytes ?? DEFAULT_UPLOAD_SYNC_MAX_TOTAL_BYTES);
  const maxAgeMs = Math.max(60_000, options.maxAgeMs ?? DEFAULT_UPLOAD_SYNC_MAX_AGE_MS);
  const now = Date.now();

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.SYNC_QUEUE, STORES.REPORT_FILES], 'readwrite');
    const queueStore = transaction.objectStore(STORES.SYNC_QUEUE);
    const reportFilesStore = transaction.objectStore(STORES.REPORT_FILES);
    const request = queueStore.getAll();

    const result: UploadQueueCleanupResult = {
      scanned: 0,
      removed: 0,
      removedBytes: 0,
      remainingUploads: 0,
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const allOperations = request.result as SyncOperation[];
      const uploadOperations = allOperations
        .map((operation) => {
          if (operation.store !== STORES.UPLOADS) {
            return null;
          }

          const blob = getUploadBlobFromOperationData(operation.data);
          if (!blob) {
            return null;
          }

          return {
            operation,
            blobSize: blob.size,
            kind: getUploadOperationKind(operation.data),
          };
        })
        .filter((entry): entry is { operation: SyncOperation; blobSize: number; kind?: string } => entry !== null)
        .sort((left, right) => right.operation.timestamp - left.operation.timestamp);

      result.scanned = uploadOperations.length;

      let keptCount = 0;
      let keptBytes = 0;

      for (const entry of uploadOperations) {
        const operationAgeMs = Math.max(0, now - entry.operation.timestamp);
        const isStale = operationAgeMs > maxAgeMs;
        const exceedsCount = keptCount >= maxUploadOperations;
        const exceedsSize = keptBytes + entry.blobSize > maxTotalBytes;

        if (isStale || exceedsCount || exceedsSize) {
          queueStore.delete(entry.operation.id);
          result.removed += 1;
          result.removedBytes += entry.blobSize;

          if (
            entry.kind === 'report_file_upload' &&
            typeof entry.operation.entityId === 'string' &&
            entry.operation.entityId.startsWith('temp_file_')
          ) {
            reportFilesStore.delete(entry.operation.entityId);
          }
          continue;
        }

        keptCount += 1;
        keptBytes += entry.blobSize;
      }

      result.remainingUploads = keptCount;
    };

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
  });
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

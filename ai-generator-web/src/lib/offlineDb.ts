/**
 * IndexedDB-based offline storage for the application
 * Stores data locally and tracks pending changes for sync
 */

const DB_NAME = 'ai-generator-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
  CUSTOMERS: 'customers',
  CONSTRUCTIONS: 'constructions',
  REPORTS: 'reports',
  APPOINTMENTS: 'appointments',
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
  status: 'pending' | 'in_progress' | 'failed';
  error?: string;
}

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
export const getFromStore = async <T>(storeName: StoreName, id: string): Promise<T | undefined> => {
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
export const deleteFromStore = async (storeName: StoreName, id: string): Promise<void> => {
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
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');
    const request = index.getAll('pending');

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
    if (error) op.error = error;
    if (status === 'failed') op.retryCount++;
    await saveToStore(STORES.SYNC_QUEUE, op);
  }
};

/**
 * Remove a sync operation (after successful sync)
 */
export const removeSyncOperation = async (id: string): Promise<void> => {
  await deleteFromStore(STORES.SYNC_QUEUE, id);
};

/**
 * Get count of pending sync operations
 */
export const getPendingSyncCount = async (): Promise<number> => {
  const pending = await getPendingSyncOperations();
  return pending.length;
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

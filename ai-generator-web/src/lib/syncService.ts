/**
 * Background Sync Service
 * Handles syncing offline changes to the server when connection is restored
 */

import { supabase } from './supabase';
import { constructionService } from '../services/constructionService';
import { customerService } from '../services/customerService';
import {
  compactPendingSyncOperations,
  getPersistedSyncIdMap,
  getFailedSyncOperations,
  getSyncOperationsByStatus,
  getPendingSyncOperations,
  persistSyncIdMapping,
  markSyncOperationDiscarded,
  remapQueuedSyncReferences,
  removeSyncOperation,
  restoreDiscardedSyncOperation,
  resetSyncOperationForRetry,
  updateSyncOperationStatus,
  type SyncOperation,
  STORES,
  saveToStore,
  deleteFromStore,
} from './offlineDb';
import { NetworkError } from './errorHandler';

const MAX_RETRY_COUNT = 5;
const BASE_RETRY_DELAY_MS = 1000; // 1 second base delay

/**
 * Check if an error is a network-related error
 */
const isNetworkError = (error: unknown): boolean => {
  if (error instanceof NetworkError) return true;
  if (error instanceof TypeError && error.message === 'Failed to fetch') return true;
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('offline') ||
      message.includes('timeout') ||
      message.includes('abort')
    );
  }
  return false;
};

/**
 * Calculate exponential backoff delay with jitter
 */
const getRetryDelay = (retryCount: number): number => {
  const exponentialDelay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
  const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
};

/**
 * Wait for specified milliseconds
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

type SyncEventCallback = (event: {
  type: 'sync_start' | 'sync_complete' | 'sync_error' | 'sync_progress';
  total?: number;
  completed?: number;
  failed?: number;
  error?: string;
}) => void;

let syncInProgress = false;
const syncListeners: Set<SyncEventCallback> = new Set();

/**
 * Subscribe to sync events
 */
export const onSyncEvent = (callback: SyncEventCallback): (() => void) => {
  syncListeners.add(callback);
  return () => syncListeners.delete(callback);
};

/**
 * Emit sync event to all listeners
 */
const emitSyncEvent = (event: Parameters<SyncEventCallback>[0]) => {
  syncListeners.forEach((listener) => listener(event));
};

/**
 * Map store names to Supabase table names
 */
const storeToTable: Record<string, string> = {
  [STORES.CUSTOMERS]: 'customers',
  [STORES.CONSTRUCTIONS]: 'constructions',
  [STORES.REPORTS]: 'report_forms',
  [STORES.APPOINTMENTS]: 'calendar_events',
};

const deleteCustomerWithDependencies = async (customerId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('constructions')
    .select('id')
    .eq('customer_id', customerId);

  if (error) {
    throw error;
  }

  const constructionIds = (data || [])
    .map((item) => item.id)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  // Keep deletions ordered to avoid FK races on tightly related rows.
  for (const constructionId of constructionIds) {
    await constructionService.delete(constructionId);
  }

  await customerService.delete(customerId);
};

const mapEntityId = (entityId: string | undefined, idMap: Map<string, string>): string | undefined => {
  if (!entityId) return undefined;
  return idMap.get(entityId) ?? entityId;
};

const applyIdMap = (value: unknown, idMap: Map<string, string>): unknown => {
  if (typeof value === 'string') {
    return idMap.get(value) ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => applyIdMap(item, idMap));
  }

  if (value && typeof value === 'object') {
    const mappedEntries = Object.entries(value as Record<string, unknown>)
      .map(([key, nestedValue]) => [key, applyIdMap(nestedValue, idMap)]);
    return Object.fromEntries(mappedEntries);
  }

  return value;
};

/**
 * Process a single sync operation
 */
const processSyncOperation = async (
  operation: SyncOperation,
  idMap: Map<string, string>
): Promise<boolean> => {
  const tableName = storeToTable[operation.store];
  if (!tableName) {
    console.error(`Unknown store: ${operation.store}`);
    return false;
  }

  try {
    await updateSyncOperationStatus(operation.id, 'in_progress');

    switch (operation.operation) {
      case 'create': {
        const mappedData = applyIdMap(operation.data, idMap);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createData = mappedData as any;
        // Remove offline-only fields
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _offline_id, _is_offline, _synced, id: _tempId, ...cleanData } = createData;

        const { data, error } = await supabase
          .from(tableName)
          .insert([cleanData])
          .select()
          .single();

        if (error) throw error;

        // Update local store with server-assigned data
        // operation.entityId contains the temp ID used for the offline record
        if (data && operation.entityId) {
          if (typeof data.id === 'string' && operation.entityId !== data.id) {
            idMap.set(operation.entityId, data.id);
            await persistSyncIdMapping(operation.entityId, data.id);
            await remapQueuedSyncReferences({ [operation.entityId]: data.id });
          }

          // Remove old offline record using the temp ID
          try {
            await deleteFromStore(operation.store, operation.entityId);
          } catch (deleteError) {
            console.warn('Could not delete temp record:', deleteError);
          }
          // Save the server-returned data
          await saveToStore(operation.store, { ...data, _synced: true });
        } else if (data) {
          await saveToStore(operation.store, { ...data, _synced: true });
        }
        break;
      }

      case 'update': {
        const mappedEntityId = mapEntityId(operation.entityId, idMap);
        if (!mappedEntityId) throw new Error('Entity ID required for update');

        const mappedData = applyIdMap(operation.data, idMap);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData = mappedData as any;
        // Remove offline-only fields
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _offline_id, _is_offline, _synced, id: _entityId, ...cleanData } = updateData;

        const { data, error } = await supabase
          .from(tableName)
          .update(cleanData)
          .eq('id', mappedEntityId)
          .select()
          .single();

        if (error) throw error;

        // Update local store
        if (data) {
          await saveToStore(operation.store, { ...data, _synced: true });
        }
        break;
      }

      case 'delete': {
        const mappedEntityId = mapEntityId(operation.entityId, idMap);
        if (!mappedEntityId) throw new Error('Entity ID required for delete');

        if (operation.store === STORES.CONSTRUCTIONS) {
          await constructionService.delete(mappedEntityId);
          break;
        }

        if (operation.store === STORES.CUSTOMERS) {
          await deleteCustomerWithDependencies(mappedEntityId);
          break;
        }

        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', mappedEntityId);

        if (error) throw error;
        break;
      }
    }

    // Remove from sync queue on success
    await removeSyncOperation(operation.id);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNetwork = isNetworkError(error);
    const nextRetryCount = operation.retryCount + 1;

    console.error(`Sync operation failed:`, {
      operation: operation.operation,
      store: operation.store,
      entityId: operation.entityId,
      retryCount: operation.retryCount,
      isNetworkError: isNetwork,
      error: errorMessage
    });

    if (nextRetryCount >= MAX_RETRY_COUNT) {
      // Max retries exceeded - mark as failed
      await updateSyncOperationStatus(operation.id, 'failed', errorMessage);
      emitSyncEvent({ type: 'sync_error', error: `Operation failed after ${MAX_RETRY_COUNT} retries: ${errorMessage}` });
    } else if (isNetwork) {
      // Network error - apply exponential backoff before next retry
      const retryDelay = getRetryDelay(nextRetryCount);
      console.log(`Network error, will retry in ${Math.round(retryDelay / 1000)}s`);
      await updateSyncOperationStatus(operation.id, 'pending', errorMessage);
      await delay(retryDelay);
    } else {
      // Non-network error - still retry but without delay
      await updateSyncOperationStatus(operation.id, 'pending', errorMessage);
    }
    return false;
  }
};

/**
 * Process all pending sync operations
 */
export const syncPendingOperations = async (): Promise<{
  success: number;
  failed: number;
  total: number;
}> => {
  if (syncInProgress) {
    return { success: 0, failed: 0, total: 0 };
  }

  syncInProgress = true;
  try {
    const persistedIdMap = await getPersistedSyncIdMap();
    if (Object.keys(persistedIdMap).length > 0) {
      await remapQueuedSyncReferences(persistedIdMap);
    }

    await compactPendingSyncOperations();

    const pendingOps = await getPendingSyncOperations();
    const total = pendingOps.length;

    if (total === 0) {
      return { success: 0, failed: 0, total: 0 };
    }

    emitSyncEvent({ type: 'sync_start', total });

    let success = 0;
    let failed = 0;
    const idMap = new Map<string, string>(Object.entries(persistedIdMap));

    for (const operation of pendingOps) {
      // Skip operations that have exceeded retry limit
      if (operation.retryCount >= MAX_RETRY_COUNT) {
        await updateSyncOperationStatus(
          operation.id,
          'failed',
          operation.error || `Operation reached retry limit (${MAX_RETRY_COUNT})`
        );
        failed++;
        emitSyncEvent({
          type: 'sync_progress',
          total,
          completed: success + failed,
          failed,
        });
        continue;
      }

      const result = await processSyncOperation(operation, idMap);
      if (result) {
        success++;
      } else {
        failed++;
      }

      emitSyncEvent({
        type: 'sync_progress',
        total,
        completed: success + failed,
        failed,
      });
    }

    emitSyncEvent({
      type: 'sync_complete',
      total,
      completed: success,
      failed,
    });

    return { success, failed, total };
  } finally {
    syncInProgress = false;
  }
};

/**
 * Check if sync is currently in progress
 */
export const isSyncInProgress = (): boolean => syncInProgress;

/**
 * Force retry failed operations
 */
export const retryFailedOperations = async (): Promise<number> => {
  const failedOps = await getFailedSyncOperations();
  for (const op of failedOps) {
    await resetSyncOperationForRetry(op.id);
  }
  return failedOps.length;
};

/**
 * Retry a single failed operation by ID.
 */
export const retryFailedOperationById = async (operationId: string): Promise<boolean> => {
  const failedOps = await getFailedSyncOperations();
  const targetOperation = failedOps.find((operation) => operation.id === operationId);
  if (!targetOperation) {
    return false;
  }

  await resetSyncOperationForRetry(targetOperation.id);
  return true;
};

/**
 * Discard a single failed operation by ID.
 */
export const discardFailedOperationById = async (operationId: string): Promise<boolean> => {
  const failedOps = await getFailedSyncOperations();
  const targetOperation = failedOps.find((operation) => operation.id === operationId);
  if (!targetOperation) {
    return false;
  }

  await markSyncOperationDiscarded(
    targetOperation.id,
    `Marked as local-only by user on ${new Date().toISOString()}`
  );
  return true;
};

/**
 * Restore a single discarded operation back into pending sync.
 */
export const restoreDiscardedOperationById = async (operationId: string): Promise<boolean> => {
  const discardedOps = await getSyncOperationsByStatus('discarded');
  const targetOperation = discardedOps.find((operation) => operation.id === operationId);
  if (!targetOperation) {
    return false;
  }

  await restoreDiscardedSyncOperation(targetOperation.id);
  return true;
};

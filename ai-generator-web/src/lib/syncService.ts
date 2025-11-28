/**
 * Background Sync Service
 * Handles syncing offline changes to the server when connection is restored
 */

import { supabase } from './supabase';
import {
  getPendingSyncOperations,
  removeSyncOperation,
  updateSyncOperationStatus,
  type SyncOperation,
  STORES,
  saveToStore,
  deleteFromStore,
} from './offlineDb';

const MAX_RETRY_COUNT = 3;

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

/**
 * Process a single sync operation
 */
const processSyncOperation = async (operation: SyncOperation): Promise<boolean> => {
  const tableName = storeToTable[operation.store];
  if (!tableName) {
    console.error(`Unknown store: ${operation.store}`);
    return false;
  }

  try {
    await updateSyncOperationStatus(operation.id, 'in_progress');

    switch (operation.operation) {
      case 'create': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createData = operation.data as any;
        // Remove offline-only fields
        const { _offline_id, _is_offline, id: _id, ...cleanData } = createData;

        const { data, error } = await supabase
          .from(tableName)
          .insert([cleanData])
          .select()
          .single();

        if (error) throw error;

        // Update local store with server-assigned data
        // operation.entityId contains the temp ID used for the offline record
        if (data && operation.entityId) {
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
        if (!operation.entityId) throw new Error('Entity ID required for update');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData = operation.data as any;
        const { _offline_id, _is_offline, _synced, id, ...cleanData } = updateData;

        const { data, error } = await supabase
          .from(tableName)
          .update(cleanData)
          .eq('id', operation.entityId)
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
        if (!operation.entityId) throw new Error('Entity ID required for delete');

        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', operation.entityId);

        if (error) throw error;
        break;
      }
    }

    // Remove from sync queue on success
    await removeSyncOperation(operation.id);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Sync operation failed:`, operation, error);

    if (operation.retryCount >= MAX_RETRY_COUNT) {
      await updateSyncOperationStatus(operation.id, 'failed', errorMessage);
    } else {
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
  const pendingOps = await getPendingSyncOperations();
  const total = pendingOps.length;

  if (total === 0) {
    syncInProgress = false;
    return { success: 0, failed: 0, total: 0 };
  }

  emitSyncEvent({ type: 'sync_start', total });

  let success = 0;
  let failed = 0;

  for (const operation of pendingOps) {
    // Skip operations that have exceeded retry limit
    if (operation.retryCount >= MAX_RETRY_COUNT) {
      failed++;
      continue;
    }

    const result = await processSyncOperation(operation);
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

  syncInProgress = false;

  emitSyncEvent({
    type: 'sync_complete',
    total,
    completed: success,
    failed,
  });

  return { success, failed, total };
};

/**
 * Check if sync is currently in progress
 */
export const isSyncInProgress = (): boolean => syncInProgress;

/**
 * Force retry failed operations
 */
export const retryFailedOperations = async (): Promise<void> => {
  const pendingOps = await getPendingSyncOperations();
  for (const op of pendingOps) {
    if (op.status === 'failed') {
      await updateSyncOperationStatus(op.id, 'pending');
    }
  }
};

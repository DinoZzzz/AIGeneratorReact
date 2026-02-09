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
import { isConflictErrorMessage } from './offlineConflict';

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
  [STORES.MESSAGES]: 'messages',
  [STORES.CERTIFIERS]: 'certifiers',
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

interface QueuedExportHistoryForm {
  form_id: string;
  type_id: number;
  ordinal: number;
}

interface QueuedExportHistoryData {
  exportPayload: Record<string, unknown> & {
    construction_id: string;
    customer_id: string;
    user_id: string;
    type_id: number;
    examination_date: string;
  };
  forms: QueuedExportHistoryForm[];
}

const isDbConflictError = (error: unknown): boolean => {
  if (error && typeof error === 'object') {
    const dbError = error as { code?: string; status?: number; message?: string; details?: string };
    const message = (dbError.message || '').toLowerCase();
    const details = (dbError.details || '').toLowerCase();
    return dbError.code === '23505' ||
      dbError.status === 409 ||
      message.includes('duplicate key') ||
      details.includes('already exists');
  }
  return false;
};

const stripOfflineFields = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = value as any;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _offline_id, _is_offline, _synced, assignee_ids: _assigneeIds, id: _entityId, ...rest } = raw;
  return rest as Record<string, unknown>;
};

const syncQueuedExportHistory = async (
  rawData: unknown
): Promise<void> => {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('Invalid export history payload');
  }

  const data = rawData as QueuedExportHistoryData;
  const exportPayload = data.exportPayload;
  const forms = Array.isArray(data.forms) ? data.forms : [];

  if (!exportPayload?.construction_id || !exportPayload?.customer_id || !exportPayload?.user_id) {
    throw new Error('Invalid export history payload: missing required ids');
  }

  const { data: insertedExport, error: insertError } = await supabase
    .from('report_exports')
    .insert(exportPayload)
    .select()
    .single();

  let resolvedExport = insertedExport as { id: string } | null;
  if (insertError) {
    if (!isDbConflictError(insertError)) {
      throw insertError;
    }

    const { data: exactExistingExport, error: exactExistingExportError } = await supabase
      .from('report_exports')
      .select('id')
      .eq('construction_id', exportPayload.construction_id)
      .eq('customer_id', exportPayload.customer_id)
      .eq('user_id', exportPayload.user_id)
      .eq('type_id', exportPayload.type_id)
      .eq('examination_date', exportPayload.examination_date)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let existingExport = exactExistingExport as { id: string } | null;
    if (exactExistingExportError || !existingExport) {
      const { data: fallbackExistingExport, error: fallbackExistingExportError } = await supabase
        .from('report_exports')
        .select('id')
        .eq('construction_id', exportPayload.construction_id)
        .eq('user_id', exportPayload.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackExistingExportError || !fallbackExistingExport) {
        throw insertError;
      }
      existingExport = fallbackExistingExport as { id: string };
    }

    const { data: updatedExport, error: updateExportError } = await supabase
      .from('report_exports')
      .update(exportPayload)
      .eq('id', existingExport.id)
      .select('id')
      .single();

    if (updateExportError) throw updateExportError;
    resolvedExport = (updatedExport as { id: string } | null) || existingExport;
  }

  if (!resolvedExport || !resolvedExport.id || forms.length === 0) {
    return;
  }

  const normalizedForms = forms
    .filter((form) => typeof form.form_id === 'string' && form.form_id.length > 0)
    .map((form, index) => ({
      export_id: resolvedExport!.id,
      form_id: form.form_id,
      type_id: form.type_id,
      ordinal: form.ordinal || index + 1,
    }));

  if (normalizedForms.length === 0) {
    return;
  }

  const { error: deleteOldFormsError } = await supabase
    .from('report_export_forms')
    .delete()
    .eq('export_id', resolvedExport.id);
  if (deleteOldFormsError) throw deleteOldFormsError;

  const { error: insertFormsError } = await supabase
    .from('report_export_forms')
    .insert(normalizedForms);
  if (insertFormsError) throw insertFormsError;
};

/**
 * Process a single sync operation
 */
const processSyncOperation = async (
  operation: SyncOperation,
  idMap: Map<string, string>
): Promise<boolean> => {
  if (operation.store === STORES.EXPORT_HISTORY) {
    try {
      await updateSyncOperationStatus(operation.id, 'in_progress');
      if (operation.operation !== 'create') {
        throw new Error(`Unsupported export history operation: ${operation.operation}`);
      }

      const mappedData = applyIdMap(operation.data, idMap);
      await syncQueuedExportHistory(mappedData);
      await removeSyncOperation(operation.id);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const normalizedError = isConflictErrorMessage(errorMessage) ? `Conflict: ${errorMessage}` : errorMessage;
      const isNetwork = isNetworkError(error);
      const nextRetryCount = operation.retryCount + 1;

      if (nextRetryCount >= MAX_RETRY_COUNT) {
        await updateSyncOperationStatus(operation.id, 'failed', normalizedError);
        emitSyncEvent({ type: 'sync_error', error: `Operation failed after ${MAX_RETRY_COUNT} retries: ${normalizedError}` });
      } else if (isNetwork) {
        const retryDelay = getRetryDelay(nextRetryCount);
        await updateSyncOperationStatus(operation.id, 'pending', normalizedError);
        await delay(retryDelay);
      } else {
        await updateSyncOperationStatus(operation.id, 'pending', normalizedError);
      }
      return false;
    }
  }

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
        const cleanData = stripOfflineFields(mappedData);

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
        const cleanData = stripOfflineFields(mappedData);

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
    const normalizedError = isConflictErrorMessage(errorMessage) ? `Conflict: ${errorMessage}` : errorMessage;
    const isNetwork = isNetworkError(error);
    const nextRetryCount = operation.retryCount + 1;

    console.error(`Sync operation failed:`, {
      operation: operation.operation,
      store: operation.store,
      entityId: operation.entityId,
      retryCount: operation.retryCount,
      isNetworkError: isNetwork,
      error: normalizedError
    });

    if (nextRetryCount >= MAX_RETRY_COUNT) {
      // Max retries exceeded - mark as failed
      await updateSyncOperationStatus(operation.id, 'failed', normalizedError);
      emitSyncEvent({ type: 'sync_error', error: `Operation failed after ${MAX_RETRY_COUNT} retries: ${normalizedError}` });
    } else if (isNetwork) {
      // Network error - apply exponential backoff before next retry
      const retryDelay = getRetryDelay(nextRetryCount);
      console.log(`Network error, will retry in ${Math.round(retryDelay / 1000)}s`);
      await updateSyncOperationStatus(operation.id, 'pending', normalizedError);
      await delay(retryDelay);
    } else {
      // Non-network error - still retry but without delay
      await updateSyncOperationStatus(operation.id, 'pending', normalizedError);
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

const fetchAndApplyServerState = async (
  operation: SyncOperation,
  mappedEntityId: string | undefined
): Promise<void> => {
  const tableName = storeToTable[operation.store];
  if (!tableName || !mappedEntityId) {
    return;
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', mappedEntityId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    await saveToStore(operation.store, { ...data, _synced: true });
    return;
  }

  if (operation.entityId) {
    await deleteFromStore(operation.store, operation.entityId);
  }
};

/**
 * Resolve a failed conflict by trusting current server state and removing local queued change.
 */
export const resolveConflictUseServerById = async (operationId: string): Promise<boolean> => {
  const failedOps = await getFailedSyncOperations();
  const targetOperation = failedOps.find((operation) => operation.id === operationId);
  if (!targetOperation) {
    return false;
  }

  try {
    const persistedIdMap = await getPersistedSyncIdMap();
    const mappedEntityId = targetOperation.entityId
      ? persistedIdMap[targetOperation.entityId] ?? targetOperation.entityId
      : undefined;

    if (targetOperation.store === STORES.EXPORT_HISTORY) {
      if (targetOperation.entityId) {
        await deleteFromStore(STORES.EXPORT_HISTORY, targetOperation.entityId);
      }
      await removeSyncOperation(targetOperation.id);
      return true;
    }

    if (targetOperation.operation === 'create' && targetOperation.entityId?.startsWith('temp_')) {
      // Drop unsynced temp entity in favor of server state.
      await deleteFromStore(targetOperation.store, targetOperation.entityId);
    } else {
      await fetchAndApplyServerState(targetOperation, mappedEntityId);
    }

    await removeSyncOperation(targetOperation.id);
    return true;
  } catch (error) {
    console.error('Failed to resolve conflict using server version', error);
    return false;
  }
};

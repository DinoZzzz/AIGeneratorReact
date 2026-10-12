import {
    cacheRemoteRow, getAllSyncOperations, getPersistedSyncIdMap, removeSyncOperation,
    resetSyncOperationForRetry, STORES,
} from './offlineDb';
import { isNetworkError } from './errorHandler';
import { assertOfflineSessionCurrent, getOfflineSessionGeneration, withOfflineSyncLock } from './offlineSessionLifecycle';

/**
 * A newer edit supersedes older queued updates only after it is saved. Share
 * the replay lock so an old in-flight update cannot finish after the new one.
 * Creates remain queued until the server has assigned their permanent ID.
 */
export const saveEntityUpdate = async <T extends { id: string }, P extends object>(options: {
    store: typeof STORES.CUSTOMERS | typeof STORES.CONSTRUCTIONS | typeof STORES.MESSAGES;
    id: string;
    changes: P;
    isOnline: boolean;
    onlineUpdate: (id: string, changes: P) => Promise<T>;
    offlineUpdate: (id: string, changes: P) => Promise<T>;
}): Promise<T> => {
    const generation = getOfflineSessionGeneration();
    return withOfflineSyncLock(async () => {
        assertOfflineSessionCurrent(generation);
        const [operations, idMap] = await Promise.all([getAllSyncOperations(), getPersistedSyncIdMap()]);
        const id = idMap[options.id] ?? options.id;
        const related = operations.filter(operation => operation.store === options.store
            && operation.entityId && (idMap[operation.entityId] ?? operation.entityId) === id);
        const updates = related.filter(operation => operation.operation === 'update');
        const creates = related.filter(operation => operation.operation === 'create');
        // Include previous partial edits, with this save taking precedence.
        const changes = Object.assign({}, ...updates.map(operation => operation.data), options.changes) as P;
        const removeSupersededUpdates = () => Promise.all(updates.map(operation => removeSyncOperation(operation.id)));
        const saveOffline = async () => {
            const result = await options.offlineUpdate(id, changes);
            await removeSupersededUpdates();
            // Saving an offline-created row retries its creation with the
            // latest edit. Compaction merges the new update into that create.
            await Promise.all(creates.map(operation => resetSyncOperationForRetry(operation.id)));
            return result;
        };
        if (!options.isOnline || creates.length > 0 || id.startsWith('temp_')) return saveOffline();

        let result: T;
        try {
            result = await options.onlineUpdate(id, changes);
        } catch (error) {
            if (isNetworkError(error)) return saveOffline();
            throw error;
        }
        assertOfflineSessionCurrent(generation);
        await removeSupersededUpdates();
        return cacheRemoteRow(options.store, result);
    });
};

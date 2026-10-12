import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveEntityUpdate } from '../src/lib/offlineEntityUpdate';
import { STORES, addToSyncQueue, clearStore, compactPendingSyncOperations, getAllSyncOperations, getFromStore, persistSyncIdMapping, saveToStore, updateSyncOperationStatus } from '../src/lib/offlineDb';
import { resumeOfflineSession, suspendOfflineSession } from '../src/lib/offlineSessionLifecycle';

const store = STORES.CUSTOMERS;
type Entity = { id: string; name: string; address?: string };

beforeEach(async () => {
    vi.unstubAllGlobals();
    resumeOfflineSession();
    await Promise.all([clearStore(store), clearStore(STORES.SYNC_QUEUE), clearStore(STORES.METADATA)]);
});

const offlineUpdate = async (id: string, changes: Partial<Entity>): Promise<Entity> => {
    const previous = await getFromStore<Entity>(store, id);
    const row = { name: '', ...previous, ...changes, id };
    await addToSyncQueue(store, 'update', changes, id);
    await saveToStore(store, row);
    return row;
};

describe('saving an entity with older queued edits', () => {
    it.each(['pending', 'failed', 'in_progress', 'discarded'] as const)('supersedes a %s update only after the newer online save succeeds', async status => {
        await saveToStore(store, { id: 'customer', name: 'Old local value' });
        const oldId = await addToSyncQueue(store, 'update', { name: 'Old local value', address: 'Offline address' }, 'customer');
        await updateSyncOperationStatus(oldId, status);
        await addToSyncQueue(store, 'create', { name: 'Another customer' }, 'temp_other');
        const onlineUpdate = vi.fn(async (id: string, changes: Partial<Entity>) => ({ id, name: '', ...changes }));

        await saveEntityUpdate({ store, id: 'customer', changes: { name: 'Newest value' }, isOnline: true, onlineUpdate, offlineUpdate });

        expect(onlineUpdate).toHaveBeenCalledWith('customer', { name: 'Newest value', address: 'Offline address' });
        expect(await getFromStore(store, 'customer')).toMatchObject({ name: 'Newest value', address: 'Offline address' });
        expect(await getAllSyncOperations()).toMatchObject([{ operation: 'create', entityId: 'temp_other' }]);
    });

    it('keeps the original queue and local data when the server rejects the save', async () => {
        await saveToStore(store, { id: 'customer', name: 'Queued value' });
        const queued = await addToSyncQueue(store, 'update', { name: 'Queued value' }, 'customer');
        await updateSyncOperationStatus(queued, 'failed');
        const error = { code: '42501', message: 'permission denied' };
        await expect(saveEntityUpdate({ store, id: 'customer', changes: { name: 'Newest value' }, isOnline: true,
            onlineUpdate: async () => { throw error; }, offlineUpdate,
        })).rejects.toBe(error);
        expect(await getAllSyncOperations()).toMatchObject([{ id: queued, status: 'failed', data: { name: 'Queued value' } }]);
        expect(await getFromStore(store, 'customer')).toMatchObject({ name: 'Queued value' });
    });

    it('replaces an older failed update with the newer offline payload after connection loss', async () => {
        const queued = await addToSyncQueue(store, 'update', { name: 'Old value', address: 'Offline address' }, 'customer');
        await updateSyncOperationStatus(queued, 'failed');
        await saveEntityUpdate({ store, id: 'customer', changes: { name: 'Newest value' }, isOnline: true,
            onlineUpdate: async () => { throw new TypeError('Failed to fetch'); }, offlineUpdate,
        });
        expect(await getAllSyncOperations()).toMatchObject([{ status: 'pending', data: { name: 'Newest value', address: 'Offline address' } }]);
    });

    it('preserves and retries the original create, merging the latest temporary-row edit', async () => {
        const create = await addToSyncQueue(store, 'create', { name: 'Original', address: 'Original address' }, 'temp_customer');
        await updateSyncOperationStatus(create, 'failed');
        const onlineUpdate = vi.fn();
        await saveEntityUpdate({ store, id: 'temp_customer', changes: { name: 'Newest' }, isOnline: true, onlineUpdate, offlineUpdate });
        await compactPendingSyncOperations();
        expect(onlineUpdate).not.toHaveBeenCalled();
        expect(await getAllSyncOperations()).toMatchObject([{ id: create, operation: 'create', status: 'pending', data: { name: 'Newest', address: 'Original address' } }]);
    });

    it('waits for in-flight sync and uses its permanent ID before sending the next update', async () => {
        let release!: () => void;
        let acquired!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const waiting = new Promise<void>(resolve => { acquired = resolve; });
        vi.stubGlobal('navigator', { locks: { request: async (_name: string, task: () => Promise<unknown>) => {
            acquired(); await gate; return task();
        } } });
        const onlineUpdate = vi.fn(async (id: string, changes: Partial<Entity>) => ({ id, name: '', ...changes }));
        const saving = saveEntityUpdate({ store, id: 'temp_customer', changes: { name: 'Newest' }, isOnline: true, onlineUpdate, offlineUpdate });
        await waiting;
        expect(onlineUpdate).not.toHaveBeenCalled();
        await persistSyncIdMapping('temp_customer', 'server_customer');
        release();
        await saving;
        expect(onlineUpdate).toHaveBeenCalledWith('server_customer', { name: 'Newest' });
    });

    it('does not resume a queued save after the account changed while waiting for sync', async () => {
        vi.stubGlobal('navigator', { locks: { request: async (_name: string, task: () => Promise<unknown>) => {
            suspendOfflineSession(); return task();
        } } });
        const onlineUpdate = vi.fn();
        await expect(saveEntityUpdate({ store, id: 'customer', changes: { name: 'Newest' }, isOnline: true, onlineUpdate, offlineUpdate }))
            .rejects.toMatchObject({ name: 'OfflineSessionChangedError' });
        expect(onlineUpdate).not.toHaveBeenCalled();
    });
});

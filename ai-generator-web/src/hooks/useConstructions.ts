import { useMutation, useQueryClient } from '@tanstack/react-query';
import { constructionService } from '../services/constructionService';
import type { Construction, ReportForm } from '../types';
import { useOffline } from '../context/OfflineContext';
import { isNetworkError } from '../lib/errorHandler';
import {
  getFromStore,
  saveToStore,
  saveManyToStore,
  deleteFromStore,
  addToSyncQueue,
  removeSyncOperationsForEntity,
  getByIndex,
  STORES,
} from '../lib/offlineDb';
import { useOnlineQuery } from '../lib/offlineQueryFn';

// Query keys
export const constructionKeys = {
  all: ['constructions'] as const,
  lists: () => [...constructionKeys.all, 'list'] as const,
  byCustomer: (customerId: string, includeArchived: boolean = false) =>
    [...constructionKeys.lists(), 'customer', customerId, includeArchived ? 'all' : 'active'] as const,
  details: () => [...constructionKeys.all, 'detail'] as const,
  detail: (id: string) => [...constructionKeys.details(), id] as const,
};

// Query hooks with offline support
export const useConstructionsByCustomer = (customerId: string, includeArchived: boolean = false) =>
  useOnlineQuery<Construction[]>(
    constructionKeys.byCustomer(customerId, includeArchived),
    () => constructionService.getByCustomerId(customerId, includeArchived),
    () => getOfflineConstructionsByCustomer(customerId, includeArchived),
    {
      cacheFn: (data) => saveManyToStore(STORES.CONSTRUCTIONS, data),
      enabled: !!customerId,
      staleTime: 5 * 60 * 1000,
    },
  );

async function getOfflineConstructionsByCustomer(
  customerId: string,
  includeArchived: boolean = false
): Promise<Construction[]> {
  const constructions = await getByIndex<Construction>(STORES.CONSTRUCTIONS, 'customer_id', customerId);
  return constructions
    .filter((c) => includeArchived || !c.is_archived)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export const useConstruction = (id: string) =>
  useOnlineQuery<Construction>(
    constructionKeys.detail(id),
    () => constructionService.getById(id),
    async () => {
      const offlineData = await getFromStore<Construction>(STORES.CONSTRUCTIONS, id);
      if (!offlineData) throw new Error('Construction not found offline');
      return offlineData;
    },
    {
      cacheFn: (data) => saveToStore(STORES.CONSTRUCTIONS, data),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    },
  );

// Mutation hooks with offline support
export const useCreateConstruction = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async (construction: Partial<Construction>) => {
      if (isOnline) {
        try {
          const result = await constructionService.create(construction);
          // Cache the new construction
          await saveToStore(STORES.CONSTRUCTIONS, result);
          return result;
        } catch (error) {
          if (isNetworkError(error)) {
            return createConstructionOffline(construction);
          }
          throw error;
        }
      } else {
        return createConstructionOffline(construction);
      }
    },
    onSuccess: (_, variables) => {
      if (variables.customer_id) {
        queryClient.invalidateQueries({
          queryKey: constructionKeys.byCustomer(variables.customer_id)
        });
      }
      queryClient.invalidateQueries({ queryKey: constructionKeys.lists() });
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

async function createConstructionOffline(construction: Partial<Construction>): Promise<Construction> {
  const tempId = `temp_${crypto.randomUUID()}`;
  const offlineConstruction: Construction = {
    ...construction,
    id: tempId,
    is_active: construction.is_active ?? true,
    is_archived: false,
    created_at: new Date().toISOString(),
  } as Construction;

  // Mark as offline-created
  (offlineConstruction as Construction & { _is_offline: boolean })._is_offline = true;

  // Save to local store
  await saveToStore(STORES.CONSTRUCTIONS, offlineConstruction);

  // Add to sync queue - include temp ID so sync service knows which record to update
  await addToSyncQueue(STORES.CONSTRUCTIONS, 'create', construction, tempId);

  return offlineConstruction;
}

export const useUpdateConstruction = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async ({ id, construction }: { id: string; construction: Partial<Construction> }) => {
      if (isOnline) {
        try {
          const result = await constructionService.update(id, construction);
          // Update cache
          await saveToStore(STORES.CONSTRUCTIONS, result);
          return result;
        } catch (error) {
          if (isNetworkError(error)) {
            return updateConstructionOffline(id, construction);
          }
          throw error;
        }
      } else {
        return updateConstructionOffline(id, construction);
      }
    },
    onMutate: async ({ id, construction }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: constructionKeys.detail(id) });

      // Snapshot previous value
      const previousConstruction = queryClient.getQueryData(constructionKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(constructionKeys.detail(id), (old: Construction | undefined) => ({
        ...old,
        ...construction,
      }));

      return { previousConstruction };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousConstruction) {
        queryClient.setQueryData(constructionKeys.detail(id), context.previousConstruction);
      }
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: constructionKeys.detail(id) });
      if (data.customer_id) {
        queryClient.invalidateQueries({
          queryKey: constructionKeys.byCustomer(data.customer_id)
        });
      }
      queryClient.invalidateQueries({ queryKey: constructionKeys.lists() });
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

async function updateConstructionOffline(id: string, construction: Partial<Construction>): Promise<Construction> {
  // Get existing construction
  const existing = await getFromStore<Construction>(STORES.CONSTRUCTIONS, id);
  const updated: Construction = {
    ...existing,
    ...construction,
    id,
  } as Construction;

  // Mark as having offline changes
  (updated as Construction & { _is_offline: boolean })._is_offline = true;

  // Save to local store
  await saveToStore(STORES.CONSTRUCTIONS, updated);

  // Add to sync queue
  await addToSyncQueue(STORES.CONSTRUCTIONS, 'update', construction, id);

  return updated;
}

export const useDeleteConstruction = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          await constructionService.delete(id);
          // Remove from local cache
          await deleteFromStore(STORES.CONSTRUCTIONS, id);
        } catch (error) {
          if (isNetworkError(error)) {
            return deleteConstructionOffline(id);
          }
          throw error;
        }
      } else {
        return deleteConstructionOffline(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: constructionKeys.lists() });
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

async function deleteConstructionOffline(id: string): Promise<void> {
  const relatedReports = await getByIndex<ReportForm>(STORES.REPORTS, 'construction_id', id);
  for (const report of relatedReports) {
    await deleteFromStore(STORES.REPORTS, report.id);
    await removeSyncOperationsForEntity(STORES.REPORTS, report.id);
  }

  // Remove from local store
  await deleteFromStore(STORES.CONSTRUCTIONS, id);

  // Add to sync queue (only if not a temp/offline-created item)
  if (id.startsWith('temp_')) {
    await removeSyncOperationsForEntity(STORES.CONSTRUCTIONS, id);
    return;
  }
  await addToSyncQueue(STORES.CONSTRUCTIONS, 'delete', null, id);
}

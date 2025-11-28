/**
 * Offline-aware mutation hook
 * Wraps React Query mutations to support offline operations
 */

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { useOffline } from '../context/OfflineContext';
import {
  addToSyncQueue,
  saveToStore,
  deleteFromStore,
  type StoreName,
} from '../lib/offlineDb';

type OperationType = 'create' | 'update' | 'delete';

interface OfflineMutationOptions<TData, TVariables> {
  // The store name for offline storage
  storeName: StoreName;
  // The operation type
  operationType: OperationType;
  // Function to perform the actual API call
  mutationFn: (variables: TVariables) => Promise<TData>;
  // Function to generate a temporary ID for new items
  generateTempId?: () => string;
  // Function to extract the entity ID from variables (for update/delete)
  getEntityId?: (variables: TVariables) => string;
  // Query keys to invalidate on success
  invalidateKeys?: unknown[][];
  // Optional optimistic update function
  onOptimisticUpdate?: (variables: TVariables) => void;
  // Standard React Query options
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>;
}

export function useOfflineMutation<TData, TVariables>({
  storeName,
  operationType,
  mutationFn,
  generateTempId = () => `temp_${crypto.randomUUID()}`,
  getEntityId,
  invalidateKeys = [],
  onOptimisticUpdate,
  options = {},
}: OfflineMutationOptions<TData, TVariables>) {
  const { isOnline, triggerSync } = useOffline();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      if (isOnline) {
        // Online: perform the actual mutation
        try {
          const result = await mutationFn(variables);
          return result;
        } catch (error) {
          // If online mutation fails due to network error, fall back to offline mode
          if (error instanceof Error && error.message.includes('network')) {
            return handleOfflineMutation(variables);
          }
          throw error;
        }
      } else {
        // Offline: store locally and queue for sync
        return handleOfflineMutation(variables);
      }
    },
    onSuccess: (data, variables, context) => {
      // Invalidate queries
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      // If online, trigger sync for any pending operations
      if (isOnline) {
        triggerSync();
      }

      // Call original onSuccess if provided
      options.onSuccess?.(data, variables, context);
    },
    onError: options.onError,
    onSettled: options.onSettled,
  });

  async function handleOfflineMutation(variables: TVariables): Promise<TData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let offlineData: any;
    let entityId: string | undefined;

    switch (operationType) {
      case 'create': {
        const tempId = generateTempId();
        offlineData = {
          ...(variables as object),
          id: tempId,
          _is_offline: true,
          _offline_id: tempId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Save to local store
        await saveToStore(storeName, offlineData);

        // Add to sync queue
        await addToSyncQueue(storeName, 'create', offlineData);

        // Apply optimistic update
        onOptimisticUpdate?.(variables);

        return offlineData as TData;
      }

      case 'update': {
        entityId = getEntityId?.(variables);
        if (!entityId) {
          throw new Error('Entity ID required for update operation');
        }

        offlineData = {
          ...(variables as object),
          _is_offline: true,
          updated_at: new Date().toISOString(),
        };

        // Save to local store
        await saveToStore(storeName, { ...offlineData, id: entityId });

        // Add to sync queue
        await addToSyncQueue(storeName, 'update', variables, entityId);

        // Apply optimistic update
        onOptimisticUpdate?.(variables);

        return offlineData as TData;
      }

      case 'delete': {
        entityId = getEntityId?.(variables);
        if (!entityId) {
          throw new Error('Entity ID required for delete operation');
        }

        // Remove from local store
        await deleteFromStore(storeName, entityId);

        // Add to sync queue
        await addToSyncQueue(storeName, 'delete', null, entityId);

        // Apply optimistic update
        onOptimisticUpdate?.(variables);

        return { id: entityId } as TData;
      }

      default:
        throw new Error(`Unknown operation type: ${operationType}`);
    }
  }
}

/**
 * Helper hook for offline-aware queries
 * Falls back to local IndexedDB data when offline
 */
export function useOfflineQuery<TData>({
  queryKey,
  queryFn,
  offlineFn,
  enabled = true,
}: {
  queryKey: unknown[];
  queryFn: () => Promise<TData>;
  offlineFn: () => Promise<TData>;
  enabled?: boolean;
}) {
  const { isOnline } = useOffline();
  const queryClient = useQueryClient();

  return {
    queryKey,
    queryFn: async () => {
      if (isOnline) {
        try {
          const data = await queryFn();
          return data;
        } catch (error) {
          // Fall back to offline data on network error
          console.warn('Online query failed, falling back to offline data:', error);
          return offlineFn();
        }
      } else {
        return offlineFn();
      }
    },
    enabled,
    // Keep data in cache longer when offline
    staleTime: isOnline ? 5 * 60 * 1000 : Infinity,
    gcTime: isOnline ? 10 * 60 * 1000 : Infinity,
  };
}

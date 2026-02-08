import { useOffline } from '../context/OfflineContext';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';

/**
 * Creates a queryFn that fetches online with offline fallback.
 * Eliminates the repeated if(isOnline)/try/catch/fallback pattern.
 */
export function createOfflineQueryFn<T>(
  onlineFn: () => Promise<T>,
  offlineFn: () => Promise<T>,
  cacheFn?: (data: T) => Promise<void>,
) {
  return async (isOnline: boolean): Promise<T> => {
    if (isOnline) {
      try {
        const data = await onlineFn();
        if (cacheFn && data) await cacheFn(data);
        return data;
      } catch {
        return offlineFn();
      }
    }
    return offlineFn();
  };
}

/**
 * Hook wrapper around useQuery with built-in online/offline support.
 * Automatically uses offline fallback when network is unavailable.
 */
export function useOnlineQuery<T>(
  queryKey: readonly unknown[],
  onlineFn: () => Promise<T>,
  offlineFn: () => Promise<T>,
  options?: {
    cacheFn?: (data: T) => Promise<void>;
    staleTime?: number;
    enabled?: boolean;
    placeholderData?: UseQueryOptions<T>['placeholderData'];
  },
) {
  const { isOnline } = useOffline();
  const queryFn = createOfflineQueryFn(onlineFn, offlineFn, options?.cacheFn);

  return useQuery<T>({
    queryKey,
    queryFn: () => queryFn(isOnline),
    staleTime: isOnline ? (options?.staleTime ?? 3 * 60 * 1000) : Infinity,
    enabled: options?.enabled,
    placeholderData: options?.placeholderData,
  });
}

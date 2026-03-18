import { QueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { isAuthError } from './errorHandler';

/**
 * Retry handler that refreshes the JWT before retrying on auth errors (PGRST303).
 * For other errors, retries once with default backoff.
 */
const retryWithAuthRefresh = (failureCount: number, error: Error) => {
  if (isAuthError(error)) {
    if (failureCount < 1) {
      // Fire off a session refresh — by the time retryDelay elapses, the new token is ready
      supabase.auth.refreshSession();
      return true;
    }
    return false; // Don't keep retrying auth failures
  }
  return failureCount < 1;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: retryWithAuthRefresh,
      retryDelay: (attemptIndex, error) => {
        // Give auth refresh more time to complete before retrying
        if (isAuthError(error)) return 1500;
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
      refetchOnWindowFocus: false, // Disabled to prevent unnecessary refetches
      refetchOnMount: 'stale', // Only refetch if data is stale
      refetchOnReconnect: true, // Refetch when coming back online
    },
    mutations: {
      retry: retryWithAuthRefresh,
      retryDelay: (attemptIndex, error) => {
        if (isAuthError(error)) return 1500;
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
    },
  },
});

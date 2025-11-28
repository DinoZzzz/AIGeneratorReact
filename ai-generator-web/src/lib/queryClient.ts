import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false, // Disabled to prevent unnecessary refetches
      refetchOnMount: 'always', // Only refetch if data is stale
      refetchOnReconnect: true, // Refetch when coming back online
    },
    mutations: {
      retry: 1,
    },
  },
});

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { constructionService } from '../services/constructionService';
import type { Construction } from '../types';

// Query keys
export const constructionKeys = {
  all: ['constructions'] as const,
  lists: () => [...constructionKeys.all, 'list'] as const,
  byCustomer: (customerId: string) => [...constructionKeys.lists(), 'customer', customerId] as const,
  details: () => [...constructionKeys.all, 'detail'] as const,
  detail: (id: string) => [...constructionKeys.details(), id] as const,
};

// Query hooks
export const useConstructionsByCustomer = (customerId: string) => {
  return useQuery({
    queryKey: constructionKeys.byCustomer(customerId),
    queryFn: () => constructionService.getByCustomerId(customerId),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useConstruction = (id: string) => {
  return useQuery({
    queryKey: constructionKeys.detail(id),
    queryFn: () => constructionService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Mutation hooks
export const useCreateConstruction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (construction: Partial<Construction>) => constructionService.create(construction),
    onSuccess: (_, variables) => {
      if (variables.customer_id) {
        queryClient.invalidateQueries({
          queryKey: constructionKeys.byCustomer(variables.customer_id)
        });
      }
      queryClient.invalidateQueries({ queryKey: constructionKeys.lists() });
    },
  });
};

export const useUpdateConstruction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, construction }: { id: string; construction: Partial<Construction> }) =>
      constructionService.update(id, construction),
    onMutate: async ({ id, construction }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: constructionKeys.detail(id) });

      // Snapshot previous value
      const previousConstruction = queryClient.getQueryData(constructionKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(constructionKeys.detail(id), (old: any) => ({
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
    },
  });
};

export const useDeleteConstruction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => constructionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: constructionKeys.lists() });
    },
  });
};

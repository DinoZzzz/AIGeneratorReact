import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import type { Customer } from '../types';

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (page: number, pageSize: number, sortBy: string, sortOrder: 'asc' | 'desc', search: string) =>
    [...customerKeys.lists(), { page, pageSize, sortBy, sortOrder, search }] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

// Query hooks
export const useCustomers = (
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  search: string = ''
) => {
  return useQuery({
    queryKey: customerKeys.list(page, pageSize, sortBy, sortOrder, search),
    queryFn: () => customerService.getCustomers(page, pageSize, sortBy, sortOrder, search),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAllCustomers = () => {
  return useQuery({
    queryKey: customerKeys.all,
    queryFn: () => customerService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerService.getById(id),
    enabled: !!id,
  });
};

// Mutation hooks
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customer: Partial<Customer>) => customerService.create(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, customer }: { id: string; customer: Partial<Customer> }) =>
      customerService.update(id, customer),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
};

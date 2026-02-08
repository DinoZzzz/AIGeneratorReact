import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import type { Customer } from '../types';
import { useOffline } from '../context/OfflineContext';
import { isNetworkError } from '../lib/errorHandler';
import {
  getAllFromStore,
  getFromStore,
  saveToStore,
  saveManyToStore,
  deleteFromStore,
  addToSyncQueue,
  STORES,
} from '../lib/offlineDb';
import { useOnlineQuery } from '../lib/offlineQueryFn';

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (page: number, pageSize: number, sortBy: string, sortOrder: 'asc' | 'desc', search: string, year?: string | null) =>
    [...customerKeys.lists(), { page, pageSize, sortBy, sortOrder, search, year }] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

// Helper function to get customers from offline storage with filtering/sorting
async function getOfflineCustomers(
  page: number,
  pageSize: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  search: string,
  year?: string | null
): Promise<{ data: Customer[]; count: number }> {
  let customers = await getAllFromStore<Customer>(STORES.CUSTOMERS);

  if (search) {
    const searchLower = search.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(searchLower) ||
        c.location?.toLowerCase().includes(searchLower) ||
        c.work_order?.toLowerCase().includes(searchLower) ||
        c.address?.toLowerCase().includes(searchLower)
    );
  }

  if (year) {
    const yearNum = parseInt(year, 10);
    customers = customers.filter((c) => new Date(c.created_at).getFullYear() === yearNum);
  }

  customers.sort((a, b) => {
    const aVal = (a[sortBy as keyof Customer] as string) || '';
    const bVal = (b[sortBy as keyof Customer] as string) || '';
    const comparison = aVal.localeCompare(bVal);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const total = customers.length;
  const start = (page - 1) * pageSize;
  return { data: customers.slice(start, start + pageSize), count: total };
}

// Query hooks with offline support
export const useCustomers = (
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  search: string = '',
  year?: string | null
) =>
  useOnlineQuery<{ data: Customer[]; count: number }>(
    customerKeys.list(page, pageSize, sortBy, sortOrder, search, year),
    () => customerService.getCustomers(page, pageSize, sortBy, sortOrder, search, year),
    () => getOfflineCustomers(page, pageSize, sortBy, sortOrder, search, year),
    {
      cacheFn: (result) => saveManyToStore(STORES.CUSTOMERS, result.data),
      staleTime: 5 * 60 * 1000,
    },
  );

export const useAllCustomers = () =>
  useOnlineQuery<Customer[]>(
    customerKeys.all,
    () => customerService.getAll(),
    () => getAllFromStore<Customer>(STORES.CUSTOMERS),
    {
      cacheFn: (data) => saveManyToStore(STORES.CUSTOMERS, data),
      staleTime: 5 * 60 * 1000,
    },
  );

export const useCustomer = (id: string) =>
  useOnlineQuery<Customer>(
    customerKeys.detail(id),
    () => customerService.getById(id),
    async () => {
      const offlineData = await getFromStore<Customer>(STORES.CUSTOMERS, id);
      if (!offlineData) throw new Error('Customer not found offline');
      return offlineData;
    },
    {
      cacheFn: (data) => saveToStore(STORES.CUSTOMERS, data),
      enabled: !!id,
    },
  );

// Mutation hooks with offline support
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      if (isOnline) {
        try {
          const result = await customerService.create(customer);
          await saveToStore(STORES.CUSTOMERS, result);
          return result;
        } catch (error) {
          if (isNetworkError(error)) {
            return createCustomerOffline(customer);
          }
          throw error;
        }
      } else {
        return createCustomerOffline(customer);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

async function createCustomerOffline(customer: Partial<Customer>): Promise<Customer> {
  const tempId = `temp_${crypto.randomUUID()}`;
  const offlineCustomer: Customer = {
    ...customer,
    id: tempId,
    created_at: new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  (offlineCustomer as Customer & { _is_offline: boolean })._is_offline = true;
  await saveToStore(STORES.CUSTOMERS, offlineCustomer);
  await addToSyncQueue(STORES.CUSTOMERS, 'create', customer, tempId);

  return offlineCustomer;
}

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async ({ id, customer }: { id: string; customer: Partial<Customer> }) => {
      if (isOnline) {
        try {
          const result = await customerService.update(id, customer);
          await saveToStore(STORES.CUSTOMERS, result);
          return result;
        } catch (error) {
          if (isNetworkError(error)) {
            return updateCustomerOffline(id, customer);
          }
          throw error;
        }
      } else {
        return updateCustomerOffline(id, customer);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

async function updateCustomerOffline(id: string, customer: Partial<Customer>): Promise<Customer> {
  const existing = await getFromStore<Customer>(STORES.CUSTOMERS, id);
  const updated: Customer = {
    ...existing,
    ...customer,
    id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  (updated as Customer & { _is_offline: boolean })._is_offline = true;
  await saveToStore(STORES.CUSTOMERS, updated);
  await addToSyncQueue(STORES.CUSTOMERS, 'update', customer, id);

  return updated;
}

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          await customerService.delete(id);
          await deleteFromStore(STORES.CUSTOMERS, id);
        } catch (error) {
          if (isNetworkError(error)) {
            return deleteCustomerOffline(id);
          }
          throw error;
        }
      } else {
        return deleteCustomerOffline(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

async function deleteCustomerOffline(id: string): Promise<void> {
  await deleteFromStore(STORES.CUSTOMERS, id);
  if (!id.startsWith('temp_')) {
    await addToSyncQueue(STORES.CUSTOMERS, 'delete', null, id);
  }
}

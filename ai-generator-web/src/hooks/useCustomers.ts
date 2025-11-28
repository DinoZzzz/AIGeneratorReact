import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import type { Customer } from '../types';
import { useOffline } from '../context/OfflineContext';
import {
  getAllFromStore,
  getFromStore,
  saveToStore,
  saveManyToStore,
  deleteFromStore,
  addToSyncQueue,
  STORES,
} from '../lib/offlineDb';

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (page: number, pageSize: number, sortBy: string, sortOrder: 'asc' | 'desc', search: string, year?: string | null) =>
    [...customerKeys.lists(), { page, pageSize, sortBy, sortOrder, search, year }] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

// Query hooks with offline support
export const useCustomers = (
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  search: string = '',
  year?: string | null
) => {
  const { isOnline } = useOffline();

  return useQuery({
    queryKey: customerKeys.list(page, pageSize, sortBy, sortOrder, search, year),
    queryFn: async () => {
      if (isOnline) {
        try {
          const result = await customerService.getCustomers(page, pageSize, sortBy, sortOrder, search, year);
          // Cache customers locally for offline use
          if (result.data) {
            await saveManyToStore(STORES.CUSTOMERS, result.data);
          }
          return result;
        } catch (error) {
          // Fall back to offline data on network error
          console.warn('Online query failed, using offline data:', error);
          return getOfflineCustomers(page, pageSize, sortBy, sortOrder, search, year);
        }
      } else {
        return getOfflineCustomers(page, pageSize, sortBy, sortOrder, search, year);
      }
    },
    staleTime: isOnline ? 5 * 60 * 1000 : Infinity,
  });
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

  // Apply search filter
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

  // Apply year filter
  if (year) {
    const yearNum = parseInt(year, 10);
    customers = customers.filter((c) => {
      const createdYear = new Date(c.created_at).getFullYear();
      return createdYear === yearNum;
    });
  }

  // Apply sorting
  customers.sort((a, b) => {
    const aVal = (a[sortBy as keyof Customer] as string) || '';
    const bVal = (b[sortBy as keyof Customer] as string) || '';
    const comparison = aVal.localeCompare(bVal);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const total = customers.length;
  const start = (page - 1) * pageSize;
  const paginatedData = customers.slice(start, start + pageSize);

  return { data: paginatedData, count: total };
}

export const useAllCustomers = () => {
  const { isOnline } = useOffline();

  return useQuery({
    queryKey: customerKeys.all,
    queryFn: async () => {
      if (isOnline) {
        try {
          const data = await customerService.getAll();
          // Cache for offline use
          if (data) {
            await saveManyToStore(STORES.CUSTOMERS, data);
          }
          return data;
        } catch (error) {
          console.warn('Online query failed, using offline data:', error);
          return getAllFromStore<Customer>(STORES.CUSTOMERS);
        }
      } else {
        return getAllFromStore<Customer>(STORES.CUSTOMERS);
      }
    },
    staleTime: isOnline ? 5 * 60 * 1000 : Infinity,
  });
};

export const useCustomer = (id: string) => {
  const { isOnline } = useOffline();

  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      if (isOnline) {
        try {
          const data = await customerService.getById(id);
          // Cache for offline use
          if (data) {
            await saveToStore(STORES.CUSTOMERS, data);
          }
          return data;
        } catch (error) {
          console.warn('Online query failed, using offline data:', error);
          const offlineData = await getFromStore<Customer>(STORES.CUSTOMERS, id);
          if (!offlineData) throw new Error('Customer not found offline');
          return offlineData;
        }
      } else {
        const offlineData = await getFromStore<Customer>(STORES.CUSTOMERS, id);
        if (!offlineData) throw new Error('Customer not found offline');
        return offlineData;
      }
    },
    enabled: !!id,
  });
};

// Mutation hooks with offline support
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      if (isOnline) {
        try {
          const result = await customerService.create(customer);
          // Cache the new customer
          await saveToStore(STORES.CUSTOMERS, result);
          return result;
        } catch (error) {
          // Fall back to offline mode on network error
          if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
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
      // Trigger sync when back online
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

  // Mark as offline-created
  (offlineCustomer as Customer & { _is_offline: boolean })._is_offline = true;

  // Save to local store
  await saveToStore(STORES.CUSTOMERS, offlineCustomer);

  // Add to sync queue
  await addToSyncQueue(STORES.CUSTOMERS, 'create', customer);

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
          // Update cache
          await saveToStore(STORES.CUSTOMERS, result);
          return result;
        } catch (error) {
          if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
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
  // Get existing customer
  const existing = await getFromStore<Customer>(STORES.CUSTOMERS, id);
  const updated: Customer = {
    ...existing,
    ...customer,
    id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  // Mark as having offline changes
  (updated as Customer & { _is_offline: boolean })._is_offline = true;

  // Save to local store
  await saveToStore(STORES.CUSTOMERS, updated);

  // Add to sync queue
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
          // Remove from local cache
          await deleteFromStore(STORES.CUSTOMERS, id);
        } catch (error) {
          if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
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
  // Remove from local store
  await deleteFromStore(STORES.CUSTOMERS, id);

  // Add to sync queue (only if not a temp/offline-created item)
  if (!id.startsWith('temp_')) {
    await addToSyncQueue(STORES.CUSTOMERS, 'delete', null, id);
  }
}

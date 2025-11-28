import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import type { ReportForm } from '../types';
import { useOffline } from '../context/OfflineContext';
import {
  getAllFromStore,
  getFromStore,
  saveToStore,
  saveManyToStore,
  deleteFromStore,
  addToSyncQueue,
  getByIndex,
  STORES,
} from '../lib/offlineDb';

// Query keys
export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: () => [...reportKeys.lists()] as const,
  byConstruction: (constructionId: string) => [...reportKeys.lists(), 'construction', constructionId] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
};

// Query hooks with offline support
export const useReports = () => {
  const { isOnline } = useOffline();

  return useQuery({
    queryKey: reportKeys.list(),
    queryFn: async () => {
      if (isOnline) {
        try {
          const data = await reportService.getAll();
          // Cache for offline use
          if (data) {
            await saveManyToStore(STORES.REPORTS, data);
          }
          return data;
        } catch (error) {
          console.warn('Online query failed, using offline data:', error);
          return getOfflineReports();
        }
      } else {
        return getOfflineReports();
      }
    },
    staleTime: isOnline ? 3 * 60 * 1000 : Infinity,
  });
};

async function getOfflineReports(): Promise<ReportForm[]> {
  const reports = await getAllFromStore<ReportForm>(STORES.REPORTS);
  // Sort by created_at descending
  return reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export const useReportsByConstruction = (constructionId: string) => {
  const { isOnline } = useOffline();

  return useQuery({
    queryKey: reportKeys.byConstruction(constructionId),
    queryFn: async () => {
      if (isOnline) {
        try {
          const data = await reportService.getByConstruction(constructionId);
          // Cache for offline use
          if (data) {
            await saveManyToStore(STORES.REPORTS, data);
          }
          return data;
        } catch (error) {
          console.warn('Online query failed, using offline data:', error);
          return getOfflineReportsByConstruction(constructionId);
        }
      } else {
        return getOfflineReportsByConstruction(constructionId);
      }
    },
    enabled: !!constructionId,
    staleTime: isOnline ? 3 * 60 * 1000 : Infinity,
  });
};

async function getOfflineReportsByConstruction(constructionId: string): Promise<ReportForm[]> {
  const reports = await getByIndex<ReportForm>(STORES.REPORTS, 'construction_id', constructionId);
  // Sort by ordinal ascending
  return reports.sort((a, b) => (a.ordinal || 0) - (b.ordinal || 0));
}

export const useReport = (id: string) => {
  const { isOnline } = useOffline();

  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: async () => {
      if (isOnline) {
        try {
          const data = await reportService.getById(id);
          // Cache for offline use
          if (data) {
            await saveToStore(STORES.REPORTS, data);
          }
          return data;
        } catch (error) {
          console.warn('Online query failed, using offline data:', error);
          const offlineData = await getFromStore<ReportForm>(STORES.REPORTS, id);
          if (!offlineData) throw new Error('Report not found offline');
          return offlineData;
        }
      } else {
        const offlineData = await getFromStore<ReportForm>(STORES.REPORTS, id);
        if (!offlineData) throw new Error('Report not found offline');
        return offlineData;
      }
    },
    enabled: !!id,
    staleTime: isOnline ? 5 * 60 * 1000 : Infinity,
  });
};

// Mutation hooks with offline support
export const useCreateReport = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async (report: Partial<ReportForm>) => {
      if (isOnline) {
        try {
          const result = await reportService.create(report);
          // Cache the new report
          await saveToStore(STORES.REPORTS, result);
          return result;
        } catch (error) {
          if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
            return createReportOffline(report);
          }
          throw error;
        }
      } else {
        return createReportOffline(report);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      if (variables.construction_id) {
        queryClient.invalidateQueries({
          queryKey: reportKeys.byConstruction(variables.construction_id)
        });
      }
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

async function createReportOffline(report: Partial<ReportForm>): Promise<ReportForm> {
  const tempId = `temp_${crypto.randomUUID()}`;
  const offlineReport: ReportForm = {
    ...report,
    id: tempId,
    ordinal: report.ordinal ?? 0,
    satisfies: report.satisfies ?? false,
    temperature: report.temperature ?? 0,
    pipe_length: report.pipe_length ?? 0,
    pipe_diameter: report.pipe_diameter ?? 0,
    pipeline_slope: report.pipeline_slope ?? 0,
    pane_width: report.pane_width ?? 0,
    pane_height: report.pane_height ?? 0,
    pane_length: report.pane_length ?? 0,
    pane_diameter: report.pane_diameter ?? 0,
    saturation_of_test_section: report.saturation_of_test_section ?? 0,
    water_height: report.water_height ?? 0,
    water_height_start: report.water_height_start ?? 0,
    water_height_end: report.water_height_end ?? 0,
    pressure_start: report.pressure_start ?? 0,
    pressure_end: report.pressure_end ?? 0,
    ro_height: report.ro_height ?? 0,
    depositional_height: report.depositional_height ?? 0,
    examination_date: report.examination_date ?? new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as ReportForm;

  // Mark as offline-created
  (offlineReport as ReportForm & { _is_offline: boolean })._is_offline = true;

  // Save to local store
  await saveToStore(STORES.REPORTS, offlineReport);

  // Add to sync queue
  await addToSyncQueue(STORES.REPORTS, 'create', report);

  return offlineReport;
}

export const useUpdateReport = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async ({ id, report }: { id: string; report: Partial<ReportForm> }) => {
      if (isOnline) {
        try {
          const result = await reportService.update(id, report);
          // Update cache
          await saveToStore(STORES.REPORTS, result);
          return result;
        } catch (error) {
          if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
            return updateReportOffline(id, report);
          }
          throw error;
        }
      } else {
        return updateReportOffline(id, report);
      }
    },
    onMutate: async ({ id, report }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: reportKeys.detail(id) });

      // Snapshot the previous value
      const previousReport = queryClient.getQueryData(reportKeys.detail(id));

      // Optimistically update to the new value
      queryClient.setQueryData(reportKeys.detail(id), (old: ReportForm | undefined) => ({
        ...old,
        ...report,
      }));

      return { previousReport };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousReport) {
        queryClient.setQueryData(reportKeys.detail(id), context.previousReport);
      }
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
      if (data.construction_id) {
        queryClient.invalidateQueries({
          queryKey: reportKeys.byConstruction(data.construction_id)
        });
      }
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

async function updateReportOffline(id: string, report: Partial<ReportForm>): Promise<ReportForm> {
  // Get existing report
  const existing = await getFromStore<ReportForm>(STORES.REPORTS, id);
  const updated: ReportForm = {
    ...existing,
    ...report,
    id,
    updated_at: new Date().toISOString(),
  } as ReportForm;

  // Mark as having offline changes
  (updated as ReportForm & { _is_offline: boolean })._is_offline = true;

  // Save to local store
  await saveToStore(STORES.REPORTS, updated);

  // Add to sync queue
  await addToSyncQueue(STORES.REPORTS, 'update', report, id);

  return updated;
}

export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          await reportService.delete(id);
          // Remove from local cache
          await deleteFromStore(STORES.REPORTS, id);
        } catch (error) {
          if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
            return deleteReportOffline(id);
          }
          throw error;
        }
      } else {
        return deleteReportOffline(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

async function deleteReportOffline(id: string): Promise<void> {
  // Remove from local store
  await deleteFromStore(STORES.REPORTS, id);

  // Add to sync queue (only if not a temp/offline-created item)
  if (!id.startsWith('temp_')) {
    await addToSyncQueue(STORES.REPORTS, 'delete', null, id);
  }
}

export const useUpdateReportOrder = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async (reports: ReportForm[]) => {
      if (isOnline) {
        try {
          await reportService.updateOrder(reports);
          // Update local cache with new order
          for (const report of reports) {
            await saveToStore(STORES.REPORTS, report);
          }
        } catch (error) {
          if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
            return updateReportOrderOffline(reports);
          }
          throw error;
        }
      } else {
        return updateReportOrderOffline(reports);
      }
    },
    onSuccess: (_, reports) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      // Invalidate specific construction query if available
      if (reports.length > 0 && reports[0].construction_id) {
        queryClient.invalidateQueries({
          queryKey: reportKeys.byConstruction(reports[0].construction_id)
        });
      }
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

async function updateReportOrderOffline(reports: ReportForm[]): Promise<void> {
  // Update local store with new ordinals
  for (let i = 0; i < reports.length; i++) {
    const report = reports[i];
    const existing = await getFromStore<ReportForm>(STORES.REPORTS, report.id);
    if (existing) {
      const updated = { ...existing, ordinal: i };
      (updated as ReportForm & { _is_offline: boolean })._is_offline = true;
      await saveToStore(STORES.REPORTS, updated);
      // Add each update to sync queue
      await addToSyncQueue(STORES.REPORTS, 'update', { ordinal: i }, report.id);
    }
  }
}

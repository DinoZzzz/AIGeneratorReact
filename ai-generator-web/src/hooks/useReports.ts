import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import type { ReportForm } from '../types';

// Query keys
export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: () => [...reportKeys.lists()] as const,
  byConstruction: (constructionId: string) => [...reportKeys.lists(), 'construction', constructionId] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
};

// Query hooks
export const useReports = () => {
  return useQuery({
    queryKey: reportKeys.list(),
    queryFn: () => reportService.getAll(),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

export const useReportsByConstruction = (constructionId: string) => {
  return useQuery({
    queryKey: reportKeys.byConstruction(constructionId),
    queryFn: () => reportService.getByConstruction(constructionId),
    enabled: !!constructionId,
    staleTime: 3 * 60 * 1000,
  });
};

export const useReport = (id: string) => {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => reportService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Mutation hooks
export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (report: Partial<ReportForm>) => reportService.create(report),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      if (variables.construction_id) {
        queryClient.invalidateQueries({
          queryKey: reportKeys.byConstruction(variables.construction_id)
        });
      }
    },
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, report }: { id: string; report: Partial<ReportForm> }) =>
      reportService.update(id, report),
    onMutate: async ({ id, report }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: reportKeys.detail(id) });

      // Snapshot the previous value
      const previousReport = queryClient.getQueryData(reportKeys.detail(id));

      // Optimistically update to the new value
      queryClient.setQueryData(reportKeys.detail(id), (old: any) => ({
        ...old,
        ...report,
      }));

      return { previousReport };
    },
    onError: (err, { id }, context) => {
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
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reportService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
};

export const useUpdateReportOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reports: ReportForm[]) => reportService.updateOrder(reports),
    onSuccess: (_, reports) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      // Invalidate specific construction query if available
      if (reports.length > 0 && reports[0].construction_id) {
        queryClient.invalidateQueries({
          queryKey: reportKeys.byConstruction(reports[0].construction_id)
        });
      }
    },
  });
};

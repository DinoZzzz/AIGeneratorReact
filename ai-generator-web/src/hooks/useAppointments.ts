import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../services/appointmentService';
import type { Appointment, AppointmentPayload } from '../types';
import { useOffline } from '../context/OfflineContext';
import { isNetworkError } from '../lib/errorHandler';
import {
  STORES,
  addToSyncQueue,
  deleteFromStore,
  getAllFromStore,
  getFromStore,
  removeSyncOperationsForEntity,
  saveManyToStore,
  saveToStore,
} from '../lib/offlineDb';
import { useOnlineQuery } from '../lib/offlineQueryFn';

export const appointmentKeys = {
  all: ['appointments'] as const,
  ranges: () => [...appointmentKeys.all, 'range'] as const,
  range: (startIso: string, endIso: string) => [...appointmentKeys.ranges(), startIso, endIso] as const,
};

const normalizeAppointmentPayload = (appointment: AppointmentPayload): Record<string, unknown> => {
  const assigneeIds = appointment.assignee_ids;
  const rest = { ...appointment } as Record<string, unknown>;
  delete rest.assignee_ids;
  delete rest.assignees;
  delete rest.id;
  delete rest.created_at;
  delete rest.updated_at;

  return {
    ...rest,
    examiner_ids: assigneeIds ?? appointment.examiner_ids ?? [],
  };
};

const toTimestamp = (value?: string): number => {
  if (!value) return Number.NaN;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const isRangeOverlapping = (
  item: Pick<Appointment, 'start' | 'end'>,
  rangeStart: Date,
  rangeEnd: Date
): boolean => {
  const itemStart = toTimestamp(item.start);
  const itemEnd = toTimestamp(item.end);
  if (Number.isNaN(itemStart) || Number.isNaN(itemEnd)) {
    return false;
  }

  const start = rangeStart.getTime();
  const end = rangeEnd.getTime();
  return itemStart <= end && itemEnd >= start;
};

const getOfflineAppointmentsInRange = async (start: Date, end: Date): Promise<Appointment[]> => {
  const appointments = await getAllFromStore<Appointment>(STORES.APPOINTMENTS);
  return appointments
    .filter((appointment) => isRangeOverlapping(appointment, start, end))
    .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
};

export const useAppointmentsInRange = (start: Date, end: Date) => {
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  return useOnlineQuery<Appointment[]>(
    appointmentKeys.range(startIso, endIso),
    () => appointmentService.getAll(start, end),
    () => getOfflineAppointmentsInRange(start, end),
    {
      cacheFn: (data) => saveManyToStore(STORES.APPOINTMENTS, data),
      staleTime: 2 * 60 * 1000,
    }
  );
};

const createAppointmentOffline = async (appointment: AppointmentPayload): Promise<Appointment> => {
  const tempId = `temp_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const normalizedPayload = normalizeAppointmentPayload(appointment);

  const offlineAppointment: Appointment = {
    id: tempId,
    title: String(normalizedPayload.title ?? ''),
    description: normalizedPayload.description as string | undefined,
    start: String(normalizedPayload.start ?? now),
    end: String(normalizedPayload.end ?? now),
    customer_id: normalizedPayload.customer_id as string | undefined,
    construction_id: normalizedPayload.construction_id as string | undefined,
    examiner_ids: (normalizedPayload.examiner_ids as string[]) || [],
    location: normalizedPayload.location as string | undefined,
    reminder_enabled: Boolean(normalizedPayload.reminder_enabled),
    reminder_times: (normalizedPayload.reminder_times as { minutes_before: number; type: string }[]) || [],
    created_by: String(normalizedPayload.created_by ?? 'offline'),
    created_at: now,
    updated_at: now,
  };

  (offlineAppointment as Appointment & { _is_offline: boolean })._is_offline = true;
  await saveToStore(STORES.APPOINTMENTS, offlineAppointment);
  await addToSyncQueue(STORES.APPOINTMENTS, 'create', normalizedPayload, tempId);

  return offlineAppointment;
};

const updateAppointmentOffline = async (id: string, appointment: AppointmentPayload): Promise<Appointment> => {
  const existing = await getFromStore<Appointment>(STORES.APPOINTMENTS, id);
  const normalizedPayload = normalizeAppointmentPayload(appointment);
  const now = new Date().toISOString();

  const updated: Appointment = {
    ...(existing || { id, created_at: now }),
    ...normalizedPayload,
    id,
    updated_at: now,
  } as Appointment;

  (updated as Appointment & { _is_offline: boolean })._is_offline = true;
  await saveToStore(STORES.APPOINTMENTS, updated);
  await addToSyncQueue(STORES.APPOINTMENTS, 'update', normalizedPayload, id);

  return updated;
};

const deleteAppointmentOffline = async (id: string): Promise<void> => {
  await deleteFromStore(STORES.APPOINTMENTS, id);

  if (id.startsWith('temp_')) {
    await removeSyncOperationsForEntity(STORES.APPOINTMENTS, id);
    return;
  }

  await addToSyncQueue(STORES.APPOINTMENTS, 'delete', null, id);
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async (appointment: AppointmentPayload) => {
      if (isOnline) {
        try {
          const result = await appointmentService.create(appointment);
          await saveToStore(STORES.APPOINTMENTS, result);
          return result;
        } catch (error) {
          if (isNetworkError(error)) {
            return createAppointmentOffline(appointment);
          }
          throw error;
        }
      }
      return createAppointmentOffline(appointment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async ({ id, appointment }: { id: string; appointment: AppointmentPayload }) => {
      if (isOnline) {
        try {
          const result = await appointmentService.update(id, appointment);
          await saveToStore(STORES.APPOINTMENTS, result);
          return result;
        } catch (error) {
          if (isNetworkError(error)) {
            return updateAppointmentOffline(id, appointment);
          }
          throw error;
        }
      }
      return updateAppointmentOffline(id, appointment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();
  const { isOnline, triggerSync } = useOffline();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        try {
          await appointmentService.delete(id);
          await deleteFromStore(STORES.APPOINTMENTS, id);
          return;
        } catch (error) {
          if (isNetworkError(error)) {
            return deleteAppointmentOffline(id);
          }
          throw error;
        }
      }
      return deleteAppointmentOffline(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      if (isOnline) {
        triggerSync();
      }
    },
  });
};

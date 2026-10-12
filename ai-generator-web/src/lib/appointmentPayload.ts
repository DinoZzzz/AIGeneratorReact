import type { AppointmentPayload } from '../types';

/** Only calendar_events columns may reach PostgREST or the offline queue. */
export const normalizeAppointmentPayload = (appointment: AppointmentPayload): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    const columns = ['title', 'description', 'start', 'end', 'location', 'created_by', 'reminder_enabled', 'reminder_times'] as const;
    for (const column of columns) {
        if (appointment[column] !== undefined) result[column] = appointment[column];
    }
    for (const column of ['customer_id', 'construction_id'] as const) {
        if (appointment[column] !== undefined) result[column] = appointment[column] || null;
    }
    const examinerIds = appointment.assignee_ids ?? appointment.examiner_ids;
    if (examinerIds !== undefined) result.examiner_ids = examinerIds;
    return result;
};

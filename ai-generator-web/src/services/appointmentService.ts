import { supabase } from '../lib/supabase';
import { captureError } from '../lib/sentry';
import type { Appointment, AppointmentPayload } from '../types';
import { AppError } from '../lib/errorHandler';
import { normalizeAppointmentPayload } from '../lib/appointmentPayload';

interface ExaminerProfile {
    id: string;
    name: string;
    last_name: string;
    avatar_url: string;
    title: string;
}

export const appointmentService = {
    async getAll(start: Date, end: Date) {
        const { data, error } = await supabase
            .from('calendar_events')
            .select(`
                *,
                customer:customers(id, name, location, work_order),
                construction:constructions(id, name, location, work_order)
            `)
            .lte('start', end.toISOString())
            .gte('end', start.toISOString());

        if (error) {
            captureError(error, { service: 'appointmentService', method: 'getAll' });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }

        // Collect all unique examiner IDs from all events (batch query instead of N+1)
        const allExaminerIds = [...new Set(
            (data || []).flatMap((event) => (event as Record<string, unknown>).examiner_ids as string[] || [])
        )];

        // Single query to fetch all examiner profiles
        let profileMap = new Map<string, ExaminerProfile>();
        if (allExaminerIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, last_name, avatar_url, title')
                .in('id', allExaminerIds);

            profileMap = new Map((profiles || []).map(p => [p.id, p]));
        }

        // Map examiner profiles to each event
        const eventsWithAssignees = (data || []).map((event) => ({
            ...event,
            assignees: (((event as Record<string, unknown>).examiner_ids as string[]) || [])
                .map((id: string) => profileMap.get(id))
                .filter(Boolean)
        }));

        return eventsWithAssignees as Appointment[];
    },

    async create(appointment: AppointmentPayload) {
        const { data: newAppt, error } = await supabase
            .from('calendar_events')
            .insert({
                ...normalizeAppointmentPayload(appointment),
                examiner_ids: appointment.assignee_ids ?? appointment.examiner_ids ?? []
            })
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'appointmentService', method: 'create' });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }

        return newAppt as Appointment;
    },

    async update(id: string, appointment: AppointmentPayload) {
        const { data, error } = await supabase
            .from('calendar_events')
            .update(normalizeAppointmentPayload(appointment))
            .eq('id', id)
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'appointmentService', method: 'update', id });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }

        return data as Appointment;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', id);

        if (error) {
            captureError(error, { service: 'appointmentService', method: 'delete', id });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
    }
};

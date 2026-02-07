import { supabase } from '../lib/supabase';
import { captureError } from '../lib/sentry';
import type { Appointment } from '../types';
import { AppError } from '../lib/errorHandler';

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
            .gte('start', start.toISOString())
            .lte('end', end.toISOString());

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

    async create(appointment: Partial<Appointment> & { assignee_ids?: string[] }) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { assignee_ids, assignees: _assignees, ...apptData } = appointment;

        // Use assignee_ids if provided, otherwise empty array
        const examiner_ids = assignee_ids || [];

        const { data: newAppt, error } = await supabase
            .from('calendar_events')
            .insert({
                ...apptData,
                examiner_ids
            })
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'appointmentService', method: 'create' });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }

        return newAppt as Appointment;
    },

    async update(id: string, appointment: Partial<Appointment> & { assignee_ids?: string[] }) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { assignee_ids, assignees: _assignees, ...apptData } = appointment;

        // Prepare update data
        const updateData: Record<string, unknown> = { ...apptData };

        // Update examiner_ids if provided
        if (assignee_ids !== undefined) {
            updateData.examiner_ids = assignee_ids;
        }

        const { data, error } = await supabase
            .from('calendar_events')
            .update(updateData)
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

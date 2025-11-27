import { supabase } from '../lib/supabase';
import type { Appointment } from '../types';
import { AppError } from '../lib/errorHandler';

export const appointmentService = {
    async getAll(start: Date, end: Date) {
        const { data, error } = await supabase
            .from('calendar_events')
            .select(`
                *,
                customer:customers(*),
                construction:constructions(*)
            `)
            .gte('start', start.toISOString())
            .lte('end', end.toISOString());

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);

        // Fetch examiner profiles for each event
        const eventsWithAssignees = await Promise.all(
            (data || []).map(async (event: any) => {
                if (event.examiner_ids && event.examiner_ids.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', event.examiner_ids);

                    return {
                        ...event,
                        assignees: profiles || []
                    };
                }
                return { ...event, assignees: [] };
            })
        );

        return eventsWithAssignees as Appointment[];
    },

    async create(appointment: Partial<Appointment> & { assignee_ids?: string[] }) {
        const { assignee_ids, assignees, ...apptData } = appointment;

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

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);

        return newAppt as Appointment;
    },

    async update(id: string, appointment: Partial<Appointment> & { assignee_ids?: string[] }) {
        const { assignee_ids, assignees, ...apptData } = appointment;

        // Prepare update data
        const updateData: any = { ...apptData };

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

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);

        return data as Appointment;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', id);

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
    }
};

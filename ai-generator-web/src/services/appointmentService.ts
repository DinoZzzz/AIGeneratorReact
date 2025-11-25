import { supabase } from '../lib/supabase';
import type { Appointment } from '../types';
import { AppError } from '../lib/errorHandler';

export const appointmentService = {
    async getAll(start: Date, end: Date) {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                customer:customers(*),
                construction:constructions(*),
                assignees:appointment_assignees(
                    profile:profiles(*)
                )
            `)
            .gte('start_time', start.toISOString())
            .lte('end_time', end.toISOString());

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);

        // Transform data to match Appointment interface
        return data.map((apt: any) => ({
            ...apt,
            assignees: apt.assignees.map((a: any) => a.profile)
        })) as Appointment[];
    },

    async create(appointment: Partial<Appointment> & { assignee_ids: string[] }) {
        const { assignee_ids, ...apptData } = appointment;

        // 1. Create appointment
        const { data: newAppt, error } = await supabase
            .from('appointments')
            .insert(apptData)
            .select()
            .single();

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);

        // 2. Create assignees
        if (assignee_ids && assignee_ids.length > 0) {
            const assigneesData = assignee_ids.map(id => ({
                appointment_id: newAppt.id,
                examiner_id: id
            }));

            const { error: assignError } = await supabase
                .from('appointment_assignees')
                .insert(assigneesData);

            if (assignError) throw new AppError(assignError.message, 'SUPABASE_ERROR', 500);
        }

        return newAppt as Appointment;
    },

    async update(id: string, appointment: Partial<Appointment> & { assignee_ids?: string[] }) {
        const { assignee_ids, ...apptData } = appointment;

        // 1. Update appointment details
        const { data, error } = await supabase
            .from('appointments')
            .update(apptData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);

        // 2. Update assignees if provided
        if (assignee_ids) {
            // Delete existing
            const { error: deleteError } = await supabase
                .from('appointment_assignees')
                .delete()
                .eq('appointment_id', id);

            if (deleteError) throw new AppError(deleteError.message, 'SUPABASE_ERROR', 500);

            // Insert new
            if (assignee_ids.length > 0) {
                const assigneesData = assignee_ids.map(uid => ({
                    appointment_id: id,
                    examiner_id: uid
                }));

                const { error: insertError } = await supabase
                    .from('appointment_assignees')
                    .insert(assigneesData);

                if (insertError) throw new AppError(insertError.message, 'SUPABASE_ERROR', 500);
            }
        }

        return data as Appointment;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
    }
};

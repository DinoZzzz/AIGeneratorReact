import { supabase } from '../lib/supabase';
import type { ReportForm } from '../types';
import { AppError, NotFoundError } from '../lib/errorHandler';

export const reportService = {
    async getAll() {
        const { data, error } = await supabase
            .from('report_forms')
            .select(`
        *,
        construction:constructions(name, work_order),
        draft:report_drafts(name)
      `)
            .order('created_at', { ascending: false });

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data as ReportForm[];
    },

    async getByConstruction(constructionId: string) {
        const { data, error } = await supabase
            .from('report_forms')
            .select(`
        *,
        construction:constructions(name, work_order),
        draft:report_drafts(name)
      `)
            .eq('construction_id', constructionId)
            .order('ordinal', { ascending: true });

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data as ReportForm[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('report_forms')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundError('Report');
            }
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data as ReportForm;
    },

    async create(report: Partial<ReportForm>) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        // Add user_id to the report
        const reportWithUser = {
            ...report,
            user_id: user?.id || null
        };

        const { data, error } = await supabase
            .from('report_forms')
            .insert(reportWithUser)
            .select()
            .single();

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data as ReportForm;
    },

    async update(id: string, report: Partial<ReportForm>) {
        const { data, error } = await supabase
            .from('report_forms')
            .update(report)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data as ReportForm;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('report_forms')
            .delete()
            .eq('id', id);

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
    },

    async updateOrder(reports: ReportForm[]) {
        // Ideally we would use a stored procedure or a single upsert,
        // but for now we'll just loop through and update the ordinal.
        // This is not atomic but sufficient for this scale.
        try {
            const updates = reports.map((report, index) =>
                supabase
                    .from('report_forms')
                    .update({ ordinal: index })
                    .eq('id', report.id)
            );

            await Promise.all(updates);
        } catch (error: any) {
            throw new AppError(error.message || 'Failed to update report order', 'SUPABASE_ERROR', 500);
        }
    }
};

import { supabase } from '../lib/supabase';
import { captureError } from '../lib/sentry';
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

        if (error) {
            captureError(error, { service: 'reportService', method: 'getAll' });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data as ReportForm[];
    },

    async getPaginated(page: number = 1, pageSize: number = 15) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('report_forms')
            .select(`
        *,
        construction:constructions(name, work_order),
        draft:report_drafts(name)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            captureError(error, { service: 'reportService', method: 'getPaginated', page, pageSize });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return { data: data as ReportForm[], count: count || 0 };
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

        if (error) {
            captureError(error, { service: 'reportService', method: 'getByConstruction', constructionId });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
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
                captureError(error, { service: 'reportService', method: 'getById', id, errorType: 'NotFound' });
                throw new NotFoundError('Report');
            }
            captureError(error, { service: 'reportService', method: 'getById', id });
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

        if (error) {
            captureError(error, { service: 'reportService', method: 'create' });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data as ReportForm;
    },

    async update(id: string, report: Partial<ReportForm>) {
        const { data, error } = await supabase
            .from('report_forms')
            .update(report)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'reportService', method: 'update', id });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data as ReportForm;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('report_forms')
            .delete()
            .eq('id', id);

        if (error) {
            captureError(error, { service: 'reportService', method: 'delete', id });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
    },

    async updateOrder(reports: ReportForm[]) {
        // Use a single upsert call instead of N individual updates
        // This reduces N API calls to just 1
        try {
            const updates = reports.map((report, index) => ({
                id: report.id,
                ordinal: index
            }));

            const { error } = await supabase
                .from('report_forms')
                .upsert(updates, { onConflict: 'id', ignoreDuplicates: false });

            if (error) throw error;
        } catch (error) {
            captureError(error instanceof Error ? error : new Error('Failed to update report order'), { service: 'reportService', method: 'updateOrder' });
            throw new AppError(error instanceof Error ? error.message : 'Failed to update report order', 'SUPABASE_ERROR', 500);
        }
    },

    async getLastByConstructionAndType(constructionId: string, typeId: number) {
        const { data, error } = await supabase
            .from('report_forms')
            .select('*')
            .eq('construction_id', constructionId)
            .eq('type_id', typeId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            captureError(error, { service: 'reportService', method: 'getLastByConstructionAndType', constructionId, typeId });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data as ReportForm | null;
    }
};

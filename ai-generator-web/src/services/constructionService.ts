import { supabase } from '../lib/supabase';
import { captureError } from '../lib/sentry';
import type { Construction } from '../types';
import { AppError, NotFoundError } from '../lib/errorHandler';

export const constructionService = {
    async getByCustomerId(customerId: string, includeArchived: boolean = false) {
        let query = supabase
            .from('constructions')
            .select('id, name, work_order, location, customer_id, is_active, is_archived, created_at, updated_at')
            .eq('customer_id', customerId);

        if (!includeArchived) {
            query = query.eq('is_archived', false);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            captureError(error, { service: 'constructionService', method: 'getByCustomerId', customerId });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data as Construction[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('constructions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            captureError(error, { service: 'constructionService', method: 'getById', id });
            if (error.code === 'PGRST116') {
                throw new NotFoundError('Construction');
            }
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data as Construction;
    },

    async create(construction: Partial<Construction>) {
        const { data, error } = await supabase
            .from('constructions')
            .insert([construction])
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'constructionService', method: 'create' });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data as Construction;
    },

    async update(id: string, construction: Partial<Construction>) {
        const { data, error } = await supabase
            .from('constructions')
            .update(construction)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'constructionService', method: 'update', id });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data as Construction;
    },

    async delete(id: string) {
        // Delete dependent records first to avoid FK violations.
        // NOTE: This is intentionally ordered by dependency depth.
        const { data: exportsData, error: exportsSelectError } = await supabase
            .from('report_exports')
            .select('id')
            .eq('construction_id', id);

        if (exportsSelectError) {
            captureError(exportsSelectError, { service: 'constructionService', method: 'delete', step: 'selectReportExports', id });
            throw new AppError(exportsSelectError.message, 'SUPABASE_ERROR', 500);
        }

        const exportIds = (exportsData || [])
            .map((row) => row.id)
            .filter((value): value is string => typeof value === 'string' && value.length > 0);

        if (exportIds.length > 0) {
            const { error: exportFormsError } = await supabase
                .from('report_export_forms')
                .delete()
                .in('export_id', exportIds);

            if (exportFormsError) {
                captureError(exportFormsError, { service: 'constructionService', method: 'delete', step: 'deleteReportExportForms', id, exportCount: exportIds.length });
                throw new AppError(exportFormsError.message, 'SUPABASE_ERROR', 500);
            }
        }

        const { error: exportsDeleteError } = await supabase
            .from('report_exports')
            .delete()
            .eq('construction_id', id);

        if (exportsDeleteError) {
            captureError(exportsDeleteError, { service: 'constructionService', method: 'delete', step: 'deleteReportExports', id });
            throw new AppError(exportsDeleteError.message, 'SUPABASE_ERROR', 500);
        }

        const { error: filesError } = await supabase
            .from('report_files')
            .delete()
            .eq('construction_id', id);

        if (filesError) {
            captureError(filesError, { service: 'constructionService', method: 'delete', step: 'deleteReportFiles', id });
            throw new AppError(filesError.message, 'SUPABASE_ERROR', 500);
        }

        const { error: reportFormsError } = await supabase
            .from('report_forms')
            .delete()
            .eq('construction_id', id);

        if (reportFormsError) {
            captureError(reportFormsError, { service: 'constructionService', method: 'delete', step: 'deleteReportForms', id });
            throw new AppError(reportFormsError.message, 'SUPABASE_ERROR', 500);
        }

        const { error: appointmentsError } = await supabase
            .from('appointments')
            .delete()
            .eq('construction_id', id);

        if (appointmentsError) {
            captureError(appointmentsError, { service: 'constructionService', method: 'delete', step: 'deleteAppointments', id });
            throw new AppError(appointmentsError.message, 'SUPABASE_ERROR', 500);
        }

        const { error: constructionDeleteError } = await supabase
            .from('constructions')
            .delete()
            .eq('id', id);

        if (constructionDeleteError) {
            captureError(constructionDeleteError, { service: 'constructionService', method: 'delete', step: 'deleteConstruction', id });
            throw new AppError(constructionDeleteError.message, 'SUPABASE_ERROR', 500);
        }
    },

    async checkWorkOrderExists(workOrder: string, customerId: string, excludeId?: string) {
        let query = supabase
            .from('constructions')
            .select('id')
            .eq('work_order', workOrder)
            .eq('customer_id', customerId);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query;
        if (error) {
            captureError(error, { service: 'constructionService', method: 'checkWorkOrderExists', workOrder, customerId });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data.length > 0;
    },

    async archive(id: string) {
        const { data, error } = await supabase
            .from('constructions')
            .update({ is_archived: true })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'constructionService', method: 'archive', id });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data as Construction;
    },

    async unarchive(id: string) {
        const { data, error } = await supabase
            .from('constructions')
            .update({ is_archived: false })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            captureError(error, { service: 'constructionService', method: 'unarchive', id });
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data as Construction;
    }
};

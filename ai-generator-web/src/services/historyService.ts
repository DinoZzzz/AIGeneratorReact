import { supabase } from '../lib/supabase';
import { captureError } from '../lib/sentry';
import type { ReportExport, ReportExportForm } from '../types';

interface ReportExportWithRelations {
    report_export_forms?: { count: number }[];
    [key: string]: unknown;
}

export const historyService = {
    async getAll(
        page: number = 0,
        pageSize: number = 50,
        search: string = '',
        sortBy: 'created_at' | 'construction_part' = 'created_at',
        sortOrder: 'asc' | 'desc' = 'desc',
        userId?: string
    ) {
        let query = supabase
            .from('report_exports')
            .select(`
                *,
                certifier:profiles!certifier_id(name, last_name, email),
                user:profiles!user_id(name, last_name, email),
                report_export_forms(count)
            `, { count: 'exact' });

        if (search) {
            query = query.ilike('construction_part', `%${search}%`);
        }

        if (userId) {
            query = query.eq('user_id', userId);
        }

        query = query.order(sortBy, { ascending: sortOrder === 'asc' })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        const { data, error, count } = await query;

        if (error) {
            captureError(error, { service: 'historyService', method: 'getAll', search, sortBy, sortOrder });
            throw error;
        }

        // Map the count from report_export_forms to a flat property
        const mappedData = (data as ReportExportWithRelations[]).map((item) => ({
            ...item,
            forms_count: item.report_export_forms?.[0]?.count ?? 0
        }));

        return {
            data: mappedData as ReportExport[],
            count
        };
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('report_exports')
            .select(`
                *,
                certifier:profiles!certifier_id(name, last_name, email),
                user:profiles!user_id(name, last_name, email)
            `)
            .eq('id', id)
            .single();

        if (error) {
            captureError(error, { service: 'historyService', method: 'getById', id });
            throw error;
        }
        return data as ReportExport;
    },

    async getExportForms(exportId: string) {
        const { data, error } = await supabase
            .from('report_export_forms')
            .select(`
                *,
                report_form:report_forms(*)
            `)
            .eq('export_id', exportId)
            .order('ordinal', { ascending: true });

        if (error) {
            captureError(error, { service: 'historyService', method: 'getExportForms', exportId });
            throw error;
        }
        return data as ReportExportForm[];
    },

    async delete(id: string) {
        // report_export_forms_export_id_fkey uses ON DELETE CASCADE. A single
        // parent delete preserves all links if the database rejects the delete.
        const { error } = await supabase
            .from('report_exports')
            .delete()
            .eq('id', id);

        if (error) {
            captureError(error, { service: 'historyService', method: 'delete', id });
            throw error;
        }
    }
};

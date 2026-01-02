import { supabase } from '../lib/supabase';
import type { ReportExport, ReportExportForm } from '../types';

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

        if (error) throw error;

        // Map the count from report_export_forms to a flat property
        const mappedData = data.map((item: any) => ({
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

        if (error) throw error;
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

        if (error) throw error;
        return data as ReportExportForm[];
    },

    async delete(id: string) {
        // Note: Cascading deletes should ideally be handled by the database foreign keys.
        // If not, we might need to delete report_export_forms first.
        // Assuming DB handles cascade or we try to delete parent.

        // First delete related export forms (safeguard)
        await supabase.from('report_export_forms').delete().eq('export_id', id);

        const { error } = await supabase
            .from('report_exports')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

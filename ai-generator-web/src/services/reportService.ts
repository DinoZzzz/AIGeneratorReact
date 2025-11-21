import { supabase } from '../lib/supabase';
import type { ReportForm } from '../types';

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

        if (error) throw error;
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

        if (error) throw error;
        return data as ReportForm[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('report_forms')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as ReportForm;
    },

    async create(report: Partial<ReportForm>) {
        const { data, error } = await supabase
            .from('report_forms')
            .insert(report)
            .select()
            .single();

        if (error) throw error;
        return data as ReportForm;
    },

    async update(id: string, report: Partial<ReportForm>) {
        const { data, error } = await supabase
            .from('report_forms')
            .update(report)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ReportForm;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('report_forms')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

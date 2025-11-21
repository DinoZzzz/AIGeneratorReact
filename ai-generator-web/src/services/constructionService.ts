import { supabase } from '../lib/supabase';
import type { Construction } from '../types';

export const constructionService = {
    async getByCustomerId(customerId: string) {
        const { data, error } = await supabase
            .from('constructions')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Construction[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('constructions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Construction;
    },

    async create(construction: Partial<Construction>) {
        const { data, error } = await supabase
            .from('constructions')
            .insert([construction])
            .select()
            .single();

        if (error) throw error;
        return data as Construction;
    },

    async update(id: string, construction: Partial<Construction>) {
        const { data, error } = await supabase
            .from('constructions')
            .update(construction)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Construction;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('constructions')
            .delete()
            .eq('id', id);

        if (error) throw error;
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
        if (error) throw error;
        return data.length > 0;
    }
};

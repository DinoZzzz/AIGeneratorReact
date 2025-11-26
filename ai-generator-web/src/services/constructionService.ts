import { supabase } from '../lib/supabase';
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

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data as Construction[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('constructions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
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

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data as Construction;
    },

    async update(id: string, construction: Partial<Construction>) {
        const { data, error } = await supabase
            .from('constructions')
            .update(construction)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data as Construction;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('constructions')
            .delete()
            .eq('id', id);

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
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
        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data.length > 0;
    },

    async archive(id: string) {
        const { data, error } = await supabase
            .from('constructions')
            .update({ is_archived: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data as Construction;
    },

    async unarchive(id: string) {
        const { data, error } = await supabase
            .from('constructions')
            .update({ is_archived: false })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data as Construction;
    }
};

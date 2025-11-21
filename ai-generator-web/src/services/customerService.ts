import { supabase } from '../lib/supabase';
import type { Customer } from '../types';

export const customerService = {
    async getAll() {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('name');

        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(customer: Partial<Customer>) {
        const { data, error } = await supabase
            .from('customers')
            .insert([customer])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, customer: Partial<Customer>) {
        const { data, error } = await supabase
            .from('customers')
            .update(customer)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async checkWorkOrderExists(workOrder: string, excludeId?: string) {
        let query = supabase
            .from('customers')
            .select('id')
            .eq('work_order', workOrder);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.length > 0;
    },

    async checkNameExists(name: string, excludeId?: string) {
        let query = supabase
            .from('customers')
            .select('id')
            .eq('name', name);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.length > 0;
    }
};

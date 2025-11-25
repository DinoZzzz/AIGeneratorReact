import { supabase } from '../lib/supabase';
import type { Customer } from '../types';
import { AppError, NotFoundError, withErrorHandling } from '../lib/errorHandler';

export const customerService = {
    async getAll() {
        const { data, error } = await supabase
            .from('customers')
            .select('id, name, location, work_order, address')
            .order('name');

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data;
    },

    async getCustomers(
        page: number = 1,
        pageSize: number = 10,
        sortBy: string = 'name',
        sortOrder: 'asc' | 'desc' = 'asc',
        search: string = ''
    ) {
        let query = supabase
            .from('customers')
            .select('id, name, location, work_order, address', { count: 'exact' });

        if (search) {
            // Sanitize search input by removing commas to prevent Supabase OR syntax errors
            const sanitizedSearch = search.replace(/,/g, '');
            if (sanitizedSearch) {
                query = query.or(
                    `name.ilike.%${sanitizedSearch}%,location.ilike.%${sanitizedSearch}%,work_order.ilike.%${sanitizedSearch}%,address.ilike.%${sanitizedSearch}%`
                );
            }
        }

        // Map UI sort keys to DB columns if necessary (they seem to match snake_case mostly)
        // Assuming sortBy is passed as the DB column name
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        const { data, error, count } = await query.range(start, end);

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return { data, count };
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundError('Customer');
            }
            throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        }
        return data;
    },

    async create(customer: Partial<Customer>) {
        const { data, error } = await supabase
            .from('customers')
            .insert([customer])
            .select()
            .single();

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data;
    },

    async update(id: string, customer: Partial<Customer>) {
        const { data, error } = await supabase
            .from('customers')
            .update(customer)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
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
        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
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
        if (error) throw new AppError(error.message, 'SUPABASE_ERROR', 500);
        return data.length > 0;
    }
};

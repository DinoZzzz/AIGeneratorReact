import { supabase } from '../lib/supabase';
import type { Customer } from '../types';
import { AppError, NotFoundError } from '../lib/errorHandler';

export const customerService = {
    async getAll() {
        const { data, error } = await supabase
            .from('customers')
            .select('id, name, location, work_order, address, created_at')
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
        // If sorting by activity, use special query with joins
        if (sortBy === 'last_activity') {
            return this.getCustomersWithActivity(page, pageSize, sortOrder, search);
        }

        let query = supabase
            .from('customers')
            .select('id, name, location, work_order, address, created_at', { count: 'exact' });

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

    async getCustomersWithActivity(
        page: number = 1,
        pageSize: number = 10,
        sortOrder: 'asc' | 'desc' = 'desc',
        search: string = ''
    ) {
        // First, get all customers with search filter
        let customerQuery = supabase
            .from('customers')
            .select('id, name, location, work_order, address, created_at, updated_at');

        if (search) {
            const sanitizedSearch = search.replace(/,/g, '');
            if (sanitizedSearch) {
                customerQuery = customerQuery.or(
                    `name.ilike.%${sanitizedSearch}%,location.ilike.%${sanitizedSearch}%,work_order.ilike.%${sanitizedSearch}%,address.ilike.%${sanitizedSearch}%`
                );
            }
        }

        const { data: customers, error: customersError } = await customerQuery;
        if (customersError) throw new AppError(customersError.message, 'SUPABASE_ERROR', 500);
        if (!customers || customers.length === 0) return { data: [], count: 0 };

        const customerIds = customers.map(c => c.id);

        // Get all related activities in parallel
        const [
            { data: constructions },
            { data: reports },
            { data: exports },
            { data: appointments }
        ] = await Promise.all([
            supabase.from('constructions').select('customer_id, updated_at').in('customer_id', customerIds),
            supabase.from('report_forms').select('customer_id, updated_at').in('customer_id', customerIds),
            supabase.from('report_exports').select('customer_id, updated_at').in('customer_id', customerIds),
            supabase.from('appointments').select('customer_id, created_at').in('customer_id', customerIds)
        ]);

        // Calculate last activity for each customer
        const customersWithActivity = customers.map(customer => {
            const dates = [
                customer.updated_at,
                ...(constructions?.filter(c => c.customer_id === customer.id).map(c => c.updated_at) || []),
                ...(reports?.filter(r => r.customer_id === customer.id).map(r => r.updated_at) || []),
                ...(exports?.filter(e => e.customer_id === customer.id).map(e => e.updated_at) || []),
                ...(appointments?.filter(a => a.customer_id === customer.id).map(a => a.created_at) || [])
            ].filter(Boolean);

            const lastActivityDate = dates.length > 0
                ? new Date(Math.max(...dates.map(d => new Date(d as string).getTime())))
                : new Date(customer.created_at);

            return {
                id: customer.id,
                name: customer.name,
                location: customer.location,
                work_order: customer.work_order,
                address: customer.address,
                created_at: customer.created_at,
                last_activity_date: lastActivityDate.toISOString()
            };
        });

        // Sort by activity
        customersWithActivity.sort((a, b) => {
            const dateA = new Date(a.last_activity_date).getTime();
            const dateB = new Date(b.last_activity_date).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        // Apply pagination
        const totalCount = customersWithActivity.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedData = customersWithActivity.slice(start, end);

        return { data: paginatedData, count: totalCount };
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
